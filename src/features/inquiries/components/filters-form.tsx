"use client";

import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import Form from "next/form";
import { useRef } from "react";
import { Select, TextInput } from "@/components/ui/field";
import { DATE_RANGE_LABELS, DATE_RANGES } from "../domain/filters";
import type { InquiryFilters } from "../domain/filters";
import { CHANNEL_LABELS, STATUS_LABELS } from "../domain/labels";
import { INQUIRY_CHANNELS, INQUIRY_STATUSES } from "../domain/types";

/**
 * Formulario GET: los filtros viven en la URL (se pueden compartir y el botón
 * "atrás" funciona). Los desplegables aplican el cambio al momento.
 */
export function FiltersForm({ filters }: { filters: InquiryFilters }) {
  const ref = useRef<HTMLFormElement>(null);
  const submit = () => ref.current?.requestSubmit();
  const activeCount = [filters.status, filters.channel, filters.range !== "todas" ? filters.range : null].filter(
    Boolean,
  ).length;

  return (
    <Form ref={ref} action="/consultas" role="search" aria-label="Buscar y filtrar consultas" className="space-y-3">
      {filters.view === "archivadas" ? <input type="hidden" name="vista" value="archivadas" /> : null}

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

      <details className="group rounded-2xl border border-borde bg-superficie" open={activeCount > 0}>
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 font-semibold [&::-webkit-details-marker]:hidden">
          <SlidersHorizontal aria-hidden className="size-5" />
          Filtrar por estado, canal o fecha
          {activeCount > 0 ? <span className="text-chocolate-suave">({activeCount} activos)</span> : null}
          <ChevronDown aria-hidden className="ml-auto size-5 transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid grid-cols-1 gap-3 px-4 pb-4 sm:grid-cols-3">
          <div>
            <label htmlFor="estado" className="mb-1 block text-sm font-semibold">
              Estado
            </label>
            <Select id="estado" name="estado" defaultValue={filters.status ?? ""} onChange={submit}>
              <option value="">Todos</option>
              {INQUIRY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          </div>
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
  );
}
