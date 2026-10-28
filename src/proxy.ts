import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sessionCookieOptions } from "@/lib/supabase/cookies";

/** Rutas que no necesitan sesión. Todo lo demás es privado. */
const PUBLIC_PATHS = ["/acceso"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Refresca la sesión de Supabase en cada petición y manda a /acceso si no hay sesión.
 * Es una comprobación rápida: la de verdad (sesión + compra) se hace en el servidor
 * con requireUser() y, por debajo, con RLS en la base de datos.
 */
export async function proxy(request: NextRequest) {
  if (process.env.DEMO_MODE === "true") return NextResponse.next();

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.next(); // requireUser() explicará el error de configuración.

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookieOptions: sessionCookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const { pathname } = request.nextUrl;

  if (!signedIn && !isPublic(pathname)) {
    const redirect = NextResponse.redirect(new URL("/acceso", request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    // Todo menos estáticos, imágenes y archivos públicos (iconos, manifest, sw.js…).
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|json|js|txt)$).*)",
  ],
};
