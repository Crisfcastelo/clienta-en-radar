"use client";

import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { useRef } from "react";
import { Select, TextInput } from "@/components/ui/field";
import { DATE_RANGE_LABELS, DATE_RANGES, STATUS_FILTERS, filtersHref, moreFiltersCount } from "../domain/filters";
import type { InquiryFilters } from "../domain/filters";
import { CHANNEL_LABELS } from "../domain/labels";
import { INQUIRY_CHANNELS } from "../domain/types";

/**
 * Filtros en la URL (se pueden compartir y el botón "atrás" funciona).
 * Los estados van siempre a la vista; canal y fecha, plegados en "Más filtros".
 */
export function FiltersForm({ filters }: { filters: InquiryFilters }) {
  const ref = useRef<HTMLFormElement>(null);
  const submit = () => ref.current?.requestSubmit();
  const extra = moreFiltersCount(filters);

  return (
    <div className="space-y-3">
      <nav aria-label="Filtrar por estado">
        <ul className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(({ value, label }) => {
            const active = filters.status === value;
            return (
              <li key={label}>
                <Link
                  href={filtersHref({ ...filters, status: value })}
                  aria-current={active ? "page" : undefined}
                  className={
                    "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold " +
                    (active
                      ? "border-oliva bg-oliva text-white"
                      : "border-borde-campo bg-superficie text-chocolate hover:bg-neutro")
                  }
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Form ref={ref} action="/consultas" role="search" aria-label="Buscar consultas" className="space-y-3">
        {filters.status ? <input type="hidden" name="estado" value={filters.status} /> : null}

        <div className="flex gap-2">
          <label htmlFor="q" className="sr-only">
            Buscar por nombre o descripción
          </label>
          <TextInput
            id="q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Nombre o tema"
            enterKeyHint="search"
            autoComplete="off"
            maxLength={80}
          />
          <button
            type="submit"
            className="inline-flex size-12 shrink-0 items-center justify-center self-center rounded-full bg-oliva text-white hover:bg-oliva-oscuro"
          >
            <Search aria-hidden className="size-5" />
            <span className="sr-only">Buscar</span>
          </button>
        </div>

        <details className="group rounded-2xl border border-borde bg-superficie" open={extra > 0}>
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-semibold [&::-webkit-details-marker]:hidden">
            <SlidersHorizontal aria-hidden className="size-5" />
            Más filtros
            {extra > 0 ? <span className="text-chocolate-suave">({extra} activos)</span> : null}
            <ChevronDown aria-hidden className="ml-auto size-5 transition-transform group-open:rotate-180" />
          </summary>
          <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-2">
            <div>
              <label htmlFor="canal" className="mb-1 block text-sm font-semibold">
                Canal
              </label>
              <Select id="canal" name="canal" defaultValue={filters.channel ?? ""} onChange={submit}>
                <option value="">Todos</option>
                {INQUIRY_CHANNELS.map((channel) => (
                  <option key={channel} value={channel}>
                    {CHANNEL_LABELS[channel]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label htmlFor="fecha" className="mb-1 block text-sm font-semibold">
                Recibida
              </label>
              <Select id="fecha" name="fecha" defaultValue={filters.range} onChange={submit}>
                {DATE_RANGES.map((range) => (
                  <option key={range} value={range}>
                    {DATE_RANGE_LABELS[range]}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </details>
      </Form>
    </div>
  );
}
