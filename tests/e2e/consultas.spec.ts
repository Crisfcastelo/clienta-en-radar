import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { expectNoA11yViolations, resetDemo, statusMessage } from "./helpers";

const LUCIA = "0b8f6a52-1f43-4c55-9b0e-6d7c1a2e3f01";
const CARMEN = "0b8f6a52-1f43-4c55-9b0e-6d7c1a2e3f04";
const SAVED = "Guardada. Ya no tienes que acordarte de memoria.";

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

function counter(page: Page, label: string) {
  return page.getByRole("region", { name: "Resumen" }).locator("div").filter({ hasText: label }).first();
}

test.describe("Añadir consulta", () => {
  test("valida campos obligatorios con mensajes claros y foco en el error", async ({ page }) => {
    await page.goto("/consultas/nueva");
    await expect(page.getByText("Guarda lo imprescindible. Lo demás puede esperar.")).toBeVisible();
    await page.getByRole("button", { name: "Guardar consulta" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Revisa los campos marcados." })).toBeVisible();
    await expect(page.getByText("Cuenta en pocas palabras qué necesita.")).toBeVisible();
    // El nombre es opcional: solo se marca lo que falta de verdad.
    await expect(page.getByLabel("Qué necesita")).toBeFocused();
    await expect(page.getByLabel("Qué necesita")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Nombre o referencia")).not.toHaveAttribute("aria-invalid", "true");
    await expectNoA11yViolations(page);
  });

  test("conserva lo escrito si hay un error", async ({ page }) => {
    await page.goto("/consultas/nueva");
    await page.getByLabel("Nombre o referencia").fill("Rosa");
    await page.getByRole("button", { name: "Guardar consulta" }).click();
    await expect(page.getByText("Cuenta en pocas palabras qué necesita.")).toBeVisible();
    await expect(page.getByLabel("Nombre o referencia")).toHaveValue("Rosa");
  });

  test("guarda con pocos toques y aparece en Hoy como por responder", async ({ page }) => {
    await page.goto("/consultas/nueva");
    await page.getByLabel("Nombre o referencia").fill("Rocío (prueba E2E)");
    await page.getByLabel("Qué necesita").fill("Quiere saber si hago envíos a Portugal.");
    await page.getByText("Instagram", { exact: true }).click();
    await page.getByRole("button", { name: "Guardar consulta" }).click();

    await expect(statusMessage(page, SAVED)).toBeVisible();
    // El formulario queda vacío y listo para otra.
    await expect(page.getByLabel("Nombre o referencia")).toHaveValue("");
    await expect(page.getByLabel("Nombre o referencia")).toBeFocused();

    await page.getByRole("link", { name: "volver a tus pendientes" }).click();
    const section = page.getByRole("region", { name: /Por responder/ });
    await expect(section.getByRole("link", { name: "Rocío (prueba E2E)" })).toBeVisible();
  });

  test("sin nombre, con estado elegido y próxima acción de un toque", async ({ page }) => {
    await page.goto("/consultas/nueva");
    await page.getByLabel("Qué necesita").fill("Pregunta por los bonos de primavera");
    await page.getByLabel("Estado").selectOption("esperando_respuesta");
    await page.getByRole("button", { name: "Enviar presupuesto" }).click();
    await expect(page.getByRole("textbox", { name: /^Próxima acción/ })).toHaveValue("Enviar presupuesto");
    await page.getByRole("button", { name: "Guardar consulta" }).click();
    await expect(statusMessage(page, SAVED)).toBeVisible();

    await page.goto("/consultas?estado=esperando_respuesta");
    const card = page.getByRole("article").filter({ hasText: "Pregunta por los bonos de primavera" });
    await expect(card.getByRole("link", { name: "Sin nombre" })).toBeVisible();
    await expect(card.getByText("Próxima acción:")).toBeVisible();
    await expect(card.getByText("Enviar presupuesto")).toBeVisible();
  });

  test("un doble envío no crea duplicados", async ({ page }) => {
    await page.goto("/consultas/nueva");
    await page.getByLabel("Nombre o referencia").fill("Doble envío");
    await page.getByLabel("Qué necesita").fill("Pulsé dos veces");
    // Dos envíos seguidos del mismo formulario, antes de que el botón llegue a bloquearse.
    await page
      .locator("form")
      .filter({ has: page.getByLabel("Nombre o referencia") })
      .evaluate((form: HTMLFormElement) => {
        form.requestSubmit();
        form.requestSubmit();
      });
    await expect(statusMessage(page, SAVED)).toBeVisible();
    expect(await countResults(page, "Doble envío")).toBe(1);
  });

  test("los atajos de fecha rellenan la próxima revisión", async ({ page }) => {
    await page.goto("/consultas/nueva");
    await page.getByRole("button", { name: "En una semana" }).click();
    await expect(page.getByLabel("Próxima revisión")).toHaveValue(/^\d{4}-\d{2}-\d{2}$/);
    await page.getByRole("button", { name: "Sin fecha" }).click();
    await expect(page.getByLabel("Próxima revisión")).toHaveValue("");
  });
});

test.describe("Hoy", () => {
  test("indicadores y prioridad: Para revisar primero, con las vencidas arriba", async ({ page }) => {
    await page.goto("/hoy");
    await expect(page.getByText("Aquí tienes las conversaciones que necesitan tu atención.")).toBeVisible();
    await expect(counter(page, "Por responder")).toContainText("2");
    await expect(counter(page, "Para revisar")).toContainText("3");
    await expect(counter(page, "Resueltas esta semana")).toContainText("1");

    await expect(page.locator("main h2").first()).toContainText("Para revisar");
    const review = page.getByRole("region", { name: /Para revisar/ });
    await expect(review.locator("li h3 a").first()).toHaveText("Lucía (vestido de novia)");
    await expect(review.getByText("Esta conversación necesita una revisión.").first()).toBeVisible();
    await expect(review.getByText("Revisar hoy", { exact: true })).toBeVisible();
    await expect(review.getByText(/Recibida/).first()).toBeVisible();
  });

  test("Resolver en un toque: mensaje de alivio y sale de la lista", async ({ page }) => {
    await page.goto("/hoy");
    await page.getByRole("button", { name: "Resolver de Carmen" }).click();
    await expect(statusMessage(page, "Una cosa menos en la cabeza.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Carmen" })).toHaveCount(0);
    await expect(counter(page, "Resueltas esta semana")).toContainText("2");
  });

  test("Marcar como respondida pasa a Esperando respuesta", async ({ page }) => {
    await page.goto("/hoy");
    await page.getByRole("button", { name: "Marcar como respondida de Marta R." }).click();
    await expect(statusMessage(page, "Marta R.: marcada como respondida.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Marta R." })).toHaveCount(0);

    await page.goto("/consultas?estado=esperando_respuesta");
    await expect(page.getByRole("link", { name: "Marta R." })).toBeVisible();
  });

  test("Preparar seguimiento pide cuándo y la trae a Para revisar", async ({ page }) => {
    await page.goto("/consultas?estado=esperando_respuesta");
    await page.getByRole("button", { name: "Preparar seguimiento de Ana (taller de cerámica)" }).click();
    const dialog = page.getByRole("dialog", { name: "¿Cuándo quieres retomarla?" });
    await expect(dialog).toBeVisible();
    await expectNoA11yViolations(page);
    await dialog.getByRole("button", { name: "Hoy" }).click();
    await expect(statusMessage(page, "Seguimiento preparado: revisar hoy.")).toBeVisible();
    await expect(dialog).toBeHidden();

    await page.goto("/hoy");
    await expect(
      page.getByRole("region", { name: /Para revisar/ }).getByRole("link", { name: "Ana (taller de cerámica)" }),
    ).toBeVisible();
  });

  test("el selector de seguimiento se cierra con Escape sin cambiar nada", async ({ page }) => {
    await page.goto("/consultas?estado=esperando_respuesta");
    await page.getByRole("button", { name: "Preparar seguimiento de Ana (taller de cerámica)" }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByRole("link", { name: "Ana (taller de cerámica)" })).toBeVisible();
  });
});

test.describe("Detalle", () => {
  test("editar descripción, estado y próxima revisión", async ({ page }) => {
    await page.goto(`/consultas/${CARMEN}`);
    await page.getByLabel("Qué necesita").fill("Envío a Canarias: le paso tarifas el lunes.");
    await page.getByLabel("Estado").selectOption("esperando_respuesta");
    await page.getByRole("button", { name: "Mañana" }).click();
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(statusMessage(page, "Cambios guardados.")).toBeVisible();

    await page.reload();
    await expect(page.getByLabel("Qué necesita")).toHaveValue("Envío a Canarias: le paso tarifas el lunes.");
    await expect(page.getByRole("definition").filter({ hasText: "mañana" })).toBeVisible();
    await expect(page.locator("main").getByText("Esperando respuesta").first()).toBeVisible();
  });

  test("resolver y reabrir: la resuelta queda en el historial", async ({ page }) => {
    await page.goto(`/consultas/${LUCIA}`);
    await page.getByRole("button", { name: "Resolver de Lucía (vestido de novia)" }).click();
    await expect(statusMessage(page, "Una cosa menos en la cabeza.")).toBeVisible();

    await page.goto("/consultas?estado=resuelta");
    await expect(page.getByRole("link", { name: "Lucía (vestido de novia)" })).toBeVisible();

    await page.goto(`/consultas/${LUCIA}`);
    await page.getByRole("button", { name: "Reabrir de Lucía (vestido de novia)" }).click();
    await expect(statusMessage(page, "Consulta reabierta.")).toBeVisible();
    await expect(page.locator("main").getByText("Por responder").first()).toBeVisible();
  });

  test("eliminar pide confirmación", async ({ page }) => {
    await page.goto(`/consultas/${CARMEN}`);
    await page.getByRole("button", { name: "Eliminar consulta" }).click();
    const dialog = page.getByRole("dialog", { name: "¿Eliminar esta consulta?" });
    await dialog.getByRole("button", { name: "No, mantenerla" }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(new RegExp(CARMEN));

    await page.getByRole("button", { name: "Eliminar consulta" }).click();
    await dialog.getByRole("button", { name: "Sí, eliminar" }).click();
    await expect(page).toHaveURL(/\/consultas\?aviso=eliminada$/);
    await expect(page.getByText("Consulta eliminada.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Carmen" })).toHaveCount(0);
  });
});

test.describe("Todas tus consultas", () => {
  test("busca por descripción sin importar tildes", async ({ page }) => {
    expect(await countResults(page, "CANARIAS")).toBe(1);
    await expect(page.getByRole("link", { name: "Carmen" })).toBeVisible();
    expect(await countResults(page, "lucia")).toBe(1);
  });

  test("filtros de estado visibles", async ({ page }) => {
    await page.goto("/consultas");
    const chips = page.getByRole("navigation", { name: "Filtrar por estado" });
    // Cada filtro muestra cuántas consultas hay en ese estado.
    await expect(chips.getByRole("link")).toHaveText([
      /^Todas\(?7\)?$/,
      /^Por responder\(?2\)?$/,
      /^Esperando respuesta\(?3\)?$/,
      /^Seguimiento\(?1\)?$/,
      /^Resueltas\(?1\)?$/,
    ]);
    await expect(chips.getByRole("link", { name: "Todas" })).toHaveAttribute("aria-current", "page");

    await chips.getByRole("link", { name: "Seguimiento" }).click();
    await expect(page).toHaveURL(/estado=hacer_seguimiento/);
    await expect(page.getByRole("link", { name: "Lucía (vestido de novia)" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Carmen" })).toHaveCount(0);

    await chips.getByRole("link", { name: "Resueltas" }).click();
    await expect(page.getByRole("link", { name: "Elena" })).toBeVisible();
  });

  test("filtro de canal, conservando el estado elegido", async ({ page }) => {
    await page.goto("/consultas?estado=esperando_respuesta");
    await page.getByLabel("Canal").selectOption("email");
    await expect(page).toHaveURL(/estado=esperando_respuesta/);
    await expect(page).toHaveURL(/canal=email/);
    await expect(page.getByRole("link", { name: "Tienda La Alacena" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Paula G." })).toHaveCount(0);
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

test.describe("Ayuda", () => {
  test("no muestra recursos que aún no están listos", async ({ page }) => {
    await page.goto("/ayuda");
    await expect(page.getByRole("heading", { name: "Recursos" })).toHaveCount(0);
    await expect(page.getByText("Responde sin pensar")).toHaveCount(0);
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
