# Clienta en Radar · Fase 1

Plan de arquitectura, datos, diseño y pruebas. Pendiente de tu aprobación. No se ha creado código de la app todavía.

---

## 0. Lo que he encontrado en el entorno

| Qué                           | Resultado                                                                                                                                                                                                                                                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repositorio de esta sesión    | `Crisfcastelo/essentia-app` (privado). Es otra app: un CRM para nutrición animal en Vite + React en JavaScript. No tiene nada de Clienta en Radar.                                                                                                                                                               |
| Archivos sensibles en git     | `.env` está subido al repo (URL de Supabase + clave publicable `sb_publishable_...`). Esa clave es pública por diseño, el riesgo es bajo, pero no debería estar en git. `node_modules` también está subido (12.141 archivos) y varios `.DS_Store`.                                                               |
| Proyecto Supabase de Essentia | Apunta a un proyecto que **no** está en tu organización de Supabase (seguramente es de tu clienta, como dice el README). No lo voy a tocar.                                                                                                                                                                      |
| Tus proyectos Supabase        | `autodm` (activo, Frankfurt), `agenda` (inactivo, Frankfurt), `turnos-app` (inactivo, EE. UU.). Ninguno es para esta app.                                                                                                                                                                                        |
| Herramientas                  | Node 22.22, npm 10.9, Supabase CLI 2.122 vía npx, PostgreSQL 16 instalado (binarios), Chromium + Playwright preinstalados. **Docker no está arrancado**, así que el stack local de Supabase (`supabase start`) no funciona aquí.                                                                                 |
| Red                           | `nextjs.org` y `supabase.com` están bloqueados desde esta sesión. He consultado la documentación oficial que viene dentro del paquete `next@16.4.3` y la búsqueda de docs del conector de Supabase. Para Stripe (fase 6) puede que haga falta permitir `docs.stripe.com` en la configuración de red del entorno. |

### Versiones estables actuales (npm, hoy)

| Paquete                     | Versión        | Nota                                                                                                                                |
| --------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| next                        | 16.4.3         | App Router. En Next 16 `middleware.ts` pasa a llamarse `proxy.ts` y `next lint` desaparece (se usa ESLint directo).                 |
| react / react-dom           | 19.x           |                                                                                                                                     |
| typescript                  | 6.0.3          | **No** usaría la 7.0 todavía (es la reescritura en Go y acaba de salir). La 6.0 es la última de la línea clásica y Next pide ≥ 5.1. |
| tailwindcss                 | 4.3            | Configuración en CSS con `@theme`.                                                                                                  |
| @supabase/ssr               | 0.12.7         |                                                                                                                                     |
| @supabase/supabase-js       | 2.118          |                                                                                                                                     |
| stripe                      | 23.0.1         |                                                                                                                                     |
| zod                         | 4.6            | Validación compartida cliente/servidor.                                                                                             |
| vitest                      | 5.0.5          |                                                                                                                                     |
| @playwright/test            | 1.64.1         |                                                                                                                                     |
| eslint / eslint-config-next | 10.13 / 16.4.3 |                                                                                                                                     |

---

## 1. Decisión previa: dónde vive el proyecto

Recomiendo **un repositorio nuevo** (`clienta-en-radar`) y **un proyecto Supabase nuevo** en Frankfurt. Mezclarlo con Essentia complicaría permisos, despliegues y RGPD, y Essentia parece ser el producto de una clienta tuya.

Opciones:

- **A (recomendada):** creas tú el repo vacío `Crisfcastelo/clienta-en-radar` en GitHub y lo añado a la sesión.
- **B:** lo creo yo desde aquí con la herramienta de GitHub (necesito tu OK explícito).
- **C:** carpeta nueva dentro de `essentia-app`. No lo recomiendo.

Aparte, en Essentia convendría sacar `.env` y `node_modules` del repo. No lo toco salvo que me lo pidas.

---

## 2. Simplificaciones que propongo antes de añadir complejidad

