-- Concede acceso de prueba (dev_grant) a una cuenta. Solo para entornos de desarrollo o pruebas.
-- Uso: psql "$DATABASE_URL" -v email='tu@email.es' -f supabase/dev/conceder-acceso.sql
insert into public.entitlements (user_id, purchaser_email, product_code, source)
select u.id, lower(u.email), 'clienta_en_radar', 'dev_grant'
from auth.users u
where lower(u.email) = lower(:'email')
  and not exists (
    select 1 from public.entitlements e
    where e.user_id = u.id and e.product_code = 'clienta_en_radar' and e.status = 'active'
  );
