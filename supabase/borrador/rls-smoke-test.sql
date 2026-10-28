\set ON_ERROR_STOP 1
-- Prueba rápida de RLS y funciones (borrador fase 1)
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@test.local'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'b@test.local');

create or replace function pg_temp.expect_error(p_sql text, p_label text) returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'FALLO: % debería haber fallado', p_label;
exception when others then
  if sqlerrm like 'FALLO:%' then raise; end if;
  raise notice 'OK (error esperado) %: %', p_label, sqlerrm;
end $$;
create or replace function pg_temp.check(p_ok boolean, p_label text) returns void language plpgsql as $$
begin
  if not p_ok then raise exception 'FALLO: %', p_label; end if;
  raise notice 'OK %', p_label;
end $$;
grant execute on all functions in schema pg_temp to anon, authenticated;

select pg_temp.check((select count(*) = 2 from public.profiles), 'perfil automático al crear usuaria');
insert into public.entitlements (user_id, product_code, source) values ('aaaaaaaa-0000-0000-0000-000000000001', 'clienta_en_radar', 'dev_grant');

-- Usuaria A con acceso
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001"}';
insert into public.inquiries (id, customer_label, summary, channel) values ('11111111-0000-0000-0000-000000000001', 'Laura', 'Pregunta por precios', 'instagram');
select pg_temp.expect_error($$insert into public.inquiries (id, customer_label, summary) values ('11111111-0000-0000-0000-000000000001', 'Laura', 'Repetida')$$, 'doble envío con mismo id');
commit;

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001"}';
select pg_temp.expect_error($$insert into public.inquiries (customer_label, summary) values ('   ', 'x')$$, 'nombre solo con espacios');
insert into public.inquiries (summary, next_action, status) values ('Consulta sin nombre', 'Enviar presupuesto', 'resuelta');
select pg_temp.check((select resolved_at is not null and customer_label is null from public.inquiries where summary = 'Consulta sin nombre'), 'nombre opcional y creada ya resuelta con resolved_at');
select pg_temp.expect_error($$insert into public.inquiries (summary) values ('   ')$$, 'descripción obligatoria');
update public.inquiries set status = 'resuelta' where id = '11111111-0000-0000-0000-000000000001';
select pg_temp.check((select resolved_at is not null from public.inquiries where id = '11111111-0000-0000-0000-000000000001'), 'resolved_at al resolver');
update public.inquiries set status = 'por_responder', follow_up_on = current_date - 1 where id = '11111111-0000-0000-0000-000000000001';
select pg_temp.check((select resolved_at is null from public.inquiries where id = '11111111-0000-0000-0000-000000000001'), 'resolved_at se limpia al reabrir');
select pg_temp.check((select count(*) = 4 from public.inquiry_events where inquiry_id = '11111111-0000-0000-0000-000000000001'), 'historial: creada + 2 cambios de estado + seguimiento');
select pg_temp.expect_error($$update public.inquiries set user_id = 'bbbbbbbb-0000-0000-0000-000000000002'$$, 'cambiar propietaria');
select pg_temp.expect_error($$update public.inquiries set resolved_at = now()$$, 'escribir resolved_at a mano');
select pg_temp.expect_error($$insert into public.inquiry_events (inquiry_id, user_id, event_type) values ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'created')$$, 'falsear historial');
select pg_temp.expect_error($$insert into public.entitlements (user_id, product_code, source) values ('aaaaaaaa-0000-0000-0000-000000000001', 'clienta_en_radar', 'manual')$$, 'concederse acceso');
select pg_temp.expect_error($$select * from public.payment_events$$, 'leer payment_events');
select pg_temp.expect_error($$select public.process_payment_succeeded('evt_x', 'x', 'a@test.local', 'pi_x', now())$$, 'ejecutar función de pagos');
select pg_temp.expect_error($$update public.profiles set timezone = 'Marte/Olympus'$$, 'zona horaria inválida');
commit;

