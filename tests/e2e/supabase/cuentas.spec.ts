import { expect, test } from "@playwright/test";
import {
  authApi,
  createAccount,
  grantAccess,
  latestCode,
  revokeAccess,
  signIn,
  simulatePurchase,
  skipWelcome,
  sql,
  uniqueEmail,
} from "./helpers";

test.describe("Acceso con código", () => {
  test("sin sesión, todo lo privado lleva a Acceso", async ({ page }) => {
    for (const path of ["/hoy", "/consultas", "/consultas/nueva", "/ayuda", "/ajustes", "/sin-acceso"]) {
      await page.goto(path);
      await expect(page, path).toHaveURL(/\/acceso$/);
    }
    const response = await page.request.get("/api/exportar?formato=json", { maxRedirects: 0 });
    expect(response.status()).toBeGreaterThanOrEqual(300);
    expect(response.status()).toBeLessThan(400);
  });

  test("tener cuenta no es haber comprado: sin compra se queda en Sin acceso", async ({ page }) => {
    const email = uniqueEmail("sincompra");
    await signIn(page, email);
    await expect(page).toHaveURL(/\/sin-acceso$/);
    await expect(page.getByText(email)).toBeVisible();
    await page.goto("/hoy");
    await expect(page).toHaveURL(/\/sin-acceso$/);
  });

  test("un código incorrecto no deja entrar", async ({ page }) => {
    const email = uniqueEmail("codigo");
    await createAccount(email);
    await page.goto("/acceso");
    await page.getByLabel("Tu email").fill(email);
    const sentAt = Date.now();
    await page.getByRole("button", { name: "Enviarme un código" }).click();
    const code = await latestCode(email, sentAt);
    const wrong = code === "000000" ? "111111" : "000000";
    await page.getByLabel("Código").fill(wrong);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("El código no es correcto o ha caducado.")).toBeVisible();
    await expect(page).toHaveURL(/\/acceso$/);
  });

  test("la sesión va en una cookie inaccesible desde JavaScript", async ({ page, context }) => {
    const email = uniqueEmail("cookie");
    await signIn(page, email);
    await expect(page).toHaveURL(/\/sin-acceso$/);
    const authCookies = (await context.cookies()).filter((cookie) => cookie.name.startsWith("sb-"));
    expect(authCookies.length).toBeGreaterThan(0);
    for (const cookie of authCookies) {
      expect(cookie.httpOnly, cookie.name).toBe(true);
      expect(cookie.sameSite, cookie.name).toBe("Lax");
    }
    expect(await page.evaluate(() => document.cookie)).not.toContain("sb-");
  });

  test("cerrar sesión", async ({ page }) => {
    const email = uniqueEmail("salir");
    await signIn(page, email);
    await grantAccess(email);
    await page.goto("/hoy");
    await skipWelcome(page);
    await page.goto("/ajustes");
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/acceso$/);
    await page.goto("/hoy");
    await expect(page).toHaveURL(/\/acceso$/);
  });
});

test.describe("Compra con enlace de pago", () => {
  test("la compra hecha antes de tener cuenta se vincula al entrar con ese email", async ({ page }) => {
    const email = uniqueEmail("compradora");
    await simulatePurchase(email.toUpperCase());
    await signIn(page, email);
    await expect(page).toHaveURL(/\/bienvenida$/);
    await page.getByRole("button", { name: "Saltar por ahora" }).click();
    await expect(page).toHaveURL(/\/hoy$/);
    // La bienvenida queda guardada en su perfil: no vuelve a salir.
    await page.goto("/bienvenida");
    await page.goto("/hoy");
    await expect(page).toHaveURL(/\/hoy$/);
  });
});

test.describe("Registros cerrados", () => {
  test("nadie puede crearse una cuenta por su cuenta, ni con contraseña ni con código", async ({ page }) => {
    const email = uniqueEmail("intrusa");
    const password = "Contrasena-de-otra-persona-1";

    const signup = await authApi("/signup", { email, password });
    expect(signup.status, "el registro con contraseña tiene que estar cerrado").not.toBe(200);
    const login = await authApi("/token?grant_type=password", { email, password });
    expect(login.status).not.toBe(200);
    const otp = await authApi("/otp", { email, create_user: true });
    expect(otp.status, "pedir un código no puede crear la cuenta").not.toBe(200);

    // Desde la app, un email sin cuenta ve lo mismo que uno con cuenta, y no se crea nada.
    await page.goto("/acceso");
    await page.getByLabel("Tu email").fill(email);
    await page.getByRole("button", { name: "Enviarme un código" }).click();
    await expect(page.getByText("Te hemos enviado un código")).toBeVisible();
    const users = await sql("select 1 from auth.users where lower(email) = lower($1)", [email]);
    expect(users).toHaveLength(0);
  });
});

