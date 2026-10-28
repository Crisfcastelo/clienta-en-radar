import type { InquiryStatus, IsoDate } from "./types";

/**
 * Acciones rápidas que ve la usuaria. Cada una es un solo paso: la app no exige
 * registrar cada detalle de la conversación.
 */
export const INQUIRY_ACTIONS = ["respond", "prepare_follow_up", "resolve", "reopen"] as const;

export type InquiryAction = (typeof INQUIRY_ACTIONS)[number];

export const ACTION_LABELS: Record<InquiryAction, string> = {
  respond: "Marcar como respondida",
  prepare_follow_up: "Preparar seguimiento",
  resolve: "Resolver",
  reopen: "Reabrir",
};

const ACTIONS_BY_STATUS: Record<InquiryStatus, InquiryAction[]> = {
  por_responder: ["respond", "resolve"],
  esperando_respuesta: ["prepare_follow_up", "resolve"],
  hacer_seguimiento: ["respond", "resolve"],
  resuelta: ["reopen"],
};

export function availableActions(status: InquiryStatus): InquiryAction[] {
  return ACTIONS_BY_STATUS[status];
}

export interface StatusChange {
  status: InquiryStatus;
  followUpOn: IsoDate | null;
}

/**
 * Qué cambia cada acción:
 * - Responder: pasa a Esperando respuesta y la revisión pendiente queda hecha.
 * - Preparar seguimiento: pasa a Hacer seguimiento con la fecha elegida.
 * - Resolver y reabrir: limpian la fecha para que no reaparezca una revisión antigua.
 */
export function applyAction(action: InquiryAction, followUpOn: IsoDate | null = null): StatusChange {
  switch (action) {
    case "respond":
      return { status: "esperando_respuesta", followUpOn: null };
    case "prepare_follow_up":
      return { status: "hacer_seguimiento", followUpOn };
    case "resolve":
      return { status: "resuelta", followUpOn: null };
    case "reopen":
      return { status: "por_responder", followUpOn: null };
  }
}
