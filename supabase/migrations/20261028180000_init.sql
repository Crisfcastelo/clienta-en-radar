-- Clienta en Radar · migración inicial.
-- Requiere el esquema auth de Supabase. Probada con supabase/tests/rls-smoke-test.sql.

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  display_name   text check (display_name is null or char_length(btrim(display_name)) between 1 and 60),
  business_name  text check (business_name is null or char_length(btrim(business_name)) between 1 and 80),
  timezone       text not null default 'Europe/Madrid' check (char_length(timezone) between 1 and 64),
  -- Nulo = no borrar nunca (por defecto): las resueltas quedan en el historial.
  retention_days integer default null check (retention_days is null or retention_days in (90, 180, 365, 730)),
  onboarded_at   timestamptz,
  created_at     timestamptz not null default now()
);

-- Una zona horaria inválida haría fallar el cálculo de "hoy": se valida al guardar.
create or replace function public.validate_profile_timezone()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Zona horaria no válida' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger profiles_validate_timezone
  before insert or update of timezone on public.profiles
  for each row execute function public.validate_profile_timezone();

-- Perfil automático al crear la usuaria en Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- entitlements (derechos de acceso al producto)
-- ---------------------------------------------------------------------------

create table public.entitlements (
  id                  uuid primary key default gen_random_uuid(),
  -- Nulo mientras la compra (hecha con un Payment Link, antes de tener cuenta) no se ha reclamado.
  user_id             uuid references auth.users (id) on delete cascade,
  -- Email de la compra en Stripe, en minúsculas. Necesario para entregar el acceso.
  purchaser_email     text check (purchaser_email is null or (purchaser_email = lower(purchaser_email) and purchaser_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(purchaser_email) <= 254)),
  product_code        text not null check (product_code ~ '^[a-z0-9_]{2,40}$'),
  status              text not null default 'active' check (status in ('active', 'revoked')),
  source              text not null check (source in ('stripe', 'dev_grant', 'manual')),
  provider_payment_id text unique,
  granted_at          timestamptz not null default now(),
  revoked_at          timestamptz,
  revoke_reason       text check (revoke_reason in ('refund', 'dispute', 'manual')),
  constraint entitlements_revoked_coherent check ((status = 'revoked') = (revoked_at is not null)),
  constraint entitlements_stripe_has_payment check (source <> 'stripe' or provider_payment_id is not null),
  constraint entitlements_has_owner check (user_id is not null or purchaser_email is not null)
);

create index entitlements_unclaimed_email_idx
  on public.entitlements (purchaser_email)
  where user_id is null;

create index entitlements_user_active_idx
  on public.entitlements (user_id, product_code)
  where status = 'active';

create or replace function public.has_access(p_product text default 'clienta_en_radar')
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.entitlements e
    where e.user_id = (select auth.uid())
      and e.product_code = p_product
      and e.status = 'active'
  );
$$;

-- ---------------------------------------------------------------------------
-- inquiries (consultas)
-- ---------------------------------------------------------------------------

create table public.inquiries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  customer_label text check (customer_label is null or char_length(btrim(customer_label)) between 1 and 80),
  channel        text check (channel in ('whatsapp', 'instagram', 'email', 'otro')),
  summary        text not null check (char_length(btrim(summary)) between 1 and 280),
  notes          text check (notes is null or char_length(notes) <= 2000),
  next_action    text check (next_action is null or char_length(btrim(next_action)) between 1 and 120),
  status         text not null default 'por_responder'
                 check (status in ('por_responder', 'esperando_respuesta', 'hacer_seguimiento', 'resuelta')),
  follow_up_on   date,
  resolved_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint inquiries_resolved_coherent check ((status = 'resuelta') = (resolved_at is not null))
);

create index inquiries_user_active_idx
  on public.inquiries (user_id, status, follow_up_on)
  where status <> 'resuelta';

create index inquiries_user_created_idx
  on public.inquiries (user_id, created_at desc);

-- Mantiene resolved_at, updated_at y bloquea el cambio de dueña o de fecha de creación.
create or replace function public.inquiries_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.user_id is distinct from old.user_id or new.created_at is distinct from old.created_at then
      raise exception 'No se puede cambiar la propietaria ni la fecha de creación' using errcode = '42501';
    end if;
    new.updated_at := now();
  end if;

  if new.status = 'resuelta' and (tg_op = 'INSERT' or old.status <> 'resuelta') then
    new.resolved_at := now();
  elsif new.status <> 'resuelta' then
    new.resolved_at := null;
  else
    new.resolved_at := old.resolved_at;
  end if;

  return new;
end;
$$;

create trigger inquiries_before_write
  before insert or update on public.inquiries
  for each row execute function public.inquiries_before_write();

-- ---------------------------------------------------------------------------
-- inquiry_events (historial, lo escribe solo el trigger)
-- ---------------------------------------------------------------------------

