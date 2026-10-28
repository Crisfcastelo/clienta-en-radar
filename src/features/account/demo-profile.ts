/** Cuenta ficticia del modo demostración (DEMO_MODE=true). */

export const DEMO_PROFILE = {
  id: "demo-user",
  email: "marta@ejemplo.es",
  displayName: "Marta",
  businessName: "Estudio Marta",
  timezone: "Europe/Madrid",
  // Por defecto no se borra nada: las resueltas quedan en el historial.
  retentionDays: null as number | null,
} as const;
