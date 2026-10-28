export const INQUIRY_STATUSES = ["por_responder", "esperando_respuesta", "hacer_seguimiento", "resuelta"] as const;

export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const INQUIRY_CHANNELS = ["whatsapp", "instagram", "email", "otro"] as const;

export type InquiryChannel = (typeof INQUIRY_CHANNELS)[number];

/** Fecha de calendario en formato YYYY-MM-DD, sin hora ni zona horaria. */
export type IsoDate = string;

export interface Inquiry {
  id: string;
  customerLabel: string;
  channel: InquiryChannel | null;
  summary: string;
  notes: string | null;
  status: InquiryStatus;
  followUpOn: IsoDate | null;
  resolvedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function isInquiryStatus(value: unknown): value is InquiryStatus {
  return typeof value === "string" && (INQUIRY_STATUSES as readonly string[]).includes(value);
}

export function isInquiryChannel(value: unknown): value is InquiryChannel {
  return typeof value === "string" && (INQUIRY_CHANNELS as readonly string[]).includes(value);
}