1. **Acceso con código de 6 dígitos por email (OTP), sin contraseña ni enlace mágico.** En iPhone, una PWA instalada tiene su propio almacenamiento separado de Safari. Si la usuaria pulsa un enlace mágico desde el correo, se abre Safari y la sesión se queda en Safari, no en la app instalada. Con un código que copia y pega, inicia sesión dentro de la PWA. Además no hay contraseñas que olvidar, así que "recuperar acceso" es simplemente pedir otro código.
2. **Ningún cliente de Supabase en el navegador.** Todo pasa por Server Components y Server Actions. Eso permite marcar las cookies de sesión como `httpOnly` (lo he comprobado en el código de `@supabase/ssr` 0.12.7: `cookieOptions` sobrescribe el `httpOnly: false` por defecto). Menos superficie de ataque y la clave publicable ni siquiera hace falta en el navegador.
3. **Service worker escrito a mano (unas 60 líneas) en `public/sw.js`**, como indica la guía oficial de PWA de Next. Evitamos Serwist, que añade configuración de bundler. Solo cachea estáticos y una página offline.
4. **Fecha de seguimiento como `date` (día), no como fecha+hora.** La usuaria piensa en "revisar el jueves", no "el jueves a las 10:37". Elimina errores de zona horaria y de horario de verano. "Vencido" = fecha anterior a hoy en su zona horaria.
5. **El historial (`inquiry_events`) lo escribe la base de datos con un trigger**, no la app. Así no se puede falsear desde el cliente y no hay código extra.
6. **Rate limiting con una tabla pequeña en Postgres** en vez de añadir otro servicio (Redis/Upstash). Para el login usamos los límites que ya trae Supabase Auth.

---

## 3. Arquitectura

```
Navegador (PWA)
   │  HTML + Server Actions (POST con protección de origen de Next)
   ▼
Next.js 16 en Vercel (región fra1, Frankfurt)
   ├─ proxy.ts ............ refresca sesión y redirige si no hay sesión (comprobación optimista)
   ├─ (app)/layout.tsx .... comprobación real: getClaims() + derecho de acceso en BD
   ├─ features/*/actions .. Server Actions: validan con zod, llaman a la capa de datos
   ├─ features/*/data ..... acceso a datos "server-only" con el cliente de la usuaria (RLS activa)
   └─ api/stripe/webhook .. verifica firma, usa la clave secreta solo aquí
   ▼
Supabase (Frankfurt)
   ├─ Auth (email + código OTP, SMTP propio)
   ├─ Postgres con RLS en todas las tablas + grants mínimos
   └─ pg_cron para la retención de datos
   ▲
Stripe Checkout (precio de 47 € configurado en Stripe) ── webhook ──┘
```

Tres capas de defensa para "solo veo lo mío y solo si he pagado":

1. `proxy.ts`: si no hay sesión, a `/acceso`. Rápido pero no es la autoridad.
2. Layout privado y cada Server Action: `getClaims()` (verifica el JWT) y `has_access()` en BD. Sin derecho activo, a `/sin-acceso`.
3. RLS en Postgres: aunque alguien llame a la API de Supabase directamente con su token, no puede crear ni editar consultas sin derecho activo, ni ver las de otra usuaria.

**Detalle de RLS que quiero que valides:** leer y borrar tus propias consultas se permite siempre (para que una usuaria con reembolso pueda **exportar o borrar** sus datos, que es un derecho RGPD). Crear y editar exige derecho activo. La interfaz igualmente bloquea la app entera sin derecho.

### Cuentas de desarrollo

Una fila en `entitlements` con `source = 'dev_grant'`, que solo se puede crear con SQL desde el panel de Supabase (ningún endpoint lo permite). Queda registrado quién tiene acceso de prueba y se revoca igual que una compra.

### Flujo de compra (fase 6, propuesta por defecto)

1. Se registra con su email (código OTP). Tiene cuenta pero no acceso.
2. Pantalla `/sin-acceso` con botón "Comprar por 47 €".
3. El servidor crea la sesión de Checkout con el `price_id` de Stripe (nunca un importe del navegador), `client_reference_id = user_id` y el email bloqueado.
4. El webhook verifica la firma, **vuelve a pedir a Stripe el estado actual del pago** (así un reembolso que llega antes que el pago no se pierde) y llama a una función SQL que en una sola transacción: registra el evento (idempotente), concede el derecho y apunta la compra en la promoción si aplica.
5. Reembolso total o disputa: misma idea, se revoca el derecho de ese pago.

La alternativa "paga primero y luego se crea la cuenta" encaja mejor con una página de ventas externa, pero obliga a emparejar por email (errores de tecleo, cuentas duplicadas). Te pregunto abajo.

