import type { CreateInquiryInput, InquiryFields } from "./schema";
import type { StatusChange } from "./domain/transitions";
import type { Inquiry, InquiryStatus } from "./domain/types";

/**
 * Contrato de acceso a datos de consultas, siempre en nombre de la usuaria actual.
 * Fase 2: implementación en memoria con datos ficticios.
 * Fase 4: implementación con Supabase y RLS, sin tocar pantallas ni acciones.
 */
export interface InquiryRepository {
  list(): Promise<Inquiry[]>;
  get(id: string): Promise<Inquiry | null>;
  /** `created: false` si ya existía una consulta con ese id (doble envío). */
  create(input: CreateInquiryInput): Promise<{ inquiry: Inquiry; created: boolean }>;
  update(id: string, fields: InquiryFields & { status: InquiryStatus }): Promise<Inquiry | null>;
  /** Cambio de estado y fecha de revisión a la vez, como resultado de una acción rápida. */
  changeStatus(id: string, change: StatusChange): Promise<Inquiry | null>;
  remove(id: string): Promise<boolean>;
}
