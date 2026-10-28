# Decisiones

Registro breve de decisiones tomadas después del plan de la fase 1.

## Aprobado tras la fase 1

- Repositorio y proyecto Supabase propios, separados de Essentia.
- Acceso con código de 6 dígitos por email (OTP), sin contraseña ni enlace mágico.
- Cambios al modelo de datos propuestos en la fase 1 (seguimiento como fecha, `archived_at`, `provider_payment_id`,
  retención configurable, tablas de promoción y rate limiting).
- Una usuaria sin acceso (por ejemplo, tras un reembolso) puede seguir **exportando** y borrando sus datos.

## Venta con Stripe Payment Link (cambia el flujo de la fase 1)

La venta se hace desde un **enlace de pago de Stripe** y después la compradora recibe el enlace de acceso. Por tanto,
la cuenta se crea **después** de pagar, no antes. Diseño para las fases 3 y 6:

1. La compradora paga en el Payment Link (precio de 47 € configurado en Stripe).
2. Stripe redirige a `/acceso?compra=ok` (configurable en el propio Payment Link) y además le llega el enlace de acceso.
3. El webhook `checkout.session.completed` (con `payment_status = paid`), verificado por firma, vuelve a consultar el
   pago en Stripe y concede el derecho asociado al **email de la compra**, aunque aún no exista cuenta.
4. Cuando entra con ese email y valida el código OTP, una función de base de datos vincula a su cuenta los derechos
   pendientes de ese email. El código OTP demuestra que el email es suyo.
5. Si entra con otro email, ve `/sin-acceso` con instrucciones.

Cambios en `entitlements` respecto al borrador:

- `user_id` pasa a ser opcional mientras la compra no se ha reclamado.
- Nuevo `purchaser_email` (en minúsculas): dato personal necesario para entregar la compra.
- Restricción: debe existir `user_id` o `purchaser_email`.

Riesgo conocido: si la compradora escribe mal su email en Stripe, no podrá reclamar el acceso sola. Se resuelve a mano
corrigiendo el email del derecho tras verificar la compra en Stripe. Queda documentado en el procedimiento de soporte.

La primera compradora sigue igual: se decide por la hora del cobro según Stripe, con una función manual y transaccional,
nunca por la llegada del webhook.

## Fase 2

- **Sin Cache Components** (`cacheComponents` desactivado aunque la plantilla de Next 16.4 lo trae activo). Con él,
  Next guarda en caché del servidor datos derivados de la sesión. Desactivado, todo lo privado se genera en cada
  petición y nada de la usuaria queda en cachés del servidor.
- Las páginas privadas llaman a `connection()` dentro de `requireUser()` para no generarse nunca en el build.
- Capa de datos detrás de una interfaz (`InquiryRepository`). En fase 4 se sustituye la implementación en memoria por
  Supabase sin tocar pantallas ni acciones.
- Doble envío: el formulario lleva un UUID generado en el servidor; el guardado es idempotente por id. Probado en E2E
  enviando el formulario dos veces seguidas.
- Exportación CSV con separador `;`, BOM para Excel y protección contra inyección de fórmulas.
- ESLint 9 (no 10) porque `eslint-plugin-jsx-a11y` todavía no soporta ESLint 10.
- TypeScript 6.0, no 7.0 (recién publicada).
- Fuentes Fraunces y Atkinson Hyperlegible Next servidas desde nuestro dominio con `next/font`.
- Los bonus de Ayuda están registrados pero ocultos; no aparece ninguna sección vacía.
