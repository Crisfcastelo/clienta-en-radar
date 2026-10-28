"use client";

import { ChevronDown, Search } from "lucide-react";
import Form from "next/form";
import Link from "next/link";
import { useRef } from "react";
import { DATE_RANGE_LABELS, DATE_RANGES, STATUS_FILTERS, filtersHref } from "../domain/filters";
import type { InquiryFilters } from "../domain/filters";
import { CHANNEL_LABELS } from "../domain/labels";
import { INQUIRY_CHANNELS } from "../domain/types";
import type { InquiryStatus } from "../domain/types";

interface Props {
  filters: InquiryFilters;
  /** Cuántas hay en cada estado con el resto de filtros aplicados. */
  counts: Record<InquiryStatus | "todas", number>;
}

const pillSelect =
  "min-h-11 appearance-none rounded-full border border-borde-campo bg-superficie py-2 pr-9 pl-4 text-sm font-semibold text-chocolate";

/**
 * Filtros en la URL (se pueden compartir y el botón "atrás" funciona).
 * Estados como píldoras con contador; canal y fecha como desplegables.
 */
export function FiltersForm({ filters, counts }: Props) {
  const ref = useRef<HTMLFormElement>(null);
  const submit = () => ref.current?.requestSubmit();

  return (
    <div className="space-y-3">
      <nav aria-label="Filtrar por estado" className="relative -mx-4 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <ul className="flex w-max gap-2">
          {STATUS_FILTERS.map(({ value, label }) => {
            const active = filters.status === value;
            const count = counts[value ?? "todas"];
            return (
              <li key={label}>
                <Link
                  href={filtersHref({ ...filters, status: value })}
                  aria-current={active ? "page" : undefined}
                  className={
                    "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold whitespace-nowrap " +
                    (active
                      ? "border-bosque bg-bosque text-white shadow-[0_6px_16px_rgb(36_72_58/0.2)]"
                      : "border-white/80 bg-superficie/90 text-chocolate shadow-(--shadow-suave) hover:bg-superficie")
                  }
                >
                  {label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/20" : "bg-neutro text-chocolate-suave"}`}
                  >
                    <span className="sr-only">(</span>
                    {count}
                    <span className="sr-only">)</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Form ref={ref} action="/consultas" role="search" aria-label="Buscar consultas" className="space-y-3">
        {filters.status ? <input type="hidden" name="estado" value={filters.status} /> : null}

        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <label htmlFor="canal" className="sr-only">
              Canal
            </label>
            <select
              id="canal"
              name="canal"
              defaultValue={filters.channel ?? ""}
              onChange={submit}
              className={pillSelect}
            >
              <option value="">Canal: todos</option>
              {INQUIRY_CHANNELS.map((channel) => (
                <option key={channel} value={channel}>
                  Canal: {CHANNEL_LABELS[channel]}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
          </div>
          <div className="relative">
            <label htmlFor="fecha" className="sr-only">
              Recibida
            </label>
            <select id="fecha" name="fecha" defaultValue={filters.range} onChange={submit} className={pillSelect}>
              {DATE_RANGES.map((range) => (
                <option key={range} value={range}>
                  {DATE_RANGE_LABELS[range]}
                </option>
              ))}
            </select>
            <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
          </div>
        </div>

        <div className="relative">
          <label htmlFor="q" className="sr-only">
            Buscar por nombre o descripción
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-chocolate-suave"
          />
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="Buscar por nombre o tema"
            enterKeyHint="search"
            autoComplete="off"
            maxLength={80}
            className="block min-h-12 w-full rounded-2xl border border-borde-campo bg-superficie py-3 pr-4 pl-12 text-chocolate placeholder:text-chocolate-suave/80"
          />
        </div>
      </Form>
    </div>
  );
}
