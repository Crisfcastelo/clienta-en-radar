"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/features/account/session";
import { inquiries } from "./data";
import { formatFollowUp, todayIn } from "@/lib/dates";
import { MESSAGES } from "./domain/labels";
import { applyAction } from "./domain/transitions";
import type { InquiryAction } from "./domain/transitions";
import {
  createInquirySchema,
  formDataToRecord,
  idSchema,
  quickActionSchema,
  toFieldErrors,
  updateInquirySchema,
} from "./schema";
import type { FieldErrors } from "./schema";

export type FormState =
  | { status: "idle" }
  | { status: "error"; message: string; fieldErrors: FieldErrors; values: Record<string, string> }
  | { status: "success"; message: string; savedId?: string };

export type ActionState = { status: "idle" } | { status: "error" | "success"; message: string };

const FIELD_KEYS = ["customerLabel", "summary", "channel", "notes", "followUpOn"] as const;
const NOT_FOUND = "No encontramos esta consulta. Puede que la hayas eliminado.";
const GENERIC_ERROR = "No se pudo guardar. Inténtalo de nuevo en unos segundos.";

function echoValues(formData: FormData, keys: readonly string[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value === "string") values[key] = value;
  }
  return values;
}

function refreshAll() {
  revalidatePath("/", "layout");
}

export async function createInquiryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = createInquirySchema.safeParse(formDataToRecord(formData, ["id", ...FIELD_KEYS]));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      fieldErrors: toFieldErrors(parsed.error),
      values: echoValues(formData, ["id", ...FIELD_KEYS]),
    };
  }

  try {
    const { inquiry } = await inquiries().create(parsed.data);
    refreshAll();
    return { status: "success", message: MESSAGES.saved, savedId: inquiry.id };
  } catch {
    return {
      status: "error",
      message: GENERIC_ERROR,
      fieldErrors: {},
      values: echoValues(formData, ["id", ...FIELD_KEYS]),
    };
  }
}

export async function updateInquiryAction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const keys = [...FIELD_KEYS, "status"] as const;
  const parsedId = idSchema.safeParse({ id });
  const parsed = updateInquirySchema.safeParse(formDataToRecord(formData, keys));
  if (!parsedId.success || !parsed.success) {
    return {
      status: "error",
      message: "Revisa los campos marcados.",
      fieldErrors: parsed.success ? {} : toFieldErrors(parsed.error),
      values: echoValues(formData, keys),
    };
  }

  const updated = await inquiries().update(parsedId.data.id, parsed.data);
  if (!updated) return { status: "error", message: NOT_FOUND, fieldErrors: {}, values: echoValues(formData, keys) };

  refreshAll();
  return {
    status: "success",
    message: updated.status === "resuelta" ? MESSAGES.resolved : "Cambios guardados.",
    savedId: updated.id,
  };
}

export async function inquiryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = quickActionSchema.safeParse(formDataToRecord(formData, ["id", "action", "followUpOn"]));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "No se pudo hacer este cambio." };
  }

  const { id, action, followUpOn } = parsed.data;
  const updated = await inquiries().changeStatus(id, applyAction(action, followUpOn));
  if (!updated) return { status: "error", message: NOT_FOUND };

  refreshAll();
  return { status: "success", message: actionMessage(action, updated.customerLabel, followUpOn, user.timezone) };
}

function actionMessage(action: InquiryAction, label: string, followUpOn: string | null, timeZone: string): string {
  switch (action) {
    case "respond":
      return `${label}: marcada como respondida.`;
    case "prepare_follow_up":
      return `Seguimiento preparado: revisar ${followUpOn ? formatFollowUp(followUpOn, todayIn(timeZone)) : "hoy"}.`;
    case "resolve":
      return MESSAGES.resolved;
    case "reopen":
      return "Consulta reabierta. Vuelve a estar por responder.";
  }
}

export async function deleteInquiryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = idSchema.safeParse(formDataToRecord(formData, ["id"]));
  if (!parsed.success) return { status: "error", message: NOT_FOUND };

  const removed = await inquiries().remove(parsed.data.id);
  if (!removed) return { status: "error", message: NOT_FOUND };

  refreshAll();
  redirect("/consultas?aviso=eliminada");
}