### Primera compradora

- Se guarda cada compra elegible con la **hora del cobro según Stripe** (`charge.created`), nunca la hora de llegada del webhook.
- La ganadora **no se decide sola**. Cuando termina la promoción (más un margen para reintentos de webhooks), una función SQL que solo puede ejecutar el servicio bloquea la fila de la promoción (`FOR UPDATE`), elige el cobro más antiguo cuyo derecho siga activo (no reembolsado) y lo guarda. Todo en una transacción.
- Nada se anuncia automáticamente. Tú revisas, verificas en Stripe y anuncias.
- Empate al segundo: Stripe da la hora en segundos. Hay que fijar en las bases legales un criterio de desempate. Esto es para revisión legal.

---

## 4. Estructura de carpetas

```
clienta-en-radar/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                 fuentes, metadatos, registro del SW
│  │  ├─ manifest.ts                manifest de la PWA
│  │  ├─ page.tsx                   redirige a /hoy o /acceso
│  │  ├─ acceso/                    email → código de 6 dígitos
│  │  ├─ sin-acceso/                cuenta sin compra
│  │  ├─ offline/                   página offline estática
│  │  ├─ legal/                     privacidad, aviso legal, cookies
│  │  ├─ (app)/                     zona privada
│  │  │  ├─ layout.tsx              sesión + derecho; navegación inferior
│  │  │  ├─ hoy/
│  │  │  ├─ consultas/              lista, filtros, búsqueda
│  │  │  ├─ consultas/nueva/
│  │  │  ├─ consultas/[id]/         detalle editable
│  │  │  ├─ ayuda/
│  │  │  └─ ajustes/                perfil, retención, exportar, borrar cuenta
│  │  └─ api/
│  │     ├─ stripe/webhook/route.ts
│  │     └─ exportar/route.ts
│  ├─ features/
│  │  ├─ inquiries/
│  │  │  ├─ domain/                 estados, transiciones, prioridad de Hoy (puro, testeable)
│  │  │  ├─ schema.ts               validación zod compartida
│  │  │  ├─ data.ts                 server-only, consultas a Supabase
│  │  │  ├─ actions.ts              Server Actions
│  │  │  └─ components/
│  │  ├─ auth/
│  │  ├─ access/                    has_access en servidor
│  │  ├─ billing/                   Stripe (server-only)
│  │  └─ help/                      contenido + registro de recursos/bonus
│  ├─ components/ui/                Button, Field, Select, Dialog, Badge, Card, EmptyState, Toast...
│  ├─ lib/
│  │  ├─ supabase/server.ts         cliente con la sesión de la usuaria
│  │  ├─ supabase/admin.ts          clave secreta, `import "server-only"`, solo webhook y borrado de cuenta
│  │  ├─ env.ts                     variables validadas con zod al arrancar
│  │  ├─ dates.ts                   "hoy" en la zona horaria de la usuaria
│  │  └─ rate-limit.ts
│  └─ proxy.ts
├─ public/  sw.js, icons/
├─ supabase/
│  ├─ migrations/                   SQL versionado
│  ├─ seed.sql                      solo datos ficticios
│  └─ tests/                        pruebas de RLS
├─ tests/e2e/                       Playwright
└─ docs/                            arquitectura, RGPD, backups, despliegue
```

Los bonus de Ayuda viven en `features/help/resources.ts` como un registro (`slug`, `título`, `estado: disponible | oculto`, `producto requerido`). Solo se pinta lo disponible, así que no habrá secciones vacías. Activar un bonus será añadir su contenido y cambiar su estado.

---

## 5. Esquema SQL (borrador)

El borrador completo está en `supabase/borrador/0001_init.sql`. Resumen y **cambios respecto a tu modelo**, que necesito que apruebes:

