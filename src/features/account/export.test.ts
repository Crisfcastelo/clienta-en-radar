import { describe, expect, it } from "vitest";
import { makeInquiry } from "@/features/inquiries/domain/test-factory";
import { UTF8_BOM, csvCell, inquiriesToCsv, inquiriesToJson } from "./export";

describe("exportación CSV", () => {
  it("escapa comillas", () => {
    expect(csvCell('Dice "hola"')).toBe('"Dice ""hola"""');
  });

  it("neutraliza fórmulas de hoja de cálculo", () => {
    expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
    expect(csvCell("+34 600")).toBe('"\'+34 600"');
    expect(csvCell("@usuario")).toBe('"\'@usuario"');
    expect(csvCell("Lucía")).toBe('"Lucía"');
  });

  it("incluye cabecera, BOM y una fila por consulta", () => {
    const csv = inquiriesToCsv([makeInquiry({ customerLabel: "Lucía", channel: "instagram" })]);
    expect(csv.startsWith(UTF8_BOM)).toBe(true);
    const lines = csv.trim().split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('"Lucía";"Instagram"');
  });
});

describe("exportación JSON", () => {
  it("incluye fecha de exportación y todas las consultas", () => {
    const json = JSON.parse(inquiriesToJson([makeInquiry(), makeInquiry()], new Date("2026-10-28T10:00:00Z")));
    expect(json.exportado).toBe("2026-10-28T10:00:00.000Z");
    expect(json.consultas).toHaveLength(2);
  });
});
