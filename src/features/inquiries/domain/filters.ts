import { addDays, toIsoDateIn } from "@/lib/dates";
import { isInquiryChannel, isInquiryStatus } from "./types";
import type { Inquiry, InquiryChannel, InquiryStatus, IsoDate } from "./types";

export const DATE_RANGES = ["todas", "hoy", "7d", "30d"] as const;
export type DateRange = (typeof DATE_RANGES)[number];

export const DATE_RANGE_LABELS: Record<DateRange, string> = {
  todas: "Cualquier fecha",
  hoy: "Recibidas hoy",
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
};

export type InquiryView = "activas" | "archivadas";

export interface InquiryFilters {
  q: string;
  status: InquiryStatus | null;
  channel: InquiryChannel | null;
  range: DateRange;
  view: InquiryView;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/** Lee filtros desde la URL. Cualquier valor desconocido se ignora sin romper. */
export function parseFilters(params: RawParams): InquiryFilters {
  const status = first(params.estado);
  const channel = first(params.canal);
  const range = first(params.fecha);
  return {
    q: first(params.q).trim().slice(0, 80),
    status: isInquiryStatus(status) ? status : null,
    channel: isInquiryChannel(channel) ? channel : null,
    range: (DATE_RANGES as readonly string[]).includes(range) ? (range as DateRange) : "todas",
    view: first(params.vista) === "archivadas" ? "archivadas" : "activas",
  };
}

export function hasActiveFilters(filters: InquiryFilters): boolean {
  return Boolean(filters.q || filters.status || filters.channel || filters.range !== "todas");
}

/** Minúsculas y sin tildes, para que "Lucía" se encuentre buscando "lucia". */
export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/** Escapa los comodines de LIKE/ILIKE para búsquedas en SQL (fase 4). */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export function filterInquiries(
  inquiries: Inquiry[],
  filters: InquiryFilters,
  today: IsoDate,
  timeZone: string,
): Inquiry[] {
  const needle = normalizeForSearch(filters.q);
  const since =
    filters.range === "hoy"
      ? today
      : filters.range === "7d"
        ? addDays(today, -6)
        : filters.range === "30d"
          ? addDays(today, -29)
          : null;

  return inquiries.filter((inquiry) => {
    const archived = inquiry.archivedAt !== null;
    if (filters.view === "activas" ? archived : !archived) return false;
    if (filters.status && inquiry.status !== filters.status) return false;
    if (filters.channel && inquiry.channel !== filters.channel) return false;
    if (since && toIsoDateIn(new Date(inquiry.createdAt), timeZone) < since) return false;
    if (needle) {
      const haystack = normalizeForSearch(`${inquiry.customerLabel} ${inquiry.summary}`);
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}
