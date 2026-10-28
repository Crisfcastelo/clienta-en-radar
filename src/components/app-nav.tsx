"use client";

import { BookOpen, CirclePlus, House, MessagesSquare, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/hoy", label: "Hoy", Icon: House },
  { href: "/consultas", label: "Consultas", Icon: MessagesSquare },
  { href: "/consultas/nueva", label: "Añadir", Icon: CirclePlus },
  { href: "/ayuda", label: "Ayuda", Icon: BookOpen },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/consultas") return pathname === "/consultas" || /^\/consultas\/(?!nueva)/.test(pathname);
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Barra inferior en móvil: cuatro destinos con el mismo peso. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/70 bg-superficie/85 pb-safe shadow-[0_-8px_24px_rgb(42_38_34/0.05)] backdrop-blur-lg md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${active ? "font-bold text-bosque" : "text-chocolate-suave"}`}
              >
                <Icon aria-hidden className="size-6" strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Barra lateral en tablet y escritorio. */
export function SideNav() {
  const pathname = usePathname();
  const links = [ITEMS[0], ITEMS[1], ITEMS[3], { href: "/ajustes", label: "Ajustes", Icon: Settings }];
  return (
    <nav aria-label="Principal" className="hidden md:block">
      <Link
        href="/consultas/nueva"
        className="mb-6 flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-bosque px-5 text-lg font-semibold text-white shadow-[0_6px_16px_rgb(36_72_58/0.25)] hover:bg-bosque-oscuro"
      >
        <CirclePlus aria-hidden className="size-6" />
        Añadir consulta
      </Link>
      <ul className="space-y-1">
        {links.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 ${active ? "bg-superficie/90 font-bold text-bosque shadow-(--shadow-suave)" : "hover:bg-superficie/60"}`}
              >
                <Icon aria-hidden className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
