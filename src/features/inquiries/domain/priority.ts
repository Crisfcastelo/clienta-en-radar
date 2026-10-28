import { daysBetween } from "@/lib/dates";
import type { Inquiry, IsoDate } from "./types";

export type FollowUpState = "none" | "overdue" | "today" | "upcoming";

/** Abierta = ni resuelta ni archivada. Es lo único que puede pedir atención. */
export function isOpen(inquiry: Inquiry): boolean {
  return inquiry.status !== "resuelta" && inquiry.archivedAt === null;
}

export function followUpState(inquiry: Inquiry, today: IsoDate): FollowUpState {
  if (!inquiry.followUpOn || !isOpen(inquiry)) return "none";
  const diff = daysBetween(today, inquiry.followUpOn);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  return "upcoming";
}

export type TodayReason = "overdue" | "due_today" | "pending";

export interface TodayAction {
  inquiry: Inquiry;
  reason: TodayReason;
}

export interface TodaySummary {
  pendingCount: number;
  followingCount: number;
  actions: TodayAction[];
  hasAnyInquiry: boolean;
}

const byCreatedAsc = (a: Inquiry, b: Inquiry) => a.createdAt.localeCompare(b.createdAt);

/**
 * Lo que hay que mirar hoy, en este orden:
 * 1. Seguimientos vencidos (el más antiguo primero).
 * 2. Seguimientos para hoy.
 * 3. Consultas por responder (la más antigua primero).
 * La app nunca cambia el estado por su cuenta: solo ordena y avisa.
 */
export function buildTodaySummary(inquiries: Inquiry[], today: IsoDate): TodaySummary {
  const open = inquiries.filter(isOpen);

  const overdue: Inquiry[] = [];
  const dueToday: Inquiry[] = [];
  const pending: Inquiry[] = [];

  for (const inquiry of open) {
    const state = followUpState(inquiry, today);
    if (state === "overdue") overdue.push(inquiry);
    else if (state === "today") dueToday.push(inquiry);
    else if (inquiry.status === "por_responder") pending.push(inquiry);
  }

  overdue.sort((a, b) => (a.followUpOn ?? "").localeCompare(b.followUpOn ?? "") || byCreatedAsc(a, b));
  dueToday.sort(byCreatedAsc);
  pending.sort(byCreatedAsc);

  return {
    pendingCount: open.filter((i) => i.status === "por_responder").length,
    followingCount: open.filter((i) => i.status === "esperando_respuesta" || i.status === "hacer_seguimiento").length,
    actions: [
      ...overdue.map((inquiry) => ({ inquiry, reason: "overdue" as const })),
      ...dueToday.map((inquiry) => ({ inquiry, reason: "due_today" as const })),
      ...pending.map((inquiry) => ({ inquiry, reason: "pending" as const })),
    ],
    hasAnyInquiry: inquiries.length > 0,
  };
}

/**
 * Rango para ordenar por "próxima acción" en la lista de consultas.
 * Menor = más urgente.
 */
function nextActionRank(inquiry: Inquiry, today: IsoDate): number {
  if (!isOpen(inquiry)) return 6;
  const state = followUpState(inquiry, today);
  if (state === "overdue") return 0;
  if (state === "today") return 1;
  if (inquiry.status === "por_responder") return 2;
  if (inquiry.status === "hacer_seguimiento") return 3;
  if (state === "upcoming") return 4;
  return 5;
}

export function sortByNextAction(inquiries: Inquiry[], today: IsoDate): Inquiry[] {
  return [...inquiries].sort((a, b) => {
    const rank = nextActionRank(a, today) - nextActionRank(b, today);
    if (rank !== 0) return rank;
    if (a.followUpOn && b.followUpOn && a.followUpOn !== b.followUpOn) {
      return a.followUpOn.localeCompare(b.followUpOn);
    }
    if (!isOpen(a)) return b.updatedAt.localeCompare(a.updatedAt);
    return byCreatedAsc(a, b);
  });
}
