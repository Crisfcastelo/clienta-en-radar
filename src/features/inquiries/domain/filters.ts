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

/** Filtros de estado visibles en Consultas, con los textos de contenido-funcional.md. */
export const STATUS_FILTERS: ReadonlyArray<{ value: InquiryStatus | null; label: string }> = [
  { value: null, label: "Todas" },
  { value: "por_responder", label: "Por responder" },
  { value: "esperando_respuesta", label: "Esperando respuesta" },
  { value: "hacer_seguimiento", label: "Seguimiento" },
  { value: "resuelta", label: "Resueltas" },
];

export interface InquiryFilters {
  q: string;
  status: InquiryStatus | null;
  channel: InquiryChannel | null;
  range: DateRange;
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
  };
}

export function hasActiveFilters(filters: InquiryFilters): boolean {
  return Boolean(filters.q || filters.status || moreFiltersCount(filters));
}

/** Filtros secundarios (canal y fecha), que van plegados en "Más filtros". */
export function moreFiltersCount(filters: InquiryFilters): number {
  return (filters.channel ? 1 : 0) + (filters.range !== "todas" ? 1 : 0);
}

/** URL de Consultas con los filtros indicados (los vacíos no se incluyen). */
export function filtersHref(filters: InquiryFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("estado", filters.status);
  if (filters.channel) params.set("canal", filters.channel);
  if (filters.range !== "todas") params.set("fecha", filters.range);
  const query = params.toString();
  return query ? `/consultas?${query}` : "/consultas";
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
    if (filters.status && inquiry.status !== filters.status) return false;
    if (filters.channel && inquiry.channel !== filters.channel) return false;
    if (since && toIsoDateIn(new Date(inquiry.createdAt), timeZone) < since) return false;
    if (needle) {
      const haystack = normalizeForSearch(
        `${inquiry.customerLabel ?? ""} ${inquiry.summary} ${inquiry.nextAction ?? ""}`,
      );
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}
