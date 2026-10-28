# Clienta en Radar

PWA de **Crisfcastelo** para dueñas de pequeños negocios que reciben consultas por WhatsApp, Instagram, email u otros
canales. Sirve para saber a quién responder, qué conversación revisar y qué se puede dar por resuelto, sin depender de
la memoria.

> **Estado actual: fase 3.** Cuentas con acceso por código de email, base de datos en Supabase con RLS y datos
> reales por usuaria. Pendiente de crear el proyecto Supabase real y el envío de emails (ver
> [docs/fase-3-supabase.md](docs/fase-3-supabase.md)).

## Requisitos

- Node.js 22 o superior y npm 10
- Docker, para el Supabase local

## Puesta en marcha

```bash
npm install
npx supabase start                 # base de datos, Auth y Mailpit en local
cp .env.example .env.local         # y rellena con: npx supabase status -o env
npm run dev                        # http://localhost:3000
```

Los códigos de acceso llegan a Mailpit (http://127.0.0.1:54324). Para ver la app sin base de datos, con datos
ficticios: `DEMO_MODE=true npm run dev`.

## Comandos

| Comando             | Qué hace                                                               |
| ------------------- | ---------------------------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo                                                 |
| `npm run build`     | Compilación de producción                                              |
| `npm run lint`      | ESLint (incluye reglas de accesibilidad `jsx-a11y`)                    |
| `npm run typecheck` | Genera tipos de rutas y comprueba TypeScript estricto                  |
| `npm test`          | Pruebas unitarias (Vitest)                                             |
| `npm run test:e2e`  | Pruebas de extremo a extremo (Playwright, móvil y escritorio, con axe) |
| `npm run format`    | Formatea con Prettier                                                  |
| `npm run check`     | Formato + lint + tipos + unitarias + build                             |

Las pruebas E2E arrancan `next start`, así que necesitan un `npm run build` previo. Por defecto usan el modo
demostración; con `E2E_MODE=supabase` (y las variables de `npx supabase status -o env`) prueban cuentas reales contra
el Supabase local. Si el Chromium instalado no coincide
con la versión de Playwright, se puede indicar otro con `PW_CHROMIUM_PATH=/ruta/a/chrome npm run test:e2e`.

## Estructura

```
src/
  app/                    rutas (App Router)
    (app)/                zona privada: hoy, consultas, ayuda, ajustes
    acceso/, sin-acceso/  acceso por código y cuenta sin compra
    api/exportar/         descarga de datos (CSV y JSON)
  features/
    inquiries/
      domain/             reglas puras: estados, prioridad de Hoy, filtros (con tests)
      schema.ts           validación con zod, compartida por cliente y servidor
      repository.ts       contrato de acceso a datos
      mock-repository.ts  implementación en memoria (solo fase 2)
      actions.ts          Server Actions
      components/         UI específica de consultas
    account/              sesión, exportación, acciones de cuenta
    help/                 registro de recursos y bonus
  components/             UI reutilizable (botones, campos, diálogo, avisos…)
  lib/                    fechas por zona horaria, ids
supabase/migrations/      esquema de la base de datos, versionado
supabase/tests/           pruebas de seguridad (RLS, pagos, compra por email)
supabase/templates/       email con el código de acceso
docs/                     plan de la fase 1 y decisiones
tests/e2e/                Playwright
```

## Documentación

- [Plan de la fase 1](docs/fase-1-plan.md): arquitectura, esquema, diseño y plan de pruebas.
- [Decisiones](docs/decisiones.md): lo que se ha decidido después y por qué.
- [Contenido funcional](docs/contenido-funcional.md): textos definitivos y reglas de producto.
- [Fase 3 · Supabase](docs/fase-3-supabase.md): cómo funciona el acceso y cómo configurar el proyecto real.
