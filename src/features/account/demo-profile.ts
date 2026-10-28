/** Fase 2: datos de cuenta ficticios mientras no hay autenticación real. */
export const DEMO_MODE = true;

export const DEMO_PROFILE = {
  id: "demo-user",
  email: "marta@ejemplo.es",
  displayName: "Marta",
  businessName: "Estudio Marta",
  timezone: "Europe/Madrid",
  retentionDays: 365 as number | null,
} as const;