| Tabla                         | Cambios que propongo                                                                  | Por qué                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| profiles                      | + `retention_days` (90/180/365/730 o nulo = nunca, por defecto 365), + `onboarded_at` | Retención configurable por la usuaria. Saber si mostrar la bienvenida.                                                     |
| entitlements                  | + `provider_payment_id` (único), + `revoke_reason`                                    | Para revocar exactamente el pago reembolsado. Una fila por pago.                                                           |
| inquiries                     | `follow_up_at` → `follow_up_on date`. + `archived_at`                                 | Ver simplificación 4. Archivar es independiente del estado: puedes archivar algo que no está resuelto (spam, no interesa). |
| inquiry_events                | `event_type`: created, status_changed, follow_up_changed, archived, unarchived        | Lo escribe un trigger.                                                                                                     |
| response_templates            | + `created_at`                                                                        | Contenido global del bonus, solo lectura para usuarias con acceso.                                                         |
| payment_events                | Sin cambios. No guarda el payload de Stripe (cero datos personales).                  |                                                                                                                            |
| **promotions** (nueva)        | código, inicio, fin, estado, ganadora, fecha de decisión                              | Primera compradora.                                                                                                        |
| **promotion_entries** (nueva) | promoción, derecho, hora de cobro de Stripe, id de pago                               | Primera compradora.                                                                                                        |
| **rate_limits** (nueva)       | clave, ventana, contador                                                              | Rate limiting sin servicios externos.                                                                                      |

Puntos clave del SQL:

- Estados y canales como `text` con `CHECK` en lugar de `enum` (más fácil de cambiar sin migraciones dolorosas).
- Longitudes máximas: nombre 80, resumen 280, notas 2.000. Con `btrim` para no aceptar solo espacios.
- `CHECK` de coherencia: `resuelta` ⇔ `resolved_at` no nulo; `revoked` ⇔ `revoked_at` no nulo.
- Triggers: `updated_at`, `resolved_at` automático según estado, `user_id` inmutable, historial de eventos, perfil automático al crear usuaria.
- `REVOKE ALL` a `anon` y `authenticated` en todo, y luego `GRANT` mínimo tabla a tabla (Supabase da permisos amplios por defecto en `public`).
- Funciones `security definer` con `search_path = ''` y `EXECUTE` revocado a `public`/`anon`.
- Índices pensados para Hoy y Consultas: `(user_id, status, follow_up_on) WHERE archived_at IS NULL` y `(user_id, created_at DESC)`.
- Búsqueda con `ilike` escapando `%` y `_`. Con cientos de consultas por usuaria no compensa un índice de trigramas.
- Doble pulsación: el formulario genera un `id` (UUID) al abrirse; el insert usa ese id, así un segundo envío choca con la clave primaria y se ignora. Además el botón se desactiva mientras guarda.

### Validación del borrador (hecha hoy)

He aplicado la migración en un PostgreSQL 16 local con una imitación mínima de Supabase (`auth.users`, `auth.uid()`, roles `anon`, `authenticated`, `service_role` y los permisos amplios por defecto de Supabase) y he pasado una prueba rápida (`supabase/borrador/rls-smoke-test.sql`): **41 comprobaciones, 41 correctas, 0 errores.** Cubre aislamiento entre dos usuarias, usuaria sin compra, usuaria revocada (lee y borra, no crea ni edita), `anon`, intentos de concederse acceso o falsear el historial, doble envío, idempotencia de pagos y reembolsos, y primera compradora con webhooks desordenados y un reembolso.

Esto **no** sustituye a probarlo en un Supabase real, que haremos en la fase 3.

---

## 6. Reglas de negocio

**Estados:** Por responder → Esperando respuesta → Hacer seguimiento → Resuelta. Cualquier transición es válida (es su negocio, ella decide). "Reabrir" lleva una resuelta a Por responder.

**Contadores de Hoy:**

- Por responder = estado Por responder.
- En seguimiento = Esperando respuesta + Hacer seguimiento.
- Archivadas y resueltas no cuentan.

**Lista de Hoy (en este orden):**

1. Seguimiento vencido (fecha anterior a hoy), la más antigua primero. Aviso: "Esta conversación necesita una revisión." Con icono y texto, no solo color.
2. Seguimiento para hoy.
3. Por responder sin fecha, la más antigua primero.

La app no cambia estados sola. Si "Esperando respuesta" tiene la fecha vencida, se marca visualmente, pero el estado sigue siendo el que ella eligió.

**Fechas en tarjetas:** "Revisar: jue 30 oct" (icono de calendario) frente a "Recibida hace 3 días" (icono de bandeja). Textos distintos, iconos distintos y en sitios distintos de la tarjeta.

---

## 7. Diseño

### Paleta (contraste calculado con la fórmula WCAG)

