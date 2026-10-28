import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { requireUser } from "@/features/account/session";
import { FiltersForm } from "@/features/inquiries/components/filters-form";
import { InquiryCard } from "@/features/inquiries/components/inquiry-card";
import { inquiries } from "@/features/inquiries/data";
import { filterInquiries, hasActiveFilters, parseFilters } from "@/features/inquiries/domain/filters";
import { sortByNextAction } from "@/features/inquiries/domain/priority";
import { todayIn } from "@/lib/dates";

export const metadata: Metadata = { title: "Consultas" };

export default async function InquiriesPage({ searchParams }: PageProps<"/consultas">) {
  const user = await requireUser();
  const params = await searchParams;
  const filters = parseFilters(params);
  const today = todayIn(user.timezone);
  const all = await inquiries().list();
  const results = sortByNextAction(filterInquiries(all, filters, today, user.timezone), today);
  const filtered = hasActiveFilters(filters);
  const archivedView = filters.view === "archivadas";

  return (
    <div>
      <PageHeader
        title="Consultas"
        actions={
          <div className="hidden md:block">
            <ButtonLink href="/consultas/nueva">
              <Plus aria-hidden className="size-5" />
              Nueva consulta
            </ButtonLink>
          </div>
        }
      />

      {params.aviso === "eliminada" ? (
        <Notice tone="success" className="mb-4">
          Consulta eliminada.
        </Notice>
      ) : null}

      <nav aria-label="Vista" className="mb-4 inline-flex rounded-full border border-borde bg-superficie p-1">
        <ViewLink href="/consultas" active={!archivedView}>
          Activas
        </ViewLink>
        <ViewLink href="/consultas?vista=archivadas" active={archivedView}>
          Archivadas
        </ViewLink>
      </nav>

      <FiltersForm key={JSON.stringify(filters)} filters={filters} />

      <div className="mb-3 mt-6 flex flex-wrap items-baseline justify-between gap-2">
        <p role="status" className="font-semibold">
          {results.length === 1 ? "1 consulta" : `${results.length} consultas`}
          {archivedView ? " archivadas" : ""}
          <span className="font-normal text-chocolate-suave"> · ordenadas por próxima acción</span>
        </p>
        {filtered ? (
          <Link
            href={archivedView ? "/consultas?vista=archivadas" : "/consultas"}
            className="inline-flex min-h-11 items-center font-semibold text-oliva underline underline-offset-4"
          >
            Quitar filtros
          </Link>
        ) : null}
      </div>

      {results.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-lg font-semibold">
            {filtered
              ? "No hay consultas con estos filtros."
              : archivedView
                ? "No tienes consultas archivadas."
                : "Todo al día por aquí."}
          </p>
          {!filtered && !archivedView ? (
            <p className="mt-1 text-chocolate-suave">Cuando te escriba alguien, añádela con «Nueva consulta».</p>
          ) : null}
        </Card>
      ) : (
        <ul className="space-y-3">
          {results.map((inquiry) => (
            <li key={inquiry.id}>
              <InquiryCard inquiry={inquiry} today={today} timeZone={user.timezone} headingLevel="h2" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ViewLink({ href, active, children }: { href: string; active: boolean; children: string }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex min-h-11 items-center rounded-full px-5 font-semibold ${active ? "bg-oliva text-white" : "text-chocolate hover:bg-neutro"}`}
    >
      {children}
    </Link>
  );
}
