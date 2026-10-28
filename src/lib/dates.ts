import type { IsoDate } from "@/features/inquiries/domain/types";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DAY_MS = 86_400_000;

/** Día de hoy (YYYY-MM-DD) en la zona horaria indicada. */
export function todayIn(timeZone: string, now: Date = new Date()): IsoDate {
  return toIsoDateIn(now, timeZone);
}

/** Convierte un instante al día de calendario que corresponde en la zona horaria. */
export function toIsoDateIn(instant: Date, timeZone: string): IsoDate {
  // en-CA formatea como YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

export function isValidIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function isoToUtcMs(value: IsoDate): number {
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
}

export function addDays(value: IsoDate, days: number): IsoDate {
  return new Date(isoToUtcMs(value) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Diferencia en días de calendario: positivo si `to` es posterior a `from`. */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((isoToUtcMs(to) - isoToUtcMs(from)) / DAY_MS);
}

const dayMonthFormat = new Intl.DateTimeFormat("es-ES", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const longDateFormat = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function cleanShort(text: string): string {
  // "jue, 30 oct" → "jue 30 oct"
  return text.replace(",", "").replace(/\./g, "");
}

/** Texto para una fecha de seguimiento: "hoy", "mañana", "ayer" o "jue 30 oct". */
export function formatFollowUp(value: IsoDate, today: IsoDate): string {
  const diff = daysBetween(today, value);
  if (diff === 0) return "hoy";
  if (diff === 1) return "mañana";
  if (diff === -1) return "ayer";
  return cleanShort(dayMonthFormat.format(new Date(isoToUtcMs(value))));
}

/** Texto para la fecha de creación: "hoy", "ayer", "hace 3 días" o "el 12 oct". */
export function formatReceived(createdAt: string, timeZone: string, now: Date = new Date()): string {
  const created = toIsoDateIn(new Date(createdAt), timeZone);
  const diff = daysBetween(created, todayIn(timeZone, now));
  if (diff <= 0) return "hoy";
  if (diff === 1) return "ayer";
  if (diff < 7) return `hace ${diff} días`;
  const text = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", timeZone }).format(
    new Date(createdAt),
  );
  return `el ${text.replace(/\./g, "")}`;
}

export function formatLongDate(value: IsoDate): string {
  return longDateFormat.format(new Date(isoToUtcMs(value)));
}

export function formatDateTime(instant: string, timeZone: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone,
  }).format(new Date(instant));
}

export type DayPart = "morning" | "afternoon" | "evening";

export function dayPartIn(timeZone: string, now: Date = new Date()): DayPart {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone }).format(now));
  if (hour >= 6 && hour < 14) return "morning";
  if (hour >= 14 && hour < 21) return "afternoon";
  return "evening";
}

/** Lunes de la semana de `value` (las semanas empiezan en lunes en España). */
export function startOfWeek(value: IsoDate): IsoDate {
  const weekday = new Date(isoToUtcMs(value)).getUTCDay(); // 0 = domingo
  return addDays(value, -((weekday + 6) % 7));
}