| Token             | Color   | Uso                                           | Contraste                                |
| ----------------- | ------- | --------------------------------------------- | ---------------------------------------- |
| `crema`           | #F7F1E7 | fondo                                         |                                          |
| `superficie`      | #FFFFFF | tarjetas, campos                              |                                          |
| `chocolate`       | #3A2A21 | texto principal                               | 12,2:1 sobre crema · 13,7:1 sobre blanco |
| `chocolate-suave` | #6A5546 | texto secundario                              | 6,2:1 sobre crema                        |
| `oliva`           | #55602F | botón principal (texto blanco), enlaces, foco | 6,8:1                                    |
| `oliva-claro`     | #E8EBDA | fondo de estado "Resuelta"                    | texto chocolate 11,3:1                   |
| `dorado`          | #8A6420 | texto de acento                               | 4,8:1 sobre crema                        |
| `dorado-claro`    | #F5E9CF | fondo de estado "Por responder"               | texto chocolate 11,4:1                   |
| `dorado-deco`     | #C29B4E | solo líneas/adornos, nunca texto              | 2,6:1 (decorativo)                       |
| `terracota`       | #A13A28 | errores, vencido                              | 5,9:1 sobre crema                        |
| `borde-campo`     | #8C7A6B | borde de inputs                               | 4,1:1 (mínimo 3:1 para componentes)      |

Todo el texto supera AA (4,5:1). Cada estado lleva **icono + texto** además del color.

### Tipografía

- Títulos: **Fraunces** (serif cálida, con carácter, legible).
- Texto: **Atkinson Hyperlegible Next** (diseñada para baja visión).
- Servidas con `next/font`, que las aloja en tu dominio: ninguna petición a Google desde el navegador de la usuaria (mejor para RGPD).
- Base 17 px en móvil, inputs a 16 px mínimo para que Safari en iPhone no haga zoom.

### Interfaz

- Navegación inferior fija con 3 pestañas (Hoy, Consultas, Ayuda) y botón destacado "Nueva consulta". En escritorio pasa a barra lateral.
- Botones de 48 px de alto mínimo, objetivos táctiles de 44×44 como mínimo (WCAG 2.2 pide 24×24; vamos sobrados).
- Respeta `safe-area-inset` del iPhone (notch y barra de gestos).
- Cambio de estado rápido: menú de 4 opciones en la tarjeta, sin entrar al detalle.
- Foco visible en oliva con 2 px de contorno. Respeta `prefers-reduced-motion`.
- Sin modo oscuro por ahora (lo propongo para más adelante si lo pides).

---

## 8. PWA

- `app/manifest.ts`: nombre "Clienta en Radar", short_name "En Radar", `display: standalone`, `theme_color` crema, iconos 192, 512 y maskable. `apple-touch-icon` 180 para iPhone.
- `public/sw.js`: cachea solo estáticos versionados (`/_next/static/*`, iconos, fuentes) y `/offline`. **Las páginas con datos y las respuestas de Server Actions nunca se cachean.** Al cerrar sesión se limpia cualquier caché.
- Offline: "Ahora mismo no hay conexión. Tus consultas están guardadas, vuelve a intentarlo cuando tengas internet." Sin prometer edición offline.
- Actualizaciones: el SW nuevo se activa solo cuando no hay formularios a medias; nunca toca cookies de sesión.
- Guía de instalación en Ayuda para iPhone (Compartir → Añadir a pantalla de inicio) y Android.

---

## 9. Seguridad y privacidad

- Validación con zod en servidor siempre (la del cliente es solo para mostrar errores rápido).
- React escapa el texto por defecto; prohibido `dangerouslySetInnerHTML`. Cabeceras: CSP estricta, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'`.
- Cookies `httpOnly`, `Secure`, `SameSite=Lax`.
- Clave secreta de Supabase y de Stripe solo en variables de entorno del servidor, con `import "server-only"` para que el build falle si alguien la importa en el cliente.
- Logs sin nombres, resúmenes ni notas. Solo ids y códigos de error.
- Exportar: JSON y CSV desde Ajustes. Borrar cuenta: confirma escribiendo "BORRAR", elimina la usuaria en Auth y todo cae en cascada.
- Retención: tarea diaria con `pg_cron` que borra resueltas/archivadas más antiguas que lo que eligió la usuaria.
- Documentación en `docs/`: registro de actividades de tratamiento, encargados (Supabase, Vercel, Stripe, proveedor SMTP) con sus DPA, transferencias internacionales, plantillas de privacidad y aviso legal **para revisión de un abogado**, procedimiento de backups y restauración.
- Backups: el plan gratuito de Supabase no incluye backups diarios descargables. Para comercializar recomiendo plan Pro (backups diarios) o un `pg_dump` programado a un almacenamiento cifrado. Lo decidimos en la fase 7.

