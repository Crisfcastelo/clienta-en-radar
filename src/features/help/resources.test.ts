import { describe, expect, it } from "vitest";
import { HELP_RESOURCES, availableResources } from "./resources";

describe("recursos de ayuda", () => {
  it("prepara los tres bonus", () => {
    expect(HELP_RESOURCES.map((r) => r.slug)).toEqual([
      "biblioteca-de-respuestas",
      "whatsapp-bajo-control",
      "seguimientos",
    ]);
  });

  it("no muestra bonus que aún no están listos", () => {
    expect(availableResources()).toEqual([]);
  });

  it("slugs únicos y válidos para usar en rutas", () => {
    const slugs = HELP_RESOURCES.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });
});
