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

## Tras el documento de contenido funcional

Decidido con Crisfcastelo:

- **Sin archivar.** Lo que ya no interesa se resuelve (queda en el historial) o se elimina. Un concepto menos.
- **Filtros:** los cinco de estado siempre visibles (Todas, Por responder, Esperando respuesta, Seguimiento, Resueltas);
  canal y fecha de recepción plegados en «Más filtros».
- **Notas:** se mantienen, plegadas, sin añadir pasos.
- **Acciones de un toque** en lugar de un selector de estados: «Marcar como respondida», «Preparar seguimiento»,
  «Resolver» y «Reabrir», según el estado. En el detalle se puede seguir eligiendo cualquier estado a mano.
- **Preparar seguimiento** abre «¿Cuándo quieres retomarla?» (Hoy, Mañana, En 3 días, En una semana u otra fecha),
  guarda la fecha y pasa a Hacer seguimiento. Marcarla después como respondida vuelve a Esperando respuesta y da la
  revisión por hecha (borra la fecha). Resolver y reabrir también limpian la fecha.
- **Para revisar** = fecha de revisión hoy o pasada, o Hacer seguimiento sin fecha (para que nunca quede fuera del
  radar). Las vencidas se quedan arriba con el aviso hasta que la usuaria actúe.
- **Indicadores de Hoy:** Por responder, Para revisar y Resueltas esta semana (de lunes a domingo, en su zona horaria).
- **Retención:** por defecto no se borra nada; el borrado automático de resueltas es opcional.
- **Primera configuración** en tres pasos que se pueden saltar: bienvenida, primeras consultas y el texto final con
  «Ir a mis pendientes». Solo la primera vez.
- **Recursos en la app:** solo Responde sin pensar, WhatsApp bajo control y No dejes la conversación a medias, ocultos
  hasta tener su contenido. Agenda sin idas y venidas, Cierra el día y el bonus épico quedan fuera de la app.
- **Mensajes de «Responde sin pensar»:** para empezar, solo copiar y adaptar fuera de la app. Nada de versiones propias.
- **Subtítulo de Ayuda:** el definitivo habla de respuestas, WhatsApp y seguimientos; se muestra cuando haya algún
  recurso disponible. Mientras tanto, uno neutro, para no prometer lo que aún no está.

Pendiente:

- URL y momento del mensaje comercial «Quiero que revises mi negocio» (de momento no aparece).
- Si los recursos van incluidos en los 47 € o se venden aparte.

Esquema SQL (`supabase/borrador`): sin `archived_at`; `retention_days` nulo por defecto; compra ligada al email con
`purchaser_email` y `claim_entitlements()`. Prueba local: 52 de 52 comprobaciones correctas.

## Estilo visual (mockup de Crisfcastelo)

- Paleta: verde bosque `#24483A` como color principal, fondo crema con luz suave hecha solo con CSS, tarjetas blancas
  translúcidas, rosa, arena y salvia para los indicadores. Todos los textos superan WCAG AA (comprobado).
- Títulos en Fraunces más ligera y grande; texto en Atkinson Hyperlegible Next.
- Filas de consulta con el icono del canal (WhatsApp e Instagram con sus logotipos, de Simple Icons, CC0), hora de
  recepción, estado en píldora con punto y flecha al detalle. El punto rojo solo marca revisiones vencidas: nunca
  "mensajes nuevos", porque la app no lee WhatsApp ni Instagram.
- Barra inferior con cuatro destinos iguales (Hoy, Consultas, Añadir, Ayuda).
- Añadir consulta: el canal arriba como cuatro mosaicos de un toque.
- Decidido sobre las diferencias del mockup:
  - **Sin categoría**: es lo que menos fricción provoca al apuntar.
  - **Próxima acción** opcional: texto libre con atajos de un toque (Responder, Enviar precio, Enviar presupuesto,
    Confirmar cita, Pedir más datos). Los atajos son provisionales y se pueden cambiar.
  - **Nombre opcional**: si falta, se muestra «Sin nombre». Lo único obligatorio es «Qué necesita».
  - **Estado elegible al crear**, con «Por responder» por defecto, en un desplegable de una línea.
  - **Tres indicadores** en Hoy, los del documento de contenido: cuatro no caben bien en móvil.
  - **Textos** del documento de contenido funcional; se podrán cambiar más adelante.
  - **Sin fotos de clientas**: icono del canal.
  - **Sin logotipo** de momento: hueco vacío hasta que exista.

Los tres recursos que van dentro de la app son: los 25 mensajes editables (Responde sin pensar), la configuración
guiada de WhatsApp (WhatsApp bajo control) y las secuencias de seguimiento (No dejes la conversación a medias).

## Acceso (29/10/2026)

- **Registros cerrados.** Nadie puede crearse una cuenta por su cuenta: la crea el servidor al cobrar, con el email ya
  confirmado. Una prueba demostró que, con los registros abiertos, alguien podía registrar con contraseña el email de
  una clienta antes que ella y seguir entrando con esa contraseña después.
- Una compra solo se vincula a una cuenta con el email confirmado, y el email sale de la cuenta, no del token.
- Hasta que esté el webhook de Stripe (fase 6), las cuentas de prueba se crean a mano con un script.
