import { daysBetween, startOfWeek, toIsoDateIn } from "@/lib/dates";
import type { Inquiry, IsoDate } from "./types";

export type FollowUpState = "none" | "overdue" | "today" | "upcoming";

/** Abierta = no resuelta. Es lo único que puede pedir atención. */
export function isOpen(inquiry: Inquiry): boolean {
  return inquiry.status !== "resuelta";
}

export function followUpState(inquiry: Inquiry, today: IsoDate): FollowUpState {
  if (!inquiry.followUpOn || !isOpen(inquiry)) return "none";
  const diff = daysBetween(today, inquiry.followUpOn);
  if (diff < 0) return "overdue";
  if (diff === 0) return "today";
  return "upcoming";
}

/**
 * "Para revisar": tiene la fecha de revisión hoy o ya pasada, o está en
 * Hacer seguimiento sin fecha (le toca a ella y no debe quedar fuera del radar).
 */
export function needsReview(inquiry: Inquiry, today: IsoDate): boolean {
  if (!isOpen(inquiry)) return false;
  const state = followUpState(inquiry, today);
  if (state === "overdue" || state === "today") return true;
  return inquiry.status === "hacer_seguimiento" && !inquiry.followUpOn;
}

export interface TodaySummary {
  /** Revisiones de hoy o vencidas; las vencidas primero. */
  toReview: Inquiry[];
  /** Por responder que no están ya en revisión; la más antigua primero. */
  toAnswer: Inquiry[];
  pendingCount: number;
  reviewCount: number;
  resolvedThisWeek: number;
  hasAnyInquiry: boolean;
}

const byCreatedAsc = (a: Inquiry, b: Inquiry) => a.createdAt.localeCompare(b.createdAt);

/** Lo que necesita atención hoy. La app nunca cambia el estado por su cuenta: solo ordena y avisa. */
export function buildTodaySummary(inquiries: Inquiry[], today: IsoDate, timeZone: string): TodaySummary {
  const toReview = inquiries
    .filter((i) => needsReview(i, today))
    .sort((a, b) => (a.followUpOn ?? today).localeCompare(b.followUpOn ?? today) || byCreatedAsc(a, b));
  const reviewIds = new Set(toReview.map((i) => i.id));
  const toAnswer = inquiries.filter((i) => i.status === "por_responder" && !reviewIds.has(i.id)).sort(byCreatedAsc);

  const weekStart = startOfWeek(today);
  const resolvedThisWeek = inquiries.filter(
    (i) => i.status === "resuelta" && i.resolvedAt && toIsoDateIn(new Date(i.resolvedAt), timeZone) >= weekStart,
  ).length;

  return {
    toReview,
    toAnswer,
    pendingCount: inquiries.filter((i) => i.status === "por_responder").length,
    reviewCount: toReview.length,
    resolvedThisWeek,
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
