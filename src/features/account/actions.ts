"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resetMockStore } from "@/features/inquiries/mock-repository";
import { DEMO_MODE } from "./demo-profile";
import { requireUser } from "./session";

/** Solo en modo demostración: restaura los datos de ejemplo o deja la cuenta vacía. */
export async function resetDemoDataAction(formData: FormData): Promise<void> {
  if (!DEMO_MODE) return;
  await requireUser();
  resetMockStore(formData.get("mode") === "vacio" ? "vacio" : "ejemplo");
  revalidatePath("/", "layout");
  redirect("/hoy");
}

/** Fase 3: cerrará la sesión de Supabase y limpiará cachés del service worker. */
export async function signOutAction(): Promise<void> {
  redirect("/acceso");
}
