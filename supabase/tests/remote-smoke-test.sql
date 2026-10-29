-- Pruebas de seguridad para el proyecto Supabase real, desde el SQL Editor del panel.
-- Todo va en un bloque que termina con un error a propósito: así se deshace entero y no deja datos.
-- Resultado correcto: un error que empieza por PRUEBAS_OK. Cualquier mensaje con FALLO es un problema.
do $$
declare
  a uuid := 'aaaaaaaa-0000-0000-0000-0000000000a1';
  b uuid := 'bbbbbbbb-0000-0000-0000-0000000000b2';
  n int;
  r text;
  ok text[] := '{}';
  failed boolean;
begin
  insert into auth.users (id, email, aud, role, email_confirmed_at) values
    (a, 'ana@prueba.local', 'authenticated', 'authenticated', now()),
    (b, 'bea@prueba.local', 'authenticated', 'authenticated', now());
  select count(*) into n from public.profiles where id in (a, b);
  if n <> 2 then raise exception 'FALLO perfil automático'; end if;
  ok := ok || 'perfil automático'::text;
  insert into public.entitlements (user_id, product_code, source) values (a, 'clienta_en_radar', 'dev_grant');

  -- Ana, con acceso
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'email', 'ana@prueba.local', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  insert into public.inquiries (id, customer_label, summary) values ('11111111-0000-0000-0000-0000000000a1', 'Laura', 'Dato privado de Ana');
  ok := ok || 'Ana crea consultas'::text;
  failed := false;
  begin insert into public.entitlements (user_id, product_code, source) values (a, 'x_x', 'manual'); exception when others then failed := true; end;
  if not failed then raise exception 'FALLO Ana se da acceso a sí misma'; end if;
  ok := ok || 'nadie se da acceso'::text;
  failed := false;
  begin update public.inquiries set user_id = b where customer_label = 'Laura'; exception when others then failed := true; end;
  if not failed then raise exception 'FALLO se puede cambiar la dueña'; end if;
  ok := ok || 'no se cambia la dueña'::text;
  failed := false;
  begin perform public.process_payment_succeeded('evt_x', 't', 'ana@prueba.local', 'pi_x', now()); exception when others then failed := true; end;
  if not failed then raise exception 'FALLO una usuaria puede simular un pago'; end if;
  ok := ok || 'nadie simula un pago'::text;
  failed := false;
  begin perform public.check_rate_limit('k', 1, 60); exception when others then failed := true; end;
  if not failed then raise exception 'FALLO rate limit expuesto'; end if;
  failed := false;
  begin perform count(*) from public.payment_events; exception when others then failed := true; end;
  if not failed then raise exception 'FALLO pagos legibles'; end if;
  ok := ok || 'tablas internas cerradas'::text;
  execute 'reset role';

  -- Bea, sin compra
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'email', 'bea@prueba.local', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  if public.has_access() then raise exception 'FALLO acceso sin compra'; end if;
  failed := false;
  begin insert into public.inquiries (summary) values ('x'); exception when others then failed := true; end;
  if not failed then raise exception 'FALLO crea sin compra'; end if;
  ok := ok || 'sin compra no crea'::text;
  select count(*) into n from public.inquiries;
  if n <> 0 then raise exception 'FALLO Bea ve consultas de Ana'; end if;
  select count(*) into n from public.inquiry_events;
  if n <> 0 then raise exception 'FALLO Bea ve el historial de Ana'; end if;
  update public.inquiries set summary = 'cambiado';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO Bea edita consultas de Ana'; end if;
  delete from public.inquiries;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FALLO Bea borra consultas de Ana'; end if;
  select count(*) into n from public.entitlements;
  if n <> 0 then raise exception 'FALLO Bea ve compras de Ana'; end if;
  select count(*) into n from public.profiles;
  if n <> 1 then raise exception 'FALLO perfiles ajenos visibles'; end if;
  ok := ok || 'aislamiento entre usuarias'::text;
  execute 'reset role';

  -- Sin sesión
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  execute 'set local role anon';
  failed := false;
  begin perform count(*) from public.inquiries; exception when others then failed := true; end;
  if not failed then raise exception 'FALLO sin sesión se leen consultas'; end if;
  failed := false;
  begin perform public.has_access(); exception when others then failed := true; end;
  if not failed then raise exception 'FALLO sin sesión se consulta el acceso'; end if;
  ok := ok || 'sin sesión no hay nada'::text;
  execute 'reset role';

  -- Pagos (como el servidor): email en mayúsculas, eventos repetidos
  r := public.process_payment_succeeded('evt_prueba_1', 'checkout.session.completed', 'BEA@Prueba.local', 'pi_prueba_1', now());
  if r <> 'granted' then raise exception 'FALLO pago: %', r; end if;
  r := public.process_payment_succeeded('evt_prueba_1', 'checkout.session.completed', 'bea@prueba.local', 'pi_prueba_1', now());
  if r <> 'duplicate' then raise exception 'FALLO evento repetido: %', r; end if;
  r := public.process_payment_succeeded('evt_prueba_2', 'checkout.session.completed', 'bea@prueba.local', 'pi_prueba_1', now());
  if r <> 'already_granted' then raise exception 'FALLO mismo pago con otro evento: %', r; end if;
  select count(*) into n from public.entitlements where user_id = b and status = 'active';
  if n <> 1 then raise exception 'FALLO la compra no se vincula'; end if;
  ok := ok || 'pagos sin duplicados'::text;

  -- Compra antes de tener cuenta
  r := public.process_payment_succeeded('evt_prueba_3', 'checkout.session.completed', 'Nueva@Prueba.local', 'pi_prueba_3', now());
  insert into auth.users (id, email, aud, role, email_confirmed_at) values ('cccccccc-0000-0000-0000-0000000000c3', 'nueva@prueba.local', 'authenticated', 'authenticated', now());
  -- Un token con el email de la compradora no basta: cuenta el email de la cuenta
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'email', 'nueva@prueba.local', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  if public.claim_entitlements() <> 0 then raise exception 'FALLO se reclama con un email falseado en el token'; end if;
  execute 'reset role';
  ok := ok || 'email falseado no reclama'::text;
  perform set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-0000000000c3","email":"nueva@prueba.local","role":"authenticated"}', true);
  execute 'set local role authenticated';
  if public.has_access() then raise exception 'FALLO acceso antes de reclamar la compra'; end if;
  if public.claim_entitlements() <> 1 then raise exception 'FALLO no se reclama la compra'; end if;
  if not public.has_access() then raise exception 'FALLO sin acceso tras reclamar'; end if;
  ok := ok || 'compra previa se vincula'::text;
  execute 'reset role';

  -- Cuenta con el email de una clienta pero sin confirmar (registrada por otra persona)
  insert into auth.users (id, email, aud, role) values ('dddddddd-0000-0000-0000-0000000000d4', 'pillada@prueba.local', 'authenticated', 'authenticated');
  r := public.process_payment_succeeded('evt_prueba_5', 'checkout.session.completed', 'pillada@prueba.local', 'pi_prueba_5', now());
  select count(*) into n from public.entitlements where provider_payment_id = 'pi_prueba_5' and user_id is not null;
  if n <> 0 then raise exception 'FALLO la compra se vincula a una cuenta sin confirmar'; end if;
  perform set_config('request.jwt.claims', '{"sub":"dddddddd-0000-0000-0000-0000000000d4","email":"pillada@prueba.local","role":"authenticated"}', true);
  execute 'set local role authenticated';
  if public.claim_entitlements() <> 0 then raise exception 'FALLO una cuenta sin confirmar reclama la compra'; end if;
  if public.has_access() then raise exception 'FALLO una cuenta sin confirmar tiene acceso'; end if;
  execute 'reset role';
  ok := ok || 'cuenta sin confirmar no se queda la compra'::text;

  -- Reembolso
  r := public.process_payment_reversed('evt_prueba_4', 'charge.refunded', 'pi_prueba_1', 'refund');
  if r <> 'revoked' then raise exception 'FALLO reembolso: %', r; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'email', 'bea@prueba.local', 'role', 'authenticated')::text, true);
  execute 'set local role authenticated';
  if public.has_access() then raise exception 'FALLO acceso tras reembolso'; end if;
  ok := ok || 'reembolso quita acceso'::text;
  execute 'reset role';

  raise exception 'PRUEBAS_OK (no se ha guardado nada): %', array_to_string(ok, ', ');
end $$;
