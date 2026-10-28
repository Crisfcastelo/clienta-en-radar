import { describe, expect, it } from "vitest";
import { createInquirySchema, quickActionSchema, toFieldErrors, updateInquirySchema } from "./schema";

const VALID_ID = "3f0c6a8e-6b1f-4c1e-9a55-2f3b1d0e7c11";

function create(input: Record<string, unknown>) {
  return createInquirySchema.safeParse({ id: VALID_ID, customerLabel: "Lucía", summary: "Precio", ...input });
}

describe("createInquirySchema", () => {
  it("acepta lo mínimo: solo qué necesita; empieza en Por responder", () => {
    const result = createInquirySchema.safeParse({ id: VALID_ID, summary: "Precio" });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      id: VALID_ID,
      customerLabel: null,
      summary: "Precio",
      channel: null,
      notes: null,
      nextAction: null,
      followUpOn: null,
      status: "por_responder",
    });
  });

  it("recorta espacios y convierte opcionales vacíos en null", () => {
    const result = create({ customerLabel: "  Lucía  ", channel: "", notes: "   ", nextAction: " ", followUpOn: "" });
    expect(result.data).toMatchObject({
      customerLabel: "Lucía",
      channel: null,
      notes: null,
      nextAction: null,
      followUpOn: null,
    });
  });

  it("permite elegir el estado al crear", () => {
    expect(create({ status: "esperando_respuesta" }).data?.status).toBe("esperando_respuesta");
    expect(create({ status: "inventado" }).success).toBe(false);
  });

  it("guarda la próxima acción en texto libre", () => {
    expect(create({ nextAction: "  Enviar presupuesto " }).data?.nextAction).toBe("Enviar presupuesto");
    expect(create({ nextAction: "a".repeat(121) }).success).toBe(false);
  });

  it("rechaza una descripción vacía con un mensaje claro", () => {
    const result = create({ customerLabel: "   ", summary: "" });
    expect(result.success).toBe(false);
    expect(toFieldErrors(result.error!)).toEqual({ summary: "Cuenta en pocas palabras qué necesita." });
  });

  it("rechaza campos obligatorios ausentes (formulario manipulado)", () => {
    const result = createInquirySchema.safeParse({ id: VALID_ID });
    expect(result.success).toBe(false);
    expect(Object.keys(toFieldErrors(result.error!))).toEqual(["summary"]);
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

describe("quickActionSchema", () => {
  it("acepta acciones conocidas", () => {
    expect(quickActionSchema.safeParse({ id: VALID_ID, action: "respond" }).success).toBe(true);
    expect(quickActionSchema.safeParse({ id: VALID_ID, action: "resolve", followUpOn: "" }).success).toBe(true);
  });

  it("rechaza acciones inventadas", () => {
    expect(quickActionSchema.safeParse({ id: VALID_ID, action: "pagar" }).success).toBe(false);
  });

  it("preparar seguimiento exige una fecha válida", () => {
    const missing = quickActionSchema.safeParse({ id: VALID_ID, action: "prepare_follow_up", followUpOn: "" });
    expect(missing.success).toBe(false);
    expect(toFieldErrors(missing.error!).followUpOn).toBe("Elige cuándo quieres retomarla.");
    expect(
      quickActionSchema.safeParse({ id: VALID_ID, action: "prepare_follow_up", followUpOn: "2026-13-01" }).success,
    ).toBe(false);
    expect(
      quickActionSchema.safeParse({ id: VALID_ID, action: "prepare_follow_up", followUpOn: "2026-11-02" }).success,
    ).toBe(true);
  });
});
