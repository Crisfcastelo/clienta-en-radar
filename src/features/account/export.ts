import { CHANNEL_LABELS, STATUS_LABELS } from "@/features/inquiries/domain/labels";
import type { Inquiry } from "@/features/inquiries/domain/types";

/** Marca BOM: Excel en español la necesita para abrir bien las tildes. */
export const UTF8_BOM = String.fromCharCode(0xfeff);

const CSV_COLUMNS: Array<[string, (i: Inquiry) => string]> = [
  ["Nombre o referencia", (i) => i.customerLabel ?? ""],
  ["Canal", (i) => (i.channel ? CHANNEL_LABELS[i.channel] : "")],
  ["Descripción", (i) => i.summary],
  ["Notas", (i) => i.notes ?? ""],
  ["Estado", (i) => STATUS_LABELS[i.status]],
  ["Próxima acción", (i) => i.nextAction ?? ""],
  ["Fecha de seguimiento", (i) => i.followUpOn ?? ""],
  ["Creada", (i) => i.createdAt],
  ["Actualizada", (i) => i.updatedAt],
  ["Resuelta", (i) => i.resolvedAt ?? ""],
];

/**
 * Celda CSV segura: comillas escapadas y protección contra fórmulas
 * (una celda que empieza por =, +, - o @ se ejecutaría en Excel).
 */
export function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function inquiriesToCsv(list: Inquiry[]): string {
  const header = CSV_COLUMNS.map(([name]) => csvCell(name)).join(";");
  const rows = list.map((inquiry) => CSV_COLUMNS.map(([, get]) => csvCell(get(inquiry))).join(";"));
  // ";" es el separador que espera Excel con configuración española.
  return `${UTF8_BOM}${[header, ...rows].join("\r\n")}\r\n`;
}

export function inquiriesToJson(list: Inquiry[], exportedAt: Date): string {
  return JSON.stringify({ exportado: exportedAt.toISOString(), consultas: list }, null, 2);
}
