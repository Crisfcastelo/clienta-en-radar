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
import { INQUIRY_STATUSES } from "@/features/inquiries/domain/types";
import type { InquiryStatus } from "@/features/inquiries/domain/types";
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
  const sameOtherFilters = filterInquiries(all, { ...filters, status: null }, today, user.timezone);
  const counts = {
    todas: sameOtherFilters.length,
    ...Object.fromEntries(
      INQUIRY_STATUSES.map((status) => [status, sameOtherFilters.filter((i) => i.status === status).length]),
    ),
  } as Record<InquiryStatus | "todas", number>;

  return (
    <div>
      <PageHeader
        title="Todas tus consultas"
        intro="Encuentra una conversación y comprueba en qué punto está."
        actions={
          <div className="hidden md:block">
            <ButtonLink href="/consultas/nueva">
              <Plus aria-hidden className="size-5" />
              Añadir consulta
            </ButtonLink>
          </div>
        }
      />

      {params.aviso === "eliminada" ? (
        <Notice tone="success" className="mb-4">
          Consulta eliminada.
        </Notice>
      ) : null}

      <FiltersForm key={JSON.stringify(filters)} filters={filters} counts={counts} />

      <div className="mb-3 mt-6 flex flex-wrap items-baseline justify-between gap-2">
        <p role="status" className="font-semibold">
          {results.length === 1 ? "1 consulta" : `${results.length} consultas`}
          <span className="font-normal text-chocolate-suave"> · ordenadas por próxima acción</span>
        </p>
        {filtered ? (
          <Link
            href="/consultas"
            className="inline-flex min-h-11 items-center font-semibold text-bosque underline underline-offset-4"
          >
            Quitar filtros
          </Link>
        ) : null}
      </div>

      {results.length === 0 ? (
        <Card className="space-y-3 p-6 text-center">
          <p className="text-lg font-semibold">
            {filtered ? "No hay consultas con estos filtros." : "Aún no tienes consultas guardadas."}
          </p>
          {!filtered ? (
            <ButtonLink href="/consultas/nueva">
              <Plus aria-hidden className="size-5" />
              Añadir consulta
            </ButtonLink>
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
