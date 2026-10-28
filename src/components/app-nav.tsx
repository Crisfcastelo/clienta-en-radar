"use client";

import { CircleHelp, List, Plus, Settings, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/hoy", label: "Hoy", Icon: Sun },
  { href: "/consultas", label: "Consultas", Icon: List },
  { href: "/ayuda", label: "Ayuda", Icon: CircleHelp },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/consultas") return pathname === "/consultas" || /^\/consultas\/(?!nueva)/.test(pathname);
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Barra inferior en móvil. */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-borde bg-superficie/95 pb-safe backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 items-end">
        {ITEMS.slice(0, 2).map((item) => (
          <NavItem key={item.href} {...item} active={isActive(pathname, item.href)} />
        ))}
        <li className="flex justify-center">
          <Link
            href="/consultas/nueva"
            aria-current={pathname === "/consultas/nueva" ? "page" : undefined}
            className="-mt-5 flex flex-col items-center gap-1 pb-2 text-xs font-semibold"
          >
            <span className="flex size-14 items-center justify-center rounded-full bg-oliva text-white shadow-lg ring-4 ring-crema">
              <Plus aria-hidden className="size-7" />
            </span>
            Añadir
          </Link>
        </li>
        {ITEMS.slice(2).map((item) => (
          <NavItem key={item.href} {...item} active={isActive(pathname, item.href)} />
        ))}
      </ul>
    </nav>
  );
}

function NavItem({ href, label, Icon, active }: { href: string; label: string; Icon: typeof Sun; active: boolean }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${active ? "font-bold text-oliva" : "text-chocolate-suave"}`}
      >
        <Icon aria-hidden className="size-6" strokeWidth={active ? 2.5 : 2} />
        {label}
      </Link>
    </li>
  );
}

/** Barra lateral en tablet y escritorio. */
export function SideNav() {
  const pathname = usePathname();
  const links = [...ITEMS, { href: "/ajustes", label: "Ajustes", Icon: Settings }];
  return (
    <nav aria-label="Principal" className="hidden md:block">
      <Link
        href="/consultas/nueva"
        className="mb-6 flex min-h-14 items-center justify-center gap-2 rounded-full bg-oliva px-5 text-lg font-semibold text-white hover:bg-oliva-oscuro"
      >
        <Plus aria-hidden className="size-6" />
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
                className={`flex min-h-12 items-center gap-3 rounded-full px-4 ${active ? "bg-oliva-claro font-bold" : "hover:bg-neutro"}`}
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
