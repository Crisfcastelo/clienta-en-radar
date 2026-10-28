"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resetMockStore } from "@/features/inquiries/mock-repository";
import { DEMO_MODE } from "./demo-profile";
import { mockProfileState } from "./mock-profile";
import { requireUser } from "./session";

/** Solo en modo demostración: restaura los datos de ejemplo o deja la cuenta como recién comprada. */
export async function resetDemoDataAction(formData: FormData): Promise<void> {
  if (!DEMO_MODE) return;
  await requireUser();
  const empty = formData.get("mode") === "vacio";
  resetMockStore(empty ? "vacio" : "ejemplo");
  mockProfileState().onboardedAt = empty ? null : new Date().toISOString();
  revalidatePath("/", "layout");
  redirect(empty ? "/bienvenida" : "/hoy");
}

/** Termina (o salta) la primera configuración. No vuelve a mostrarse. */
export async function completeOnboardingAction(): Promise<void> {
  await requireUser();
  mockProfileState().onboardedAt ??= new Date().toISOString();
  revalidatePath("/", "layout");
  redirect("/hoy");
}

/** Fase 3: cerrará la sesión de Supabase y limpiará cachés del service worker. */
export async function signOutAction(): Promise<void> {
  redirect("/acceso");
}