create table public.inquiry_events (
  id          bigint generated always as identity primary key,
  inquiry_id  uuid not null references public.inquiries (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  event_type  text not null
              check (event_type in ('created', 'status_changed', 'follow_up_changed')),
  old_status  text,
  new_status  text,
  created_at  timestamptz not null default now()
);

create index inquiry_events_inquiry_idx on public.inquiry_events (inquiry_id, created_at);
create index inquiry_events_user_idx on public.inquiry_events (user_id);

create or replace function public.inquiries_log_events()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.inquiry_events (inquiry_id, user_id, event_type, new_status)
    values (new.id, new.user_id, 'created', new.status);
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.inquiry_events (inquiry_id, user_id, event_type, old_status, new_status)
    values (new.id, new.user_id, 'status_changed', old.status, new.status);
  end if;

  if new.follow_up_on is distinct from old.follow_up_on then
    insert into public.inquiry_events (inquiry_id, user_id, event_type)
    values (new.id, new.user_id, 'follow_up_changed');
  end if;

  return new;
end;
$$;

create trigger inquiries_log_events
  after insert or update on public.inquiries
  for each row execute function public.inquiries_log_events();

-- ---------------------------------------------------------------------------
-- response_templates (contenido global del bonus Biblioteca de respuestas)
-- ---------------------------------------------------------------------------

create table public.response_templates (
  id          uuid primary key default gen_random_uuid(),
  category    text not null check (char_length(category) between 1 and 60),
  title       text not null check (char_length(title) between 1 and 120),
  content     text not null check (char_length(content) between 1 and 4000),
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create index response_templates_active_idx
  on public.response_templates (category, sort_order)
  where is_active;

-- ---------------------------------------------------------------------------
-- payment_events (idempotencia de webhooks; sin datos personales)
-- ---------------------------------------------------------------------------

create table public.payment_events (
  id                uuid primary key default gen_random_uuid(),
  provider_event_id text not null unique check (char_length(provider_event_id) between 1 and 255),
  event_type        text not null check (char_length(event_type) between 1 and 100),
  processed_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Primera compradora
-- ---------------------------------------------------------------------------

create table public.promotions (
  code                  text primary key check (code ~ '^[a-z0-9_]{2,40}$'),
  starts_at             timestamptz not null,
  ends_at               timestamptz not null,
  status                text not null default 'open'
                        check (status in ('open', 'winner_selected', 'void')),
  winner_entitlement_id uuid references public.entitlements (id) on delete set null,
  decided_at            timestamptz,
  constraint promotions_window check (ends_at > starts_at)
);

create table public.promotion_entries (
  promotion_code      text not null references public.promotions (code) on delete cascade,
  entitlement_id      uuid not null references public.entitlements (id) on delete cascade,
  provider_payment_id text not null,
  paid_at             timestamptz not null, -- hora del cobro según Stripe, no la de llegada del webhook
  primary key (promotion_code, entitlement_id)
);

create index promotion_entries_order_idx
  on public.promotion_entries (promotion_code, paid_at, provider_payment_id);

-- ---------------------------------------------------------------------------
-- Rate limiting
-- ---------------------------------------------------------------------------

create table public.rate_limits (
  key          text not null check (char_length(key) between 1 and 200),
  window_start timestamptz not null,
  hits         integer not null default 1,
  primary key (key, window_start)
);

create or replace function public.check_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits   integer;
begin
  if p_max <= 0 or p_window_seconds <= 0 then
    raise exception 'Parámetros de rate limit no válidos';
  end if;

  insert into public.rate_limits as r (key, window_start)
  values (p_key, v_window)
  on conflict (key, window_start) do update set hits = r.hits + 1
  returning hits into v_hits;

  return v_hits <= p_max;
end;
$$;

-- ---------------------------------------------------------------------------
-- Pagos: concesión y revocación atómicas e idempotentes
-- ---------------------------------------------------------------------------

create or replace function public.process_payment_succeeded(
  p_event_id   text,
  p_event_type text,
  p_email      text,
  p_payment_id text,
  p_paid_at    timestamptz,
  p_product    text default 'clienta_en_radar'
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email          text := lower(btrim(p_email));
  v_user_id        uuid;
  v_entitlement_id uuid;
begin
  insert into public.payment_events (provider_event_id, event_type)
  values (p_event_id, p_event_type)
  on conflict (provider_event_id) do nothing;

  if not found then
    return 'duplicate';
  end if;

  -- Si ya existe una cuenta con ese email, el acceso queda vinculado al momento.
  -- Si no, queda pendiente hasta que entre con ese email (claim_entitlements).
  select u.id into v_user_id from auth.users u where lower(u.email) = v_email limit 1;

  insert into public.entitlements (user_id, purchaser_email, product_code, status, source, provider_payment_id, granted_at)
  values (v_user_id, v_email, p_product, 'active', 'stripe', p_payment_id, now())
  on conflict (provider_payment_id) do nothing
  returning id into v_entitlement_id;

  if v_entitlement_id is null then
    return 'already_granted';
  end if;

  insert into public.promotion_entries (promotion_code, entitlement_id, provider_payment_id, paid_at)
  select p.code, v_entitlement_id, p_payment_id, p_paid_at
  from public.promotions p
  where p.status = 'open'
    and p_paid_at >= p.starts_at
    and p_paid_at < p.ends_at;

  return 'granted';
end;
$$;

create or replace function public.process_payment_reversed(
  p_event_id   text,
  p_event_type text,
  p_payment_id text,
  p_reason     text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.payment_events (provider_event_id, event_type)
  values (p_event_id, p_event_type)
  on conflict (provider_event_id) do nothing;

  if not found then
    return 'duplicate';
  end if;

  update public.entitlements
  set status = 'revoked', revoked_at = now(), revoke_reason = p_reason
  where provider_payment_id = p_payment_id
    and status = 'active';

  return case when found then 'revoked' else 'nothing_to_revoke' end;
end;
$$;

-- Vincula a la usuaria actual las compras hechas con su email antes de tener cuenta.
-- El email del token está verificado: se entra con un código enviado a ese email.
create or replace function public.claim_entitlements()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email   text := lower((select auth.jwt()) ->> 'email');
  v_claimed integer;
begin
  if (select auth.uid()) is null or v_email is null then
    return 0;
  end if;

  update public.entitlements
  set user_id = (select auth.uid())
  where user_id is null
    and purchaser_email = v_email;

  get diagnostics v_claimed = row_count;
  return v_claimed;
end;
$$;

-- Se ejecuta a mano tras cerrar la promoción. No anuncia nada.
create or replace function public.select_promotion_winner(p_code text, p_grace interval default interval '3 days')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_promo  public.promotions%rowtype;
  v_winner uuid;
begin
  select * into v_promo from public.promotions where code = p_code for update;

  if not found then
    raise exception 'Promoción no encontrada';
  end if;
  if v_promo.status <> 'open' then
    raise exception 'La promoción ya está decidida o anulada';
  end if;
  if now() < v_promo.ends_at + p_grace then
    raise exception 'Todavía no ha pasado el margen tras el cierre';
  end if;

  select pe.entitlement_id into v_winner
  from public.promotion_entries pe
  join public.entitlements e on e.id = pe.entitlement_id
  where pe.promotion_code = p_code
    and e.status = 'active'
  order by pe.paid_at, pe.provider_payment_id -- desempate pendiente de bases legales
  limit 1;

  update public.promotions
  set status = 'winner_selected', winner_entitlement_id = v_winner, decided_at = now()
  where code = p_code;

  return v_winner;
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS y permisos
-- ---------------------------------------------------------------------------

alter table public.profiles           enable row level security;
alter table public.entitlements       enable row level security;
alter table public.inquiries          enable row level security;
alter table public.inquiry_events     enable row level security;
alter table public.response_templates enable row level security;
alter table public.payment_events     enable row level security;
alter table public.promotions         enable row level security;
alter table public.promotion_entries  enable row level security;
alter table public.rate_limits        enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

-- Supabase da permisos amplios por defecto a las tablas y funciones nuevas de public.
-- Se quitan también para las futuras: cada migración tendrá que dar los suyos explícitamente.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- profiles: leer y editar solo lo propio, solo columnas editables
grant select on public.profiles to authenticated;
grant update (display_name, business_name, timezone, retention_days, onboarded_at) on public.profiles to authenticated;

create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- entitlements: la usuaria solo puede ver los suyos; nunca escribir
grant select on public.entitlements to authenticated;
create policy entitlements_select_own on public.entitlements
  for select to authenticated using (user_id = (select auth.uid()));

-- inquiries: leer y borrar lo propio siempre (exportación/borrado RGPD);
-- crear y editar solo con derecho activo
grant select, insert, delete on public.inquiries to authenticated;
grant update (customer_label, channel, summary, notes, next_action, status, follow_up_on) on public.inquiries to authenticated;

create policy inquiries_select_own on public.inquiries
  for select to authenticated using (user_id = (select auth.uid()));
create policy inquiries_insert_own_with_access on public.inquiries
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.has_access()));
create policy inquiries_update_own_with_access on public.inquiries
  for update to authenticated
  using (user_id = (select auth.uid()) and (select public.has_access()))
  with check (user_id = (select auth.uid()));
create policy inquiries_delete_own on public.inquiries
  for delete to authenticated using (user_id = (select auth.uid()));

-- inquiry_events: solo lectura de lo propio
grant select on public.inquiry_events to authenticated;
create policy inquiry_events_select_own on public.inquiry_events
  for select to authenticated using (user_id = (select auth.uid()));

-- response_templates: lectura para usuarias con acceso
grant select on public.response_templates to authenticated;
create policy response_templates_select_with_access on public.response_templates
  for select to authenticated using (is_active and (select public.has_access()));

-- payment_events, promotions, promotion_entries, rate_limits:
-- sin grants ni políticas → solo service role.

grant execute on function public.has_access(text) to authenticated;
grant execute on function public.claim_entitlements() to authenticated;
