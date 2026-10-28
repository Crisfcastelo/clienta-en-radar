import type { CookieOptionsWithName } from "@supabase/ssr";

/**
 * Cookies de sesión inaccesibles desde JavaScript (httpOnly): la app no usa Supabase
 * en el navegador, así que un posible XSS no puede robar la sesión.
 */
export const sessionCookieOptions: CookieOptionsWithName = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};
