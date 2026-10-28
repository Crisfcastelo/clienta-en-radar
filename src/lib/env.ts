import "server-only";
import { z } from "zod";

/**
 * Variables de entorno del servidor, validadas al usarse. Ninguna llega al navegador:
 * la app no usa Supabase desde el cliente, así que no hace falta NEXT_PUBLIC_.
 */
const supabaseEnvSchema = z.object({
  SUPABASE_URL: z.url("SUPABASE_URL no es una URL válida."),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(20, "Falta SUPABASE_PUBLISHABLE_KEY."),
});

export type SupabaseEnv = z.infer<typeof supabaseEnvSchema>;

/** Modo demostración: datos ficticios en memoria, sin cuentas. Nunca en producción con clientas reales. */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

export function supabaseEnv(): SupabaseEnv {
  const parsed = supabaseEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // Solo nombres de variables, nunca valores.
    throw new Error(`Configuración incompleta: ${parsed.error.issues.map((i) => i.message).join(" ")}`);
  }
  return parsed.data;
}
