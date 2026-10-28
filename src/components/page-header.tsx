import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface Props {
  title: string;
  intro?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
}

export function PageHeader({ title, intro, back, actions }: Props) {
  return (
    <header className="mb-6 space-y-2">
      {back ? (
        <Link
          href={back.href}
          className="group -ml-1 inline-flex min-h-11 items-center gap-2 rounded-full pr-2 font-semibold text-bosque"
        >
          <span className="flex size-10 items-center justify-center rounded-full border border-white/80 bg-superficie/90 shadow-(--shadow-suave) group-hover:bg-superficie">
            <ArrowLeft aria-hidden className="size-5" />
          </span>
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-4xl md:text-5xl">{title}</h1>
        {actions}
      </div>
      {intro ? <div className="text-chocolate-suave">{intro}</div> : null}
    </header>
  );
}
