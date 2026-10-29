import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { Client } from "pg";

/**
 * Utilidades para las pruebas contra un Supabase local. Nunca deben apuntar a producción:
 * se niegan a funcionar si la base de datos no está en localhost.
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable ${name} (sale de "npx supabase status -o env").`);
  return value;
}

export function databaseUrl(): string {
  const url = required("DB_URL");
  const host = new URL(url).hostname;
  if (host !== "127.0.0.1" && host !== "localhost") throw new Error("Las pruebas solo pueden usar un Supabase local.");
  return url;
}

function localSupabaseUrl(): string {
  const url = required("SUPABASE_URL");
  const host = new URL(url).hostname;
  if (host !== "127.0.0.1" && host !== "localhost") throw new Error("Las pruebas solo pueden usar un Supabase local.");
  return url;
}

/** Llamada directa a la API de Auth del Supabase local, como haría alguien sin pasar por la app. */
export async function authApi(path: string, body: unknown): Promise<Response> {
  return fetch(`${localSupabaseUrl()}/auth/v1${path}`, {
    method: "POST",
    headers: { apikey: required("SUPABASE_PUBLISHABLE_KEY"), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/**
 * Crea una cuenta con el email ya confirmado, como hará el servidor al recibir un pago.
 * Los registros están cerrados: nadie puede crearse una cuenta por su cuenta.
 */
export async function createAccount(email: string) {
  const key = required("SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(`${localSupabaseUrl()}/auth/v1/admin/users`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, email_confirm: true }),
  });
  if (!response.ok)
    throw new Error(`No se pudo crear la cuenta de prueba: ${response.status} ${await response.text()}`);
}

export async function sql<T extends Record<string, unknown> = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const client = new Client({ connectionString: databaseUrl() });
  await client.connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    await client.end();
  }
}

let counter = 0;
/** Email único por prueba para no mezclar cuentas ni códigos. */
export function uniqueEmail(name: string): string {
  counter += 1;
  return `${name}.${Date.now()}.${counter}@prueba.local`;
}

/** Acceso de prueba (dev_grant) para una cuenta que ya existe. */
export async function grantAccess(email: string) {
  await sql(
    `insert into public.entitlements (user_id, purchaser_email, product_code, source)
     select id, lower(email), 'clienta_en_radar', 'dev_grant' from auth.users where lower(email) = lower($1)`,
    [email],
  );
}

/** Simula un pago confirmado por Stripe para un email (con o sin cuenta todavía). */
export async function simulatePurchase(email: string) {
  const id = `${Date.now()}${Math.round(Math.random() * 1e6)}`;
  await sql(`select public.process_payment_succeeded($1, 'checkout.session.completed', $2, $3, now())`, [
    `evt_e2e_${id}`,
    email,
    `pi_e2e_${id}`,
  ]);
}

export async function revokeAccess(email: string) {
  await sql(
    `update public.entitlements set status = 'revoked', revoked_at = now(), revoke_reason = 'manual'
     where user_id = (select id from auth.users where lower(email) = lower($1)) and status = 'active'`,
    [email],
  );
}

/** Lee el último código de 6 cifras enviado a ese email en Mailpit. */
export async function latestCode(email: string, notBefore: number): Promise<string> {
  const base = required("MAILPIT_URL");
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const search = await fetch(`${base}/api/v1/search?query=${encodeURIComponent(`to:"${email}"`)}`);
    const { messages = [] } = (await search.json()) as { messages?: Array<{ ID: string; Created: string }> };
    const fresh = messages.find((message) => new Date(message.Created).getTime() >= notBefore - 1000);
    if (fresh) {
      const detail = (await (await fetch(`${base}/api/v1/message/${fresh.ID}`)).json()) as {
        Text?: string;
        HTML?: string;
      };
      const code = `${detail.Text ?? ""} ${detail.HTML ?? ""}`.match(/\b(\d{6})\b/)?.[1];
      if (code) return code;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No ha llegado ningún código a ${email}.`);
}

/** Crea la cuenta (si se pide) y entra con email y código, como lo haría una usuaria. */
export async function signIn(page: Page, email: string, { create = true }: { create?: boolean } = {}) {
  if (create) await createAccount(email);
  await page.goto("/acceso");
  await page.getByLabel("Tu email").fill(email);
  const sentAt = Date.now();
  await page.getByRole("button", { name: "Enviarme un código" }).click();
  await expect(page.getByText("Te hemos enviado un código")).toBeVisible();
  const code = await latestCode(email, sentAt);
  await page.getByLabel("Código").fill(code);
  await page.getByRole("button", { name: "Entrar" }).click();
  // Esperar a que el código se verifique y la sesión quede guardada antes de seguir navegando.
  await expect(page).not.toHaveURL(/\/acceso$/, { timeout: 15_000 });
}

/** Salta la bienvenida si aparece, para llegar a Hoy. */
export async function skipWelcome(page: Page) {
  await expect(page).toHaveURL(/\/(bienvenida|hoy)$/);
  if (page.url().endsWith("/bienvenida")) {
    await page.getByRole("button", { name: "Saltar por ahora" }).click();
  }
  await expect(page).toHaveURL(/\/hoy$/);
}