-- Usuaria B sin acceso
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-0000-0000-000000000002"}';
select pg_temp.expect_error($$insert into public.inquiries (customer_label, summary) values ('Ana', 'Hola')$$, 'B sin compra no puede crear');
select pg_temp.check((select public.has_access() = false), 'B no tiene acceso');
commit;

insert into public.entitlements (user_id, product_code, source) values ('bbbbbbbb-0000-0000-0000-000000000002', 'clienta_en_radar', 'dev_grant');

-- Usuaria B con acceso intenta tocar lo de A
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"bbbbbbbb-0000-0000-0000-000000000002"}';
insert into public.inquiries (customer_label, summary) values ('Ana', 'Consulta de B');
select pg_temp.check((select count(*) = 1 from public.inquiries), 'B solo ve su consulta');
select pg_temp.check((select count(*) = 0 from public.inquiries where id = '11111111-0000-0000-0000-000000000001'), 'B no ve la de A por id');
select pg_temp.check((select count(*) = 0 from public.inquiry_events where user_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'B no ve historial de A');
select pg_temp.check((select count(*) = 1 from public.profiles), 'B solo ve su perfil');
with u as (update public.inquiries set summary = 'hackeado' where id = '11111111-0000-0000-0000-000000000001' returning 1) select pg_temp.check((select count(*) = 0 from u), 'B no edita lo de A');
with d as (delete from public.inquiries where id = '11111111-0000-0000-0000-000000000001' returning 1) select pg_temp.check((select count(*) = 0 from d), 'B no borra lo de A');
select pg_temp.expect_error($$insert into public.inquiries (user_id, customer_label, summary) values ('aaaaaaaa-0000-0000-0000-000000000001', 'x', 'y')$$, 'B crea a nombre de A');
commit;

-- anon
begin;
set local role anon;
select pg_temp.expect_error($$select * from public.inquiries$$, 'anon lee consultas');
select pg_temp.expect_error($$select * from public.profiles$$, 'anon lee perfiles');
commit;

-- Pagos (como service_role)
begin;
set local role service_role;
select pg_temp.check((select public.process_payment_succeeded('evt_1', 'checkout.session.completed', 'B@Test.local', 'pi_1', now()) = 'granted'), 'pago concede');
select pg_temp.check((select public.process_payment_succeeded('evt_1', 'checkout.session.completed', 'B@Test.local', 'pi_1', now()) = 'duplicate'), 'mismo evento = duplicado');
select pg_temp.check((select public.process_payment_succeeded('evt_2', 'checkout.session.async_payment_succeeded', 'b@test.local', 'pi_1', now()) = 'already_granted'), 'otro evento del mismo pago no duplica');
select pg_temp.check((select count(*) = 1 from public.entitlements where provider_payment_id = 'pi_1'), 'un solo derecho por pago');
select pg_temp.check((select user_id = 'bbbbbbbb-0000-0000-0000-000000000002' and purchaser_email = 'b@test.local' from public.entitlements where provider_payment_id = 'pi_1'), 'si ya hay cuenta con ese email, se vincula al momento (sin distinguir mayúsculas)');
select pg_temp.check((select public.process_payment_reversed('evt_3', 'charge.refunded', 'pi_1', 'refund') = 'revoked'), 'reembolso revoca');
select pg_temp.check((select public.process_payment_reversed('evt_3', 'charge.refunded', 'pi_1', 'refund') = 'duplicate'), 'reembolso repetido = duplicado');
commit;

-- Revocación: A pierde acceso pero puede leer y borrar (RGPD)
update public.entitlements set status = 'revoked', revoked_at = now(), revoke_reason = 'manual' where user_id = 'aaaaaaaa-0000-0000-0000-000000000001';
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"aaaaaaaa-0000-0000-0000-000000000001"}';
select pg_temp.check((select count(*) = 2 from public.inquiries), 'A revocada puede leer (exportar)');
with u as (update public.inquiries set summary = 'cambio' returning 1) select pg_temp.check((select count(*) = 0 from u), 'A revocada no edita');
select pg_temp.expect_error($$insert into public.inquiries (customer_label, summary) values ('x', 'y')$$, 'A revocada no crea');
with d as (delete from public.inquiries returning 1) select pg_temp.check((select count(*) = 2 from d), 'A revocada puede borrar');
rollback;

