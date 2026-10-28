import "server-only";
import { addDays, todayIn } from "@/lib/dates";
import { DEMO_PROFILE } from "@/features/account/demo-profile";
import type { InquiryRepository } from "./repository";
import type { Inquiry } from "./domain/types";

/**
 * Almacén en memoria, solo para la fase 2. Se pierde al reiniciar el servidor
 * y lo comparten todas las visitas. Nunca debe usarse con datos reales.
 */
interface MockStore {
  inquiries: Map<string, Inquiry>;
}

const globalForMock = globalThis as typeof globalThis & { __clientaMockStore?: MockStore };

function store(): MockStore {
  globalForMock.__clientaMockStore ??= { inquiries: seed() };
  return globalForMock.__clientaMockStore;
}

function daysAgo(days: number, hour = 10): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
}

function seed(): Map<string, Inquiry> {
  const today = todayIn(DEMO_PROFILE.timezone);
  const rows: Array<Omit<Inquiry, "updatedAt" | "resolvedAt" | "nextAction"> & { nextAction?: string }> = [
    {
      id: "0b8f6a52-1f43-4c55-9b0e-6d7c1a2e3f01",
      customerLabel: "Lucía (vestido de novia)",
      channel: "instagram",
      summary: "Pregunta si hago arreglos de vestidos de novia y cuánto tardo.",
      notes: "Boda en marzo. Le interesa también el velo.",
      nextAction: "Enviar precio del arreglo",
      status: "hacer_seguimiento",
      followUpOn: addDays(today, -3),
      createdAt: daysAgo(9),
    },
    {
      id: "0b8f6a52-1f43-4c55-9b0e-6d7c1a2e3f02",
      customerLabel: "Marta R.",
      channel: "whatsapp",
      summary: "Quiere saber si hay hueco para una sesión el sábado por la mañana.",
      notes: null,
      status: "por_responder",
      followUpOn: null,
      createdAt: daysAgo(1, 18),
    },
    {
      id: "0b8f6a52-1f43-4c55-9b0e-6d7c1a2e3f03",
      customerLabel: "Tienda La Alacena",
      channel: "email",
      summary: "Pide presupuesto para 40 cajas regalo de empresa.",
      notes: "Necesitan factura con CIF.",
      nextAction: "Enviar presupuesto",
      status: "esperando_respuesta",
      followUpOn: today,
      createdAt: daysAgo(5),
    },
    {
      id: "0b8f6a52-1f43-4c55-9b0e-6d7c1a2e3f04",
      customerLabel: "Carmen",
      channel: "whatsapp",
      summary: "Duda sobre el envío a Canarias y los plazos.",
      notes: null,
      status: "por_responder",
      followUpOn: null,
      createdAt: daysAgo(0, 8),
    },
    {
      id: "0b8f6a52-1f43-4c55-9b0e-6d7c1a2e3f05",
      customerLabel: "Ana (taller de cerámica)",
      channel: "instagram",
      summary: "Le pasé los precios del taller de noviembre. Esperando si se apunta.",
      notes: null,
      status: "esperando_respuesta",
      followUpOn: addDays(today, 4),
      createdAt: daysAgo(3),
    },
    {
      id: "0b8f6a52-1f43-4c55-9b0e-6d7c1a2e3f06",
      customerLabel: "Paula G.",
      channel: "otro",
      summary: "Me la recomendó una clienta. Quiere información de bonos.",
      notes: "Llamó por teléfono.",
      status: "esperando_respuesta",
      followUpOn: addDays(today, -1),
      createdAt: daysAgo(12),
    },
    {
      id: "0b8f6a52-1f43-4c55-9b0e-6d7c1a2e3f07",
      customerLabel: "Elena",
      channel: "whatsapp",
      summary: "Confirmó la reserva para el día 15.",
      notes: null,
      status: "resuelta",
      followUpOn: null,
      createdAt: daysAgo(15),
    },
  ];

  return new Map(
    rows.map((row) => {
      const inquiry: Inquiry = {
        ...row,
        nextAction: row.nextAction ?? null,
        // Resuelta hace un rato: cuenta en "Resueltas esta semana" sea el día que sea.
        resolvedAt: row.status === "resuelta" ? new Date(Date.now() - 3_600_000).toISOString() : null,
        updatedAt: row.createdAt,
      };
      return [inquiry.id, inquiry];
    }),
  );
}

function touch(current: Inquiry, patch: Partial<Inquiry>): Inquiry {
  const now = new Date().toISOString();
  const next: Inquiry = { ...current, ...patch, updatedAt: now };
  // Misma regla que el trigger de la base de datos.
  if (next.status === "resuelta") next.resolvedAt = current.status === "resuelta" ? current.resolvedAt : now;
  else next.resolvedAt = null;
  store().inquiries.set(next.id, next);
  return next;
}

export const mockInquiryRepository: InquiryRepository = {
  async list() {
    return [...store().inquiries.values()];
  },

  async get(id) {
    return store().inquiries.get(id) ?? null;
  },

  async create(input) {
    const existing = store().inquiries.get(input.id);
    if (existing) return { inquiry: existing, created: false };
    const now = new Date().toISOString();
    const inquiry: Inquiry = {
      ...input,
      resolvedAt: input.status === "resuelta" ? now : null,
      createdAt: now,
      updatedAt: now,
    };
    store().inquiries.set(inquiry.id, inquiry);
    return { inquiry, created: true };
  },

  async update(id, fields) {
    const current = store().inquiries.get(id);
    return current ? touch(current, fields) : null;
  },

  async changeStatus(id, change) {
    const current = store().inquiries.get(id);
    return current ? touch(current, change) : null;
  },

  async remove(id) {
    return store().inquiries.delete(id);
  },
};

/** Solo modo demostración: vuelve a los datos de ejemplo o deja la cuenta vacía. */
export function resetMockStore(mode: "ejemplo" | "vacio"): void {
  store().inquiries = mode === "ejemplo" ? seed() : new Map();
}