test.describe("Consultas guardadas de verdad", () => {
  test("alta, persistencia, acciones rápidas y eliminación", async ({ page }) => {
    const email = uniqueEmail("crud");
    await signIn(page, email);
    await grantAccess(email);
    await page.goto("/hoy");
    await skipWelcome(page);

    await page.goto("/consultas/nueva");
    await page.getByLabel("Nombre o referencia").fill("Clienta real");
    await page.getByLabel("Qué necesita").fill("Pregunta por el taller de diciembre");
    await page.getByRole("button", { name: "Guardar consulta" }).click();
    await expect(page.getByText("Guardada. Ya no tienes que acordarte de memoria.")).toBeVisible();

    await page.goto("/hoy");
    await page.reload();
    const card = page.getByRole("article").filter({ hasText: "Clienta real" });
    await expect(card).toBeVisible();

    await card.getByRole("button", { name: "Marcar como respondida de Clienta real" }).click();
    await expect(page.getByText("Clienta real: marcada como respondida.")).toBeVisible();
    await page.goto("/consultas?estado=esperando_respuesta");
    await expect(page.getByRole("link", { name: "Clienta real" })).toBeVisible();

    await page.getByRole("button", { name: "Resolver de Clienta real" }).click();
    await expect(page.getByText("Una cosa menos en la cabeza.")).toBeVisible();
    await page.goto("/consultas?estado=resuelta");
    await expect(page.getByRole("link", { name: "Clienta real" })).toBeVisible();

    await page.getByRole("link", { name: "Clienta real" }).click();
    await page.getByRole("button", { name: "Eliminar consulta" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Sí, eliminar" }).click();
    await expect(page).toHaveURL(/aviso=eliminada/);
    await expect(page.getByRole("link", { name: "Clienta real" })).toHaveCount(0);
  });
});

test.describe("Aislamiento entre usuarias", () => {
  test("una usuaria no ve ni abre ni exporta las consultas de otra", async ({ browser }) => {
    const ana = await browser.newContext();
    const bea = await browser.newContext();
    const anaPage = await ana.newPage();
    const beaPage = await bea.newPage();
    const anaEmail = uniqueEmail("ana");
    const beaEmail = uniqueEmail("bea");

    await signIn(anaPage, anaEmail);
    await grantAccess(anaEmail);
    await anaPage.goto("/hoy");
    await skipWelcome(anaPage);
    await anaPage.goto("/consultas/nueva");
    await anaPage.getByLabel("Nombre o referencia").fill("Secreto de Ana");
    await anaPage.getByLabel("Qué necesita").fill("Dato privado de Ana");
    await anaPage.getByRole("button", { name: "Guardar consulta" }).click();
    await expect(anaPage.getByText("Guardada.")).toBeVisible();
    await anaPage.goto("/consultas");
    await anaPage.getByRole("link", { name: "Secreto de Ana" }).click();
    await expect(anaPage).toHaveURL(/\/consultas\/[0-9a-f-]{36}$/);
    const anaInquiryUrl = anaPage.url();

    await signIn(beaPage, beaEmail);
    await grantAccess(beaEmail);
    await beaPage.goto("/hoy");
    await skipWelcome(beaPage);

    await beaPage.goto("/consultas");
    await expect(beaPage.getByText("Secreto de Ana")).toHaveCount(0);
    await beaPage.goto(anaInquiryUrl);
    await expect(beaPage.getByRole("heading", { name: "No encontramos esta consulta" })).toBeVisible();
    const exported = await (await beaPage.request.get("/api/exportar?formato=json")).text();
    expect(exported).not.toContain("Dato privado de Ana");

    await ana.close();
    await bea.close();
  });

  test("sin acceso (por ejemplo, tras un reembolso) puede seguir descargando sus datos", async ({ page }) => {
    const email = uniqueEmail("reembolso");
    await signIn(page, email);
    await grantAccess(email);
    await page.goto("/hoy");
    await skipWelcome(page);
    await page.goto("/consultas/nueva");
    await page.getByLabel("Qué necesita").fill("Consulta que quiero conservar");
    await page.getByRole("button", { name: "Guardar consulta" }).click();
    await expect(page.getByText("Guardada.")).toBeVisible();

    await revokeAccess(email);
    await page.goto("/hoy");
    await expect(page).toHaveURL(/\/sin-acceso$/);
    await expect(page.getByRole("link", { name: "Descargar para Excel (CSV)" })).toBeVisible();
    const csv = await (await page.request.get("/api/exportar?formato=csv")).text();
    expect(csv).toContain("Consulta que quiero conservar");
  });
});
