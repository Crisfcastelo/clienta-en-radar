import { z } from "zod";
import { isValidIsoDate } from "@/lib/dates";
import { INQUIRY_ACTIONS } from "./domain/transitions";
import { INQUIRY_CHANNELS, INQUIRY_STATUSES } from "./domain/types";

export const LIMITS = {
  customerLabel: 80,
  summary: 280,
  notes: 2000,
  nextAction: 120,
} as const;

// Un campo opcional vacío o ausente (radio sin marcar) se guarda como null.
const emptyToNull = (value: unknown) =>
  value === undefined || (typeof value === "string" && value.trim() === "") ? null : value;

const followUpOn = z.preprocess(
  emptyToNull,
  z
    .string()
    .refine(isValidIsoDate, "Esa fecha no es válida.")
    .refine((value) => value >= "2020-01-01" && value <= "2100-12-31", "Esa fecha no es válida.")
    .nullable(),
);

export const inquiryFieldsSchema = z.object({
  customerLabel: z.preprocess(
    emptyToNull,
    z.string().trim().max(LIMITS.customerLabel, `Usa como máximo ${LIMITS.customerLabel} caracteres.`).nullable(),
  ),
  summary: z
    .string("Cuenta en pocas palabras qué necesita.")
    .trim()
    .min(1, "Cuenta en pocas palabras qué necesita.")
    .max(LIMITS.summary, `Usa como máximo ${LIMITS.summary} caracteres.`),
  channel: z.preprocess(emptyToNull, z.enum(INQUIRY_CHANNELS, "Elige un canal de la lista.").nullable()),
  notes: z.preprocess(
    emptyToNull,
    z.string().trim().max(LIMITS.notes, `Usa como máximo ${LIMITS.notes} caracteres.`).nullable(),
  ),
  nextAction: z.preprocess(
    emptyToNull,
    z.string().trim().max(LIMITS.nextAction, `Usa como máximo ${LIMITS.nextAction} caracteres.`).nullable(),
  ),
  followUpOn,
  status: z.enum(INQUIRY_STATUSES, "Elige un estado de la lista."),
});

export const createInquirySchema = inquiryFieldsSchema.extend({
  id: z.uuid("No se pudo preparar el formulario. Recarga la página."),
  // Al crear, si no se elige otro, empieza en Por responder.
  status: z.preprocess(
    (value) => (value === undefined || value === "" ? "por_responder" : value),
    z.enum(INQUIRY_STATUSES, "Elige un estado de la lista."),
  ),
});

export const updateInquirySchema = inquiryFieldsSchema;

export const quickActionSchema = z
  .object({
    id: z.uuid("No encontramos esta consulta."),
    action: z.enum(INQUIRY_ACTIONS, "No se pudo hacer este cambio."),
    followUpOn,
  })
  .refine((data) => data.action !== "prepare_follow_up" || data.followUpOn !== null, {
    message: "Elige cuándo quieres retomarla.",
    path: ["followUpOn"],
  });

export const idSchema = z.object({ id: z.uuid() });

export type InquiryFields = z.infer<typeof inquiryFieldsSchema>;
export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
export type UpdateInquiryInput = z.infer<typeof updateInquirySchema>;

export type FieldErrors = Partial<Record<string, string>>;

/** Primer mensaje de error por campo, listo para pintar junto a cada input. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const flat = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  const result: FieldErrors = {};
  for (const [key, messages] of Object.entries(flat)) {
    if (messages?.[0]) result[key] = messages[0];
  }
  return result;
}

export function formDataToRecord(formData: FormData, keys: readonly string[]): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (const key of keys) {
    const value = formData.get(key);
    record[key] = typeof value === "string" ? value : undefined;
  }
  return record;
}
