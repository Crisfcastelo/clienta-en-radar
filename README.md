# Clienta en Radar

PWA de **Crisfcastelo** para dueñas de pequeños negocios que reciben consultas por WhatsApp, Instagram, email u otros
canales. Sirve para saber a quién responder, qué conversación revisar y qué se puede dar por resuelto, sin depender de
la memoria.

> **Estado actual: fase 2.** Interfaz completa con **datos ficticios en memoria** y navegación funcional. Todavía no
> hay cuentas, base de datos ni pagos reales. No usar con datos de clientas reales.

## Requisitos

- Node.js 22 o superior
- npm 10

## Puesta en marcha

```bash
npm install
npm run dev          # http://localhost:3000
```

En la versión de prueba, `/acceso` acepta cualquier email y cualquier código de 6 números. En **Ajustes** hay botones
para restaurar los datos de ejemplo o ver la app como una cuenta nueva.

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

Las pruebas E2E arrancan `next start`, así que necesitan un `npm run build` previo. Si el Chromium instalado no coincide
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
supabase/borrador/        esquema SQL y prueba de RLS de la fase 1 (se convertirá en migraciones en fase 3)
docs/                     plan de la fase 1 y decisiones
tests/e2e/                Playwright
```

## Documentación

- [Plan de la fase 1](docs/fase-1-plan.md): arquitectura, esquema, diseño y plan de pruebas.
- [Decisiones](docs/decisiones.md): lo que se ha decidido después y por qué.
