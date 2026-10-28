import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

export interface SessionInfo {
  userId: string;
  email: string;
}

/** Sesión verificada (getClaims comprueba la firma del token), o null. Una vez por petición. */
export const getSession = cache(async (): Promise<SessionInfo | null> => {
  await connection();
  if (isDemoMode()) return { userId: DEMO_PROFILE.id, email: DEMO_PROFILE.email };

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub || typeof claims.email !== "string") return null;
  return { userId: claims.sub, email: claims.email };
});

/** Sesión obligatoria, aunque no haya compra (para /sin-acceso y para exportar o borrar datos). */
export async function requireSession(): Promise<SessionInfo> {
  const session = await getSession();
  if (!session) redirect("/acceso");
  return session;
}

/**
 * Usuaria con sesión y con acceso al producto. Si compró antes de tener cuenta,
 * aquí se vincula la compra (el código por email demuestra que el email es suyo).
 * La comprobación de verdad está también en RLS: sin acceso no se puede escribir.
 */
export const requireUser = cache(async (): Promise<CurrentUser> => {
  const session = await requireSession();
  if (isDemoMode()) return { ...DEMO_PROFILE, onboardedAt: mockProfileState().onboardedAt };

  const supabase = await createSupabaseServerClient();
  let hasAccess = await checkAccess(supabase);
  if (!hasAccess) {
    const { error } = await supabase.rpc("claim_entitlements");
    if (error) throw new Error("No se pudo comprobar la compra.");
    hasAccess = await checkAccess(supabase);
  }
  if (!hasAccess) redirect("/sin-acceso");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, business_name, timezone, retention_days, onboarded_at")
    .eq("id", session.userId)
    .single();
  if (error || !profile) throw new Error("No se pudo cargar el perfil.");

  return {
    id: session.userId,
    email: session.email,
    displayName: profile.display_name,
    businessName: profile.business_name,
    timezone: profile.timezone,
    retentionDays: profile.retention_days,
    onboardedAt: profile.onboarded_at,
  };
});

async function checkAccess(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_access");
  if (error) throw new Error("No se pudo comprobar el acceso.");
  return data === true;
}
