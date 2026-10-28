import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * Dos modos de prueba:
 * - demo (por defecto): datos ficticios en memoria, sin servicios externos.
 * - supabase (E2E_MODE=supabase): cuentas reales contra un Supabase local
 *   (`npx supabase start`), con los códigos de acceso leídos de Mailpit.
 */
const supabaseMode = process.env.E2E_MODE === "supabase";

const serverEnv: Record<string, string> = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
);
if (!supabaseMode) serverEnv.DEMO_MODE = "true";

export default defineConfig({
  testDir: supabaseMode ? "./tests/e2e/supabase" : "./tests/e2e/demo",
  // Los datos (en memoria o en la base local) se comparten: pruebas en serie.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "es-ES",
    timezoneId: "Europe/Madrid",
    trace: "retain-on-failure",
    // Para entornos con un Chromium ya instalado de otra versión (p. ej. contenedores de desarrollo).
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  projects: [
    { name: "movil", use: { ...devices["Pixel 7"] } },
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}/acceso`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: serverEnv,
  },
});
