import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { InquiryRepository } from "./repository";
import type { Inquiry, InquiryChannel, InquiryStatus } from "./domain/types";

/** Fila de public.inquiries tal y como la devuelve PostgREST. */
interface InquiryRow {
  id: string;
  customer_label: string | null;
  channel: InquiryChannel | null;
  summary: string;
  notes: string | null;
  next_action: string | null;
  status: InquiryStatus;
  follow_up_on: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

const COLUMNS =
  "id, customer_label, channel, summary, notes, next_action, status, follow_up_on, resolved_at, created_at, updated_at";

/** Postgres: violación de clave única (el mismo id enviado dos veces). */
const UNIQUE_VIOLATION = "23505";

export function toInquiry(row: InquiryRow): Inquiry {
  return {
    id: row.id,
    customerLabel: row.customer_label,
    channel: row.channel,
    summary: row.summary,
    notes: row.notes,
    nextAction: row.next_action,
    status: row.status,
    followUpOn: row.follow_up_on,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function fail(operation: string): never {
  // Sin detalles de la base de datos ni datos de la consulta en el mensaje.
  throw new Error(`No se pudo ${operation} la consulta.`);
}

/**
 * Consultas en Supabase. Usa siempre el cliente con la sesión de la usuaria:
 * RLS garantiza que solo ve y toca lo suyo, y user_id lo pone la base de datos.
 */
export const supabaseInquiryRepository: InquiryRepository = {
  async list() {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("inquiries").select(COLUMNS).order("created_at", { ascending: false });
    if (error) fail("cargar");
    return (data as InquiryRow[]).map(toInquiry);
  },

  async get(id) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("inquiries").select(COLUMNS).eq("id", id).maybeSingle();
    if (error) fail("cargar");
    return data ? toInquiry(data as InquiryRow) : null;
  },

  async create(input) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("inquiries")
      .insert({
        id: input.id,
        customer_label: input.customerLabel,
        channel: input.channel,
        summary: input.summary,
        notes: input.notes,
        next_action: input.nextAction,
        status: input.status,
        follow_up_on: input.followUpOn,
      })
      .select(COLUMNS)
      .single();

    if (error?.code === UNIQUE_VIOLATION) {
      // Doble envío del mismo formulario: ya estaba guardada.
      const existing = await supabaseInquiryRepository.get(input.id);
      if (existing) return { inquiry: existing, created: false };
    }
    if (error || !data) fail("guardar");
    return { inquiry: toInquiry(data as InquiryRow), created: true };
  },

  async update(id, fields) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("inquiries")
      .update({
        customer_label: fields.customerLabel,
        channel: fields.channel,
        summary: fields.summary,
        notes: fields.notes,
        next_action: fields.nextAction,
        status: fields.status,
        follow_up_on: fields.followUpOn,
      })
      .eq("id", id)
      .select(COLUMNS)
      .maybeSingle();
    if (error) fail("guardar");
    return data ? toInquiry(data as InquiryRow) : null;
  },

  async changeStatus(id, change) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("inquiries")
      .update({ status: change.status, follow_up_on: change.followUpOn })
      .eq("id", id)
      .select(COLUMNS)
      .maybeSingle();
    if (error) fail("actualizar");
    return data ? toInquiry(data as InquiryRow) : null;
  },

  async remove(id) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("inquiries").delete().eq("id", id).select("id");
    if (error) fail("eliminar");
    return (data ?? []).length > 0;
  },
};
