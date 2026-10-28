import "server-only";
import { connection } from "next/server";
import { DEMO_PROFILE } from "./demo-profile";
import { mockProfileState } from "./mock-profile";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string | null;
  businessName: string | null;
  timezone: string;
  retentionDays: number | null;
  /** Nulo hasta que termina (o salta) la primera configuración. */
  onboardedAt: string | null;
}

/**
 * Usuaria actual con acceso al producto.
 * Fase 3: verificará la sesión con Supabase (getClaims) y el derecho de acceso
 * en la base de datos, redirigiendo a /acceso o /sin-acceso si falta algo.
 */
export async function requireUser(): Promise<CurrentUser> {
  // Todo lo privado se genera en cada petición, nunca en el build ni en caché.
  await connection();
  return { ...DEMO_PROFILE, onboardedAt: mockProfileState().onboardedAt };
}
