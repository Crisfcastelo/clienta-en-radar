# Fase 3 · Supabase y acceso

## Qué hay

- **Base de datos**: `supabase/migrations/20261028180000_init.sql`. Tablas, RLS en todas, permisos mínimos, historial
  por trigger, pagos idempotentes, compra ligada al email y primera compradora.
- **Pruebas de seguridad**: `supabase/tests/rls-smoke-test.sql`. Dos usuarias, sin compra, con compra revocada, `anon`,
  intentos de saltarse permisos, pagos repetidos, reembolsos y primera compradora.
- **Acceso**: email y código de 6 cifras (Supabase Auth). Sin contraseñas.
- **Sesión**: cookies `httpOnly`, `SameSite=Lax` y `Secure` en producción. La app nunca usa Supabase desde el
  navegador.
- **Comprobación de acceso**: en cada página privada, en el servidor (`requireUser`), y además en la base de datos
  (RLS): sin una compra activa no se puede crear ni editar nada.

## Desarrollo en local

Necesita Docker.

```bash
npx supabase start            # base de datos, Auth y Mailpit
npx supabase status -o env    # URLs y claves locales
```

Crea `.env.local` (no se sube a git):

```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY de supabase status>
```

Los registros están cerrados, así que primero crea tu cuenta de prueba (con el email ya confirmado):

```bash
supabase/dev/crear-cuenta.sh tu@email.es
```

Los códigos de acceso llegan a Mailpit: http://127.0.0.1:54324. Para darte acceso de prueba:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -v email='tu@email.es' -f supabase/dev/conceder-acceso.sql
```

Sin Supabase se puede ver la app con datos ficticios: `DEMO_MODE=true npm run dev`.

## Puesta en marcha del proyecto real

Proyecto `clienta-en-radar` (ref `iidpuccxivqafxgxssqb`), Frankfurt, organización Crisfcastelo. Emails con Resend desde
el dominio `crisfcastelo.com`, remitente `acceso@crisfcastelo.com`.

1. ~~Crear el proyecto~~ hecho el 28/10/2026.
2. ~~Aplicar la migración~~ hecho con el conector, registrada con la versión `20261028180000` para que
   `npx supabase db push` no la repita. Las siguientes: `npx supabase link --project-ref iidpuccxivqafxgxssqb` y
   `npx supabase db push`, siempre con confirmación previa.
3. **Authentication > Sign In / Providers**: desactivar "Allow new users to sign up" (las cuentas las crea el
   servidor al cobrar). En **Email**: email activado, "Confirm email" activado, caducidad del código
   (Email OTP Expiration) en 600 segundos, longitud 6.
4. **Authentication > Email Templates**: en "Magic link" y en "Confirm signup", asunto «Tu código para entrar en
   Clienta en Radar» y el contenido de `supabase/templates/codigo-acceso.html`.
5. **SMTP con Resend** en Authentication > SMTP Settings: host `smtp.resend.com`, puerto `465`, usuario `resend`,
   contraseña una API key de Resend con permiso solo de envío (se escribe directamente en el panel, nunca en el
   repositorio ni en el chat), remitente `acceso@crisfcastelo.com` con nombre «Clienta en Radar». Sin esto Supabase
   solo envía a los miembros del equipo y con un límite muy bajo.
6. **URL Configuration**: Site URL con el dominio de la app.
7. **Rate limits**: revisar los de envío de emails y verificación de códigos según el volumen esperado.
8. **Variables en Vercel** (solo servidor): `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY`. La clave secreta aún no hace
   falta; llegará con Stripe y con el borrado de cuenta.
9. **Repetir las pruebas de seguridad** contra el proyecto de pruebas (nunca contra el de producción con datos reales).

## Decisiones de esta fase

- **Registros cerrados** ("Allow new users to sign up" desactivado y `shouldCreateUser: false`). Las cuentas solo
  se crean en el servidor al cobrar, con el email ya confirmado. Motivo: una E2E demostró que si alguien registra con
  contraseña el email de una clienta antes que ella, esa contraseña sigue sirviendo después de que la clienta entre
  con su código. Con los registros cerrados nadie puede preparar esa cuenta.
- Pedir un código con un email sin cuenta responde lo mismo que con cuenta («si tu email tiene acceso, te hemos
  enviado un código»): no se revela quién ha comprado. Tener cuenta no da acceso; la compra sí.
- Una compra hecha antes de tener cuenta se vincula al entrar con el mismo email (sin distinguir mayúsculas). El
  código por email demuestra que el email es suyo.
- Una compra solo se vincula a una cuenta con el email **confirmado**, y el email sale de `auth.users`, nunca del
  token. Así nadie se queda una compra registrando antes el email de otra persona
  (`20261029100000_vincular_solo_email_confirmado.sql`). En local la confirmación de email está activada, igual que en
  el proyecto real.
- Exportar los datos solo exige sesión, no compra: tras un reembolso se pueden seguir descargando.
- El modo demostración (`DEMO_MODE=true`) se conserva para enseñar la app sin base de datos. Nunca con clientas reales.
