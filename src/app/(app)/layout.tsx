import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomNav, SideNav } from "@/components/app-nav";
import { BrandName } from "@/components/brand";
import { Toaster } from "@/components/toaster";
import { isDemoMode } from "@/lib/env";
import { requireUser } from "@/features/account/session";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  // Fase 3: aquí se verifica sesión y derecho de acceso antes de pintar nada privado.
  const user = await requireUser();
  if (!user.onboardedAt) redirect("/bienvenida");

  return (
    <div className="min-h-dvh">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-superficie focus:px-4 focus:py-2 focus:font-semibold"
      >
        Saltar al contenido
      </a>

      {isDemoMode() ? (
        <p className="pt-safe bg-dorado-claro px-4 py-1.5 text-center text-sm">
          Versión de prueba con datos ficticios. Nada de lo que escribas se guarda de forma permanente.
        </p>
      ) : null}

      <header className="flex items-center justify-end px-4 pt-3 md:hidden">
        <Link
          href="/ajustes"
          className="inline-flex size-12 items-center justify-center rounded-full border border-white/80 bg-salvia font-display text-xl text-bosque shadow-(--shadow-suave)"
        >
          <span aria-hidden>{initial(user.displayName ?? user.email)}</span>
          <span className="sr-only">Ajustes de tu cuenta</span>
        </Link>
      </header>

      <div className="mx-auto flex max-w-6xl gap-10 px-4 md:px-8 md:py-8">
        <aside className="hidden w-60 shrink-0 md:block">
          <div className="sticky top-8 space-y-8">
            <Link href="/hoy" className="block rounded-full">
              <BrandName />
            </Link>
            <SideNav />
          </div>
        </aside>
        <main id="contenido" className="min-w-0 flex-1 pt-4 pb-32 md:pt-0 md:pb-12">
          {children}
        </main>
      </div>

      <BottomNav />
      <Toaster />
    </div>
  );
}

function initial(name: string): string {
  return name.trim().charAt(0).toLocaleUpperCase("es-ES") || "·";
}
