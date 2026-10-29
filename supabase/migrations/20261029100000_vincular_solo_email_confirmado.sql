-- Una compra solo se vincula a una cuenta cuyo email está confirmado.
-- Evita que alguien registre antes el email de una clienta (sin confirmarlo) y se quede su compra.

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

  -- Solo una cuenta con el email confirmado. Si no la hay, la compra queda pendiente
  -- hasta que entre con ese email (claim_entitlements).
  select u.id into v_user_id
  from auth.users u
  where lower(u.email) = v_email
    and u.email_confirmed_at is not null
  limit 1;

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

-- El email sale de auth.users y tiene que estar confirmado: no se usa el que viene en el token.
create or replace function public.claim_entitlements()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_email   text;
  v_claimed integer;
begin
  if v_user_id is null then
    return 0;
  end if;

  select lower(u.email) into v_email
  from auth.users u
  where u.id = v_user_id
    and u.email_confirmed_at is not null;

  if v_email is null then
    return 0;
  end if;

  update public.entitlements
  set user_id = v_user_id
  where user_id is null
    and purchaser_email = v_email;

  get diagnostics v_claimed = row_count;
  return v_claimed;
end;
$$;

revoke execute on function public.process_payment_succeeded(text, text, text, text, timestamptz, text) from public, anon, authenticated;
revoke execute on function public.claim_entitlements() from public, anon;
grant execute on function public.claim_entitlements() to authenticated;
