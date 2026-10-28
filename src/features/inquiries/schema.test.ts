import { describe, expect, it } from "vitest";
import { createInquirySchema, statusChangeSchema, toFieldErrors, updateInquirySchema } from "./schema";

const VALID_ID = "3f0c6a8e-6b1f-4c1e-9a55-2f3b1d0e7c11";

function create(input: Record<string, unknown>) {
  return createInquirySchema.safeParse({ id: VALID_ID, customerLabel: "Lucía", summary: "Precio", ...input });
}

describe("createInquirySchema", () => {
  it("acepta lo mínimo: nombre y descripción", () => {
    const result = create({});
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      id: VALID_ID,
      customerLabel: "Lucía",
      summary: "Precio",
      channel: null,
      notes: null,
      followUpOn: null,
    });
  });

  it("recorta espacios y convierte opcionales vacíos en null", () => {
    const result = create({ customerLabel: "  Lucía  ", channel: "", notes: "   ", followUpOn: "" });
    expect(result.data).toMatchObject({ customerLabel: "Lucía", channel: null, notes: null, followUpOn: null });
  });

  it("rechaza nombre o descripción vacíos con mensajes claros", () => {
    const result = create({ customerLabel: "   ", summary: "" });
    expect(result.success).toBe(false);
    expect(toFieldErrors(result.error!)).toEqual({
      customerLabel: "Escribe un nombre o una referencia.",
      summary: "Cuenta en pocas palabras qué te han preguntado.",
    });
  });

  it("rechaza campos ausentes (formulario manipulado)", () => {
    const result = createInquirySchema.safeParse({ id: VALID_ID });
    expect(result.success).toBe(false);
    expect(Object.keys(toFieldErrors(result.error!))).toEqual(["customerLabel", "summary"]);
  });

  it("limita longitudes", () => {
    expect(create({ customerLabel: "a".repeat(81) }).success).toBe(false);
    expect(create({ customerLabel: "a".repeat(80) }).success).toBe(true);
    expect(create({ summary: "a".repeat(281) }).success).toBe(false);
    expect(create({ notes: "a".repeat(2001) }).success).toBe(false);
  });

  it("solo acepta canales de la lista", () => {
    expect(create({ channel: "instagram" }).success).toBe(true);
    const bad = create({ channel: "telegram" });
    expect(bad.success).toBe(false);
    expect(toFieldErrors(bad.error!).channel).toBe("Elige un canal de la lista.");
  });

  it("valida fechas reales", () => {
    expect(create({ followUpOn: "2026-11-03" }).data?.followUpOn).toBe("2026-11-03");
    expect(create({ followUpOn: "2026-02-30" }).success).toBe(false);
    expect(create({ followUpOn: "03/11/2026" }).success).toBe(false);
    expect(create({ followUpOn: "1900-01-01" }).success).toBe(false);
  });

  it("exige un id válido para evitar duplicados", () => {
    expect(create({ id: "no-es-un-uuid" }).success).toBe(false);
  });
});

describe("updateInquirySchema", () => {
  it("exige un estado válido", () => {
    const base = { customerLabel: "Lucía", summary: "Precio" };
    expect(updateInquirySchema.safeParse({ ...base, status: "resuelta" }).success).toBe(true);
    expect(updateInquirySchema.safeParse({ ...base, status: "borrada" }).success).toBe(false);
  });
});

describe("statusChangeSchema", () => {
  it("rechaza estados inventados", () => {
    expect(statusChangeSchema.safeParse({ id: VALID_ID, status: "hacer_seguimiento" }).success).toBe(true);
    expect(statusChangeSchema.safeParse({ id: VALID_ID, status: "pagada" }).success).toBe(false);
  });
});
