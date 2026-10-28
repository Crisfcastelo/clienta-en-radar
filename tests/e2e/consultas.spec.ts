import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { expectNoA11yViolations, resetDemo } from "./helpers";

const LUCIA = "0b8f6a52-1f43-4c55-9b0e-6d7c1a2e3f01";
const CARMEN = "0b8f6a52-1f43-4c55-9b0e-6d7c1a2e3f04";

test.beforeEach(async ({ page }) => {
  await resetDemo(page);
});

async function countResults(page: Page, query: string) {
  await page.goto(`/consultas?q=${encodeURIComponent(query)}`);
  const text = await page
    .getByRole("status")
    .filter({ hasText: /consultas?/ })
    .first()
    .textContent();
  return Number(text?.match(/^(\d+)/)?.[1] ?? NaN);
}

test.describe("Nueva consulta", () => {
  test("valida campos obligatorios con mensajes claros y foco en el error", async ({ page }) => {
    await page.goto("/consultas/nueva");
    await page.getByRole("button", { name: "Guardar consulta" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Revisa los campos marcados." })).toBeVisible();
    await expect(page.getByText("Escribe un nombre o una referencia.")).toBeVisible();
    await expect(page.getByText("Cuenta en pocas palabras qué te han preguntado.")).toBeVisible();
    await expect(page.getByLabel("Nombre o referencia")).toBeFocused();
    await expect(page.getByLabel("Nombre o referencia")).toHaveAttribute("aria-invalid", "true");
    await expectNoA11yViolations(page);
  });

  test("conserva lo escrito si hay un error", async ({ page }) => {
    await page.goto("/consultas/nueva");
    await page.getByLabel("¿Qué te ha preguntado?").fill("Precio del curso");
    await page.getByRole("button", { name: "Guardar consulta" }).click();
    await expect(page.getByText("Escribe un nombre o una referencia.")).toBeVisible();
    await expect(page.getByLabel("¿Qué te ha preguntado?")).toHaveValue("Precio del curso");
  });

  test("guarda con pocos toques y aparece en Hoy como por responder", async ({ page }) => {
    await page.goto("/consultas/nueva");
    await page.getByLabel("Nombre o referencia").fill("Rocío (prueba E2E)");
    await page.getByLabel("¿Qué te ha preguntado?").fill("Quiere saber si hago envíos a Portugal.");
    await page.getByText("Instagram", { exact: true }).click();
    await page.getByRole("button", { name: "Guardar consulta" }).click();

    await expect(page.getByRole("status").filter({ hasText: "Guardada: Rocío (prueba E2E)." }).first()).toBeVisible();
    // El formulario queda vacío y listo para otra.
    await expect(page.getByLabel("Nombre o referencia")).toHaveValue("");
    await expect(page.getByLabel("Nombre o referencia")).toBeFocused();

    await page.goto("/hoy");
    const section = page.getByRole("region", { name: /Por responder/ });
    await expect(section.getByRole("link", { name: "Rocío (prueba E2E)" })).toBeVisible();
  });

  test("un doble envío no crea duplicados", async ({ page }) => {
    await page.goto("/consultas/nueva");
    await page.getByLabel("Nombre o referencia").fill("Doble envío");
    await page.getByLabel("¿Qué te ha preguntado?").fill("Pulsé dos veces");
    // Dos envíos seguidos del mismo formulario, antes de que el botón llegue a bloquearse.
    await page
      .locator("form")
      .filter({ has: page.getByLabel("Nombre o referencia") })
      .evaluate((form: HTMLFormElement) => {
        form.requestSubmit();
        form.requestSubmit();
      });
    await expect(page.getByRole("status").filter({ hasText: "Guardada: Doble envío." }).first()).toBeVisible();
    expect(await countResults(page, "Doble envío")).toBe(1);
  });

  test("los atajos de fecha rellenan la fecha de seguimiento", async ({ page }) => {
    await page.goto("/consultas/nueva");
    await page.getByRole("button", { name: "En una semana" }).click();
    await expect(page.getByLabel("¿Cuándo quieres revisarla?")).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);
    await page.getByRole("button", { name: "Sin fecha" }).click();
    await expect(page.getByLabel("¿Cuándo quieres revisarla?")).toHaveValue("");
  });
});

test.describe("Hoy", () => {
  test("prioriza seguimientos vencidos y diferencia fechas", async ({ page }) => {
    await page.goto("/hoy");
    const headings = page.locator("main h2");
    await expect(headings.first()).toContainText("Necesitan una revisión");
    const overdue = page.getByRole("region", { name: /Necesitan una revisión/ });
    await expect(overdue.getByText("Esta conversación necesita una revisión.").first()).toBeVisible();
    await expect(overdue.getByText(/Recibida/).first()).toBeVisible();
    await expect(
      page.getByRole("region", { name: /Para revisar hoy/ }).getByText("Revisar hoy", { exact: true }),
    ).toBeVisible();
  });

  test("resolver desde Hoy: mensaje de alivio y desaparece de la lista", async ({ page }) => {
    await page.goto("/hoy");
    await page.getByRole("button", { name: "Cambiar estado de Carmen" }).click();
    const dialog = page.getByRole("dialog", { name: "¿En qué punto está?" });
    await expect(dialog).toBeVisible();
    await expectNoA11yViolations(page);
    await dialog.getByRole("button", { name: /Resuelta/ }).click();
    await expect(page.getByRole("status").filter({ hasText: "Una cosa menos en la cabeza." })).toBeVisible();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("link", { name: "Carmen" })).toHaveCount(0);
  });

  test("el diálogo de estado se cierra con Escape y no cambia nada", async ({ page }) => {
    await page.goto("/hoy");
    await page.getByRole("button", { name: "Cambiar estado de Carmen" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByRole("link", { name: "Carmen" })).toBeVisible();
  });
});

test.describe("Detalle", () => {
  test("editar descripción, estado y fecha de seguimiento", async ({ page }) => {
    await page.goto(`/consultas/${CARMEN}`);
    await page.getByLabel("¿Qué te ha preguntado?").fill("Envío a Canarias: le paso tarifas el lunes.");
    await page.getByText("Esperando respuesta", { exact: true }).click();
    await page.getByRole("button", { name: "Mañana" }).click();
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Cambios guardados." })).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("¿Qué te ha preguntado?")).toHaveValue("Envío a Canarias: le paso tarifas el lunes.");
    await expect(page.getByRole("definition").filter({ hasText: "mañana" })).toBeVisible();
    await expect(page.locator("main").getByText("Esperando respuesta").first()).toBeVisible();
  });

  test("archivar, sacar del archivo y reabrir", async ({ page }) => {
    await page.goto(`/consultas/${LUCIA}`);
    await page.getByRole("button", { name: "Archivar" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Consulta archivada." })).toBeVisible();
    await expect(page.getByText("Archivada", { exact: true })).toBeVisible();

    await page.goto("/consultas?vista=archivadas");
    await expect(page.getByRole("link", { name: "Lucía (vestido de novia)" })).toBeVisible();
    await page.goto("/consultas");
    await expect(page.getByRole("link", { name: "Lucía (vestido de novia)" })).toHaveCount(0);

    await page.goto(`/consultas/${LUCIA}`);
    await page.getByRole("button", { name: "Sacar del archivo" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Consulta recuperada del archivo." })).toBeVisible();

    await page.getByText("Resuelta", { exact: true }).click();
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Una cosa menos en la cabeza." })).toBeVisible();
    await page.getByRole("button", { name: "Reabrir consulta" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Consulta reabierta." })).toBeVisible();
    await expect(page.locator("main").getByText("Por responder").first()).toBeVisible();
  });

  test("eliminar pide confirmación", async ({ page }) => {
    await page.goto(`/consultas/${CARMEN}`);
    await page.getByRole("button", { name: "Eliminar" }).click();
    const dialog = page.getByRole("dialog", { name: "¿Eliminar esta consulta?" });
    await dialog.getByRole("button", { name: "No, mantenerla" }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(new RegExp(CARMEN));

    await page.getByRole("button", { name: "Eliminar" }).click();
    await dialog.getByRole("button", { name: "Sí, eliminar" }).click();
    await expect(page).toHaveURL(/\/consultas\?aviso=eliminada$/);
    await expect(page.getByText("Consulta eliminada.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Carmen" })).toHaveCount(0);
  });
});

test.describe("Lista de consultas", () => {
  test("busca por descripción sin importar tildes", async ({ page }) => {
    expect(await countResults(page, "CANARIAS")).toBe(1);
    await expect(page.getByRole("link", { name: "Carmen" })).toBeVisible();
    expect(await countResults(page, "lucia")).toBe(1);
  });

  test("filtra por canal y estado al cambiar el desplegable", async ({ page }) => {
    await page.goto("/consultas");
    await page.getByText("Filtrar por estado, canal o fecha").click();
    await page.getByLabel("Canal").selectOption("email");
    await expect(page).toHaveURL(/canal=email/);
    await expect(page.getByRole("link", { name: "Tienda La Alacena" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Carmen" })).toHaveCount(0);
    await page.getByRole("link", { name: "Quitar filtros" }).click();
    await expect(page.getByRole("link", { name: "Carmen" })).toBeVisible();
  });

  test("ordena por próxima acción: lo vencido arriba, lo resuelto al final", async ({ page }) => {
    await page.goto("/consultas");
    const names = await page.locator("main ul > li h2 > a").allTextContents();
    expect(names[0]).toBe("Lucía (vestido de novia)");
    expect(names.at(-1)).toBe("Elena");
  });
});

test.describe("Exportación", () => {
  test("CSV y JSON descargables y sin caché", async ({ request }) => {
    const csv = await request.get("/api/exportar?formato=csv");
    expect(csv.headers()["content-type"]).toContain("text/csv");
    expect(csv.headers()["content-disposition"]).toMatch(
      /attachment; filename="clienta-en-radar-\d{4}-\d{2}-\d{2}\.csv"/,
    );
    expect(csv.headers()["cache-control"]).toBe("no-store");
    expect(await csv.text()).toContain('"Nombre o referencia";"Canal"');

    const json = await request.get("/api/exportar?formato=json");
    const body = await json.json();
    expect(body.consultas.length).toBeGreaterThan(0);
  });
});
