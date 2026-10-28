import { expect, test } from "@playwright/test";
import { expectNoA11yViolations, resetDemo } from "./helpers";

const PAGES = [
  { path: "/hoy", heading: "¿Qué tienes pendiente?" },
  { path: "/consultas", heading: "Todas tus consultas" },
  { path: "/consultas/nueva", heading: "¿Quién te ha escrito?" },
  { path: "/consultas/0b8f6a52-1f43-4c55-9b0e-6d7c1a2e3f01", heading: "Lucía (vestido de novia)" },
  { path: "/ayuda", heading: "Todo lo que necesitas, a mano" },
  { path: "/ajustes", heading: "Ajustes" },
  { path: "/bienvenida", heading: "Vamos a quitarte una preocupación de encima." },
  { path: "/bienvenida?paso=2", heading: "¿Quién te ha escrito?" },
  { path: "/bienvenida?paso=3", heading: "Ya tienes tu radar preparado." },
  { path: "/acceso", heading: "Entra en tu cuenta" },
  { path: "/sin-acceso", heading: "Este email todavía no tiene acceso" },
];

test.beforeEach(async ({ page }) => {
  await resetDemo(page);
});

for (const { path, heading } of PAGES) {
  test(`${path} carga, tiene un h1 y pasa axe`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.locator("h1")).toHaveCount(1);
    await expectNoA11yViolations(page);
    expect(errors).toEqual([]);
  });
}

test("la raíz lleva a Hoy", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/hoy$/);
});

test("la navegación principal marca la página actual", async ({ page, isMobile }) => {
  await page.goto("/hoy");
  const nav = page.getByRole("navigation", { name: "Principal" }).filter({ visible: true });
  await nav.getByRole("link", { name: "Consultas" }).click();
  await expect(page).toHaveURL(/\/consultas$/);
  await expect(nav.getByRole("link", { name: "Consultas" })).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: isMobile ? "Añadir" : "Añadir consulta" }).click();
  await expect(page).toHaveURL(/\/consultas\/nueva$/);
  await nav.getByRole("link", { name: "Ayuda" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Todo lo que necesitas, a mano" })).toBeVisible();
});

test("una página inexistente muestra un mensaje amable", async ({ page }) => {
  await page.goto("/esto-no-existe");
  await expect(page.getByRole("heading", { name: "Esta página no existe" })).toBeVisible();
});

test("una consulta inexistente o con id inválido da 'no encontrada'", async ({ page }) => {
  await page.goto("/consultas/00000000-0000-4000-8000-000000000999");
  await expect(page.getByRole("heading", { name: "No encontramos esta consulta" })).toBeVisible();
  await page.goto("/consultas/no-es-un-id");
  await expect(page.getByRole("heading", { name: "No encontramos esta consulta" })).toBeVisible();
});

test.describe("Primera configuración", () => {
  test("una compradora nueva pasa por la bienvenida y termina en sus pendientes", async ({ page }) => {
    await resetDemo(page, "vacio");
    // Mientras no termine la bienvenida, la zona privada la devuelve aquí.
    await page.goto("/hoy");
    await expect(page).toHaveURL(/\/bienvenida$/);
    await expect(page.getByText("Tus consultas pendientes, fuera de tu cabeza y bajo control.")).toBeVisible();

    await page.getByRole("link", { name: "Empezar" }).click();
    await expect(
      page.getByText("Empieza con tres consultas que tengas pendientes. No necesitas registrar todo lo anterior."),
    ).toBeVisible();
    await expect(page.getByText("Aún no has guardado ninguna.")).toBeVisible();

    await page.getByLabel("Nombre o referencia").fill("Sonia (bienvenida)");
    await page.getByLabel("Qué necesita").fill("Precio de la sesión de fotos");
    await page.getByRole("button", { name: "Guardar consulta" }).click();
    await expect(page.getByText("Guardada. Ya no tienes que acordarte de memoria.")).toBeVisible();
    await expect(page.getByText("Llevas 1 guardada.")).toBeVisible();

    await page.getByRole("link", { name: "Ya está por ahora" }).click();
    await expect(page.getByText("La idea es sencilla: que no tengas que acordarte de todo.")).toBeVisible();
    await page.getByRole("button", { name: "Ir a mis pendientes" }).click();

    await expect(page).toHaveURL(/\/hoy$/);
    await expect(
      page.getByRole("region", { name: /Por responder/ }).getByRole("link", { name: "Sonia (bienvenida)" }),
    ).toBeVisible();
    // Ya no vuelve a aparecer.
    await page.goto("/ayuda");
    await page.goto("/hoy");
    await expect(page).toHaveURL(/\/hoy$/);
  });

  test("se puede saltar y Hoy explica cómo empezar", async ({ page }) => {
    await resetDemo(page, "vacio");
    await page.getByRole("button", { name: "Saltar por ahora" }).click();
    await expect(page).toHaveURL(/\/hoy$/);
    await expect(page.getByRole("heading", { name: "Vamos a quitarte una preocupación de encima." })).toBeVisible();
    await expect(page.getByText("Empieza con tres consultas que tengas pendientes.")).toBeVisible();
    await expectNoA11yViolations(page);
  });
});

test("acceso: pide email válido y luego un código de 6 números", async ({ page }) => {
  await page.goto("/acceso");
  await expect(page.getByText("Tus consultas pendientes, fuera de tu cabeza y bajo control.")).toBeVisible();
  await page.getByRole("button", { name: "Enviarme un código" }).click();
  await expect(page.getByText("Escribe un email válido")).toBeVisible();
  await page.getByLabel("Tu email").fill("marta@ejemplo.es");
  await page.getByRole("button", { name: "Enviarme un código" }).click();
  await expect(page.getByText("Te hemos enviado un código")).toBeVisible();
  await page.getByLabel("Código").fill("12");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page.getByText("El código tiene 6 números")).toBeVisible();
  await page.getByLabel("Código").fill("123456");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/hoy$/);
});

test("cabeceras de seguridad y páginas privadas sin caché", async ({ request }) => {
  const response = await request.get("/hoy");
  const headers = response.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-powered-by"]).toBeUndefined();
  expect(headers["cache-control"]).toContain("no-store");
});
