"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SignInState =
  { step: "email"; error?: string; email?: string } | { step: "code"; email: string; error?: string; resent?: boolean };

const emailSchema = z.email("Escribe un email válido, por ejemplo nombre@gmail.com.").max(254);
const codeSchema = z
  .string()
  .transform((value) => value.replace(/\s/g, ""))
  .pipe(z.string().regex(/^\d{6}$/, "El código tiene 6 números. Revisa el email que te hemos enviado."));

const RATE_LIMITED = "Has pedido varios códigos seguidos. Espera un minuto y vuelve a intentarlo.";
const GENERIC = "No hemos podido enviarte el código. Inténtalo de nuevo en unos segundos.";
// Lo que responde Auth cuando el email no tiene cuenta (los registros están cerrados).
const NO_ACCOUNT_CODES = new Set(["otp_disabled", "signup_disabled", "user_not_found"]);

function normalizeEmail(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/**
 * Paso 1: enviar un código de 6 cifras al email. Las cuentas solo se crean al comprar
 * (los registros están cerrados en Supabase), así nadie puede registrar antes el email de otra persona.
 * Si el email no tiene cuenta, la respuesta es la misma que si la tuviera: no se revela quién ha comprado.
 */
export async function requestCodeAction(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const parsed = emailSchema.safeParse(normalizeEmail(formData.get("email")));
  if (!parsed.success)
    return { step: "email", error: parsed.error.issues[0]?.message, email: normalizeEmail(formData.get("email")) };
  const email = parsed.data;
  const resent = formData.get("reenviar") === "1";

  if (isDemoMode()) return { step: "code", email, resent };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  if (error && !NO_ACCOUNT_CODES.has(error.code ?? "")) {
    const limited = error.status === 429 || error.code === "over_email_send_rate_limit";
    return resent
      ? { step: "code", email, error: limited ? RATE_LIMITED : GENERIC }
      : { step: "email", email, error: limited ? RATE_LIMITED : GENERIC };
  }
  return { step: "code", email, resent };
}

/** Paso 2: comprobar el código. Si es correcto, la sesión queda guardada en una cookie httpOnly. */
export async function verifyCodeAction(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const email = normalizeEmail(formData.get("email"));
  const emailOk = emailSchema.safeParse(email);
  if (!emailOk.success) return { step: "email", error: "Vuelve a escribir tu email." };

  const code = codeSchema.safeParse(formData.get("code") ?? "");
  if (!code.success) return { step: "code", email, error: code.error.issues[0]?.message };

  if (!isDemoMode()) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: code.data, type: "email" });
    if (error) {
      return {
        step: "code",
        email,
        error:
          error.status === 429 ? RATE_LIMITED : "El código no es correcto o ha caducado. Revísalo o pide uno nuevo.",
      };
    }
  }

  // requireUser() vincula la compra si la hizo con este email y decide si va a Hoy o a Sin acceso.
  redirect("/hoy");
}

/** Cierra la sesión en Supabase y borra la cookie. */
export async function signOutAction(): Promise<void> {
  if (!isDemoMode()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/acceso");
}
