"use client";

import { useRef } from "react";
import { addDays } from "@/lib/dates";
import { inputClasses } from "@/components/ui/field";

interface Props {
  id: string;
  name: string;
  today: string;
  defaultValue?: string | null;
  describedBy?: string;
  invalid?: boolean;
}

const PRESETS = [
  { label: "Mañana", days: 1 },
  { label: "En 3 días", days: 3 },
  { label: "En una semana", days: 7 },
] as const;

/** Selector de fecha nativo (cómodo en móvil) con atajos de un toque. */
export function FollowUpInput({ id, name, today, defaultValue, describedBy, invalid }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  function set(value: string) {
    if (ref.current) {
      ref.current.value = value;
      ref.current.focus();
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={ref}
        id={id}
        name={name}
        type="date"
        min="2020-01-01"
        max="2100-12-31"
        defaultValue={defaultValue ?? ""}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        className={`${inputClasses} min-h-12`}
      />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Atajos de fecha">
        {PRESETS.map((preset) => (
          <button
            key={preset.days}
            type="button"
            onClick={() => set(addDays(today, preset.days))}
            className="min-h-11 rounded-full border border-borde-campo bg-superficie px-4 text-sm font-semibold hover:bg-neutro"
          >
            {preset.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => set("")}
          className="min-h-11 rounded-full px-4 text-sm font-semibold text-chocolate-suave underline-offset-4 hover:underline"
        >
          Sin fecha
        </button>
      </div>
    </div>
  );
}
