"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/features/account/session";
import { inquiries } from "./data";
import { MESSAGES, STATUS_LABELS } from "./domain/labels";
import {
  createInquirySchema,
  formDataToRecord,
  idSchema,
  statusChangeSchema,
  toFieldErrors,
  updateInquirySchema,
} from "./schema";
import type { FieldErrors } from "./schema";
import { isValidIsoDate } from "@/lib/dates";

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
    return { status: "success", message: `Guardada: ${inquiry.customerLabel}.`, savedId: inquiry.id };
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

export async function changeStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = statusChangeSchema.safeParse(formDataToRecord(formData, ["id", "status"]));
  if (!parsed.success) return { status: "error", message: "Elige un estado de la lista." };

  const updated = await inquiries().setStatus(parsed.data.id, parsed.data.status);
  if (!updated) return { status: "error", message: NOT_FOUND };

  refreshAll();
  return {
    status: "success",
    message:
      parsed.data.status === "resuelta"
        ? MESSAGES.resolved
        : `${updated.customerLabel}: ${STATUS_LABELS[parsed.data.status].toLowerCase()}.`,
  };
}

export async function setFollowUpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsedId = idSchema.safeParse(formDataToRecord(formData, ["id"]));
  const raw = formData.get("followUpOn");
  const followUpOn = typeof raw === "string" && raw !== "" ? raw : null;
  if (!parsedId.success || (followUpOn !== null && !isValidIsoDate(followUpOn))) {
    return { status: "error", message: "Esa fecha no es válida." };
  }

  const updated = await inquiries().setFollowUp(parsedId.data.id, followUpOn);
  if (!updated) return { status: "error", message: NOT_FOUND };

  refreshAll();
  return {
    status: "success",
    message: followUpOn ? "Fecha de seguimiento guardada." : "Fecha de seguimiento quitada.",
  };
}

export async function setArchivedAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = idSchema.safeParse(formDataToRecord(formData, ["id"]));
  const archived = formData.get("archived") === "true";
  if (!parsed.success) return { status: "error", message: NOT_FOUND };

  const updated = await inquiries().setArchived(parsed.data.id, archived);
  if (!updated) return { status: "error", message: NOT_FOUND };

  refreshAll();
  return { status: "success", message: archived ? "Consulta archivada." : "Consulta recuperada del archivo." };
}

export async function reopenAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const parsed = idSchema.safeParse(formDataToRecord(formData, ["id"]));
  if (!parsed.success) return { status: "error", message: NOT_FOUND };

  const repo = inquiries();
  const current = await repo.get(parsed.data.id);
  if (!current) return { status: "error", message: NOT_FOUND };
  if (current.archivedAt) await repo.setArchived(current.id, false);
  if (current.status === "resuelta") await repo.setStatus(current.id, "por_responder");

  refreshAll();
  return { status: "success", message: "Consulta reabierta. Vuelve a estar por responder." };
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
