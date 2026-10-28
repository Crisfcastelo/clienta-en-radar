"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resetMockStore } from "@/features/inquiries/mock-repository";
import { isDemoMode } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mockProfileState } from "./mock-profile";
import { requireUser } from "./session";

/** Solo en modo demostración: restaura los datos de ejemplo o deja la cuenta como recién comprada. */
export async function resetDemoDataAction(formData: FormData): Promise<void> {
  if (!isDemoMode()) return;
  await requireUser();
  const empty = formData.get("mode") === "vacio";
  resetMockStore(empty ? "vacio" : "ejemplo");
  mockProfileState().onboardedAt = empty ? null : new Date().toISOString();
  revalidatePath("/", "layout");
  redirect(empty ? "/bienvenida" : "/hoy");
}

/** Termina (o salta) la primera configuración. No vuelve a mostrarse. */
export async function completeOnboardingAction(): Promise<void> {
  const user = await requireUser();
  if (isDemoMode()) {
    mockProfileState().onboardedAt ??= new Date().toISOString();
  } else if (!user.onboardedAt) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("profiles")
      .update({ onboarded_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) throw new Error("No se pudo guardar la configuración.");
  }
  revalidatePath("/", "layout");
  redirect("/hoy");
}