-- Primera compradora
insert into public.promotions (code, starts_at, ends_at) values ('lanzamiento', now() - interval '10 days', now() - interval '5 days');
begin;
set local role service_role;
-- Los webhooks llegan desordenados: el cobro más antiguo llega el último
select public.process_payment_succeeded('evt_p3', 'x', 'c3@test.local', 'pi_c', now() - interval '6 days');
select public.process_payment_succeeded('evt_p2', 'x', 'c2@test.local', 'pi_b', now() - interval '8 days');
select public.process_payment_succeeded('evt_p1', 'x', 'c1@test.local', 'pi_a', now() - interval '9 days');
select public.process_payment_succeeded('evt_p4', 'x', 'a@test.local', 'pi_fuera', now() - interval '1 day');
select pg_temp.check((select count(*) = 3 from public.promotion_entries), 'solo entran cobros dentro de la ventana');
select public.process_payment_reversed('evt_p5', 'charge.refunded', 'pi_a', 'refund');
select pg_temp.expect_error($$select public.select_promotion_winner('lanzamiento', interval '7 days')$$, 'no decide antes del margen');
select pg_temp.check((select provider_payment_id = 'pi_b' from public.entitlements where id = (select public.select_promotion_winner('lanzamiento'))), 'gana el cobro más antiguo no reembolsado, no el primer webhook');
select pg_temp.expect_error($$select public.select_promotion_winner('lanzamiento')$$, 'no se decide dos veces');
commit;

-- Compra con Payment Link antes de tener cuenta: el acceso espera a que entre con ese email
begin;
set local role service_role;
select pg_temp.check((select public.process_payment_succeeded('evt_n1', 'checkout.session.completed', ' Nueva@Test.local ', 'pi_n1', now()) = 'granted'), 'pago sin cuenta concede igualmente');
select pg_temp.check((select user_id is null and purchaser_email = 'nueva@test.local' from public.entitlements where provider_payment_id = 'pi_n1'), 'queda pendiente de reclamar, con el email normalizado');
commit;

insert into auth.users (id, email) values
  ('cccccccc-0000-0000-0000-000000000003', 'Nueva@test.LOCAL'),
  ('dddddddd-0000-0000-0000-000000000004', 'otra@test.local');

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"dddddddd-0000-0000-0000-000000000004","email":"otra@test.local"}';
select pg_temp.check((select public.claim_entitlements() = 0), 'otra usuaria no puede reclamar una compra ajena');
select pg_temp.check((select public.has_access() = false), 'otra usuaria sigue sin acceso');
select pg_temp.check((select count(*) = 0 from public.entitlements), 'no ve compras pendientes de nadie');
commit;

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"cccccccc-0000-0000-0000-000000000003","email":"Nueva@test.LOCAL"}';
select pg_temp.check((select public.has_access() = false), 'antes de reclamar no hay acceso');
select pg_temp.check((select public.claim_entitlements() = 1), 'al entrar con su email reclama su compra');
select pg_temp.check((select public.has_access()), 'después de reclamar tiene acceso');
select pg_temp.check((select public.claim_entitlements() = 0), 'reclamar dos veces no hace nada');
commit;

begin;
set local role anon;
select pg_temp.expect_error($$select public.claim_entitlements()$$, 'anon no puede reclamar');
commit;

-- Rate limit
begin;
set local role service_role;
select pg_temp.check((select public.check_rate_limit('export:a', 2, 60)), 'rate 1');
select pg_temp.check((select public.check_rate_limit('export:a', 2, 60)), 'rate 2');
select pg_temp.check((select not public.check_rate_limit('export:a', 2, 60)), 'rate 3 bloqueado');
commit;

\echo TODAS_LAS_PRUEBAS_OK
