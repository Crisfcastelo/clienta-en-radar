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
          className="-ml-2 inline-flex min-h-11 items-center gap-1 rounded-full px-2 font-semibold text-oliva hover:underline"
        >
          <ArrowLeft aria-hidden className="size-5" />
          {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-semibold md:text-4xl">{title}</h1>
        {actions}
      </div>
      {intro ? <div className="text-chocolate-suave">{intro}</div> : null}
    </header>
  );
}
