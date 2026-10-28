import type { Inquiry } from "./types";

let counter = 0;

/** Crea una consulta de prueba con valores por defecto razonables. Solo para tests. */
export function makeInquiry(overrides: Partial<Inquiry> = {}): Inquiry {
  counter += 1;
  const id = `00000000-0000-4000-8000-${String(counter).padStart(12, "0")}`;
  return {
    id,
    customerLabel: `Clienta ${counter}`,
    channel: "whatsapp",
    summary: "Pregunta por disponibilidad",
    notes: null,
    nextAction: null,
    status: "por_responder",
    followUpOn: null,
    resolvedAt: null,
    createdAt: "2026-10-20T10:00:00.000Z",
    updatedAt: "2026-10-20T10:00:00.000Z",
    ...overrides,
  };
}
