import AxeBuilder from "@axe-core/playwright";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Devuelve los datos ficticios a su estado inicial (solo existe en modo demostración).
 * "vacio" simula una compradora recién llegada: sin consultas y con la bienvenida pendiente.
 */
export async function resetDemo(page: Page, mode: "ejemplo" | "vacio" = "ejemplo") {
  await page.goto("/ajustes");
  if (page.url().endsWith("/bienvenida")) {
    // Una prueba anterior dejó la cuenta como recién comprada: se salta la bienvenida para llegar a Ajustes.
    await page.getByRole("button", { name: "Saltar por ahora" }).click();
    await expect(page).toHaveURL(/\/hoy$/);
    await page.goto("/ajustes");
  }
  await page
    .getByRole("button", { name: mode === "ejemplo" ? "Restaurar datos de ejemplo" : "Ver como compradora nueva" })
    .click();
  await expect(page).toHaveURL(mode === "ejemplo" ? /\/hoy$/ : /\/bienvenida$/);
}

/** Comprueba WCAG 2.2 A/AA con axe. Devuelve las infracciones para mostrarlas si falla. */
export async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const summary = results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`);
  expect(summary).toEqual([]);
}

/** El aviso flotante (o en línea) con el texto indicado. */
export function statusMessage(page: Page, text: string | RegExp) {
  return page.getByRole("status").filter({ hasText: text }).first();
}