---

## 10. Plan de pruebas

### Unitarias (Vitest)

- Estados: etiquetas, transiciones, reabrir, coherencia con `resolved_at`.
- Validación: campos vacíos, solo espacios, longitudes, canal inválido, fecha inválida, mensajes en español.
- Prioridad de Hoy: orden vencidas → hoy → por responder; contadores.
- Fechas: "hoy" en Europe/Madrid, cambio de hora de octubre y marzo, medianoche.
- Búsqueda: escape de `%` y `_`.
- Webhook (con Stripe simulado y firmas generadas con la utilidad oficial del SDK): firma inválida → 400; evento repetido → no duplica; reembolso → revoca; reembolso antes que el pago → no concede.

### Base de datos y RLS

- Aquí no hay Docker, pero sí PostgreSQL 16. Montaré un Postgres local con un esquema `auth` mínimo que imita a Supabase (`auth.users`, `auth.uid()` leyendo el JWT de la sesión, roles `anon`/`authenticated`). Las pruebas cambian de rol y de usuaria dentro de transacciones.
- Casos con **dos usuarias (A y B)**: B no ve, no edita, no borra y no puede reasignarse consultas de A; sin derecho no se puede crear ni editar; `anon` no ve nada; nadie lee `payment_events`; nadie puede insertarse un derecho; idempotencia de la función de pago; selección de ganadora con reembolsos y empates.
- Después repetiremos las mismas pruebas contra un **proyecto Supabase de pruebas real** (fase 3).

### E2E (Playwright)

- Alta y acceso con código OTP (en CI leyendo el email del Mailpit del stack local de Supabase).
- Sin compra → pantalla sin acceso. Con derecho → Hoy.
- Crear consulta, validación, doble clic crea una sola.
- Editar, cambiar estado, seguimiento vencido aparece arriba en Hoy, resolver ("Una cosa menos en la cabeza"), archivar, reabrir, eliminar con confirmación.
- Aislamiento: B abre la URL de una consulta de A → página "no encontrada".
- Exportar datos. Página offline.
- Viewport de iPhone y Android. Accesibilidad con `@axe-core/playwright` en cada pantalla.
- Recomiendo GitHub Actions para CI: allí sí hay Docker y podemos levantar Supabase local completo, y también probar con WebKit (el motor de Safari).
- **Prueba manual en un iPhone y un Android reales** por tu parte (instalación, login, uso). No se puede sustituir.

### Puerta de calidad en cada fase

`npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`. Te enseñaré la salida real.

---

## 11. Lo que vas a necesitar crear tú (no lo invento)

| Cuándo          | Qué                                                                                                                                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fase 2          | El repo nuevo (si eliges la opción A).                                                                                                                                                                                                                                                                              |
| Fase 3          | Proyecto Supabase nuevo en Frankfurt (ojo: el plan gratuito permite 2 proyectos activos y ya tienes `autodm` activo). Mejor dos: pruebas y producción. Proveedor SMTP para enviar los códigos (Resend, Brevo o Postmark; el SMTP de Supabase por defecto solo envía a miembros del equipo y con límites muy bajos). |
| Fase 5          | Cuenta de Vercel y, si quieres, dominio propio.                                                                                                                                                                                                                                                                     |
| Fase 6          | Cuenta de Stripe en España, producto y precio de 47 € en modo test.                                                                                                                                                                                                                                                 |
| Antes de vender | Revisión legal de privacidad, aviso legal, condiciones y bases de la promoción.                                                                                                                                                                                                                                     |

---

## 12. Fases siguientes (recordatorio)

2. Interfaz con datos ficticios y navegación (sin Supabase).
3. Supabase, auth OTP, migraciones, RLS y sus pruebas.
4. Lógica real de consultas y seguimientos.
5. PWA e instalación móvil.
6. Stripe, derechos y primera compradora.
7. Pruebas finales, revisión de seguridad y accesibilidad, despliegue (con tu confirmación).
