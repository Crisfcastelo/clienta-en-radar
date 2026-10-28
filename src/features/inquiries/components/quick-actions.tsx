"use client";

import { CalendarClock, CircleCheck, MessageCircleReply, RotateCcw } from "lucide-react";
import { useActionState, useId, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { inputClasses } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { toast } from "@/components/toaster";
import { addDays, formatFollowUp } from "@/lib/dates";
import { inquiryAction } from "../actions";
import type { ActionState } from "../actions";
import { ACTION_LABELS, availableActions } from "../domain/transitions";
import type { InquiryAction } from "../domain/transitions";
import type { InquiryStatus } from "../domain/types";

interface Props {
  id: string;
  customerLabel: string;
  status: InquiryStatus;
  today: string;
}

const initial: ActionState = { status: "idle" };

const ICONS: Record<InquiryAction, typeof RotateCcw> = {
  respond: MessageCircleReply,
  prepare_follow_up: CalendarClock,
  resolve: CircleCheck,
  reopen: RotateCcw,
};

const PRESETS = [
  { label: "Hoy", days: 0 },
  { label: "Mañana", days: 1 },
  { label: "En 3 días", days: 3 },
  { label: "En una semana", days: 7 },
] as const;

const actionButton =
  "relative z-10 inline-flex min-h-11 items-center gap-1.5 rounded-full text-sm font-semibold disabled:opacity-60";

/**
 * Acciones de un toque según el momento de la consulta. Solo "Preparar seguimiento"
 * pide un dato más: cuándo retomarla.
 */
export function QuickActions({ id, customerLabel, status, today }: Props) {
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const dateId = useId();
  const [state, action, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await inquiryAction(prev, formData);
    if (result.status === "success") {
      setFollowUpOpen(false);
      toast(result.message);
    }
    return result;
  }, initial);

  const actions = availableActions(status);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <form action={action} className="contents">
        <input type="hidden" name="id" value={id} />
        {actions.map((name, index) => {
          const Icon = ICONS[name];
          const style =
            index === 0
              ? "border border-oliva bg-superficie px-3.5 text-oliva hover:bg-oliva-claro"
              : "px-3 text-chocolate hover:bg-neutro";
          if (name === "prepare_follow_up") {
            return (
              <button
                key={name}
                type="button"
                onClick={() => setFollowUpOpen(true)}
                className={`${actionButton} ${style}`}
              >
                <Icon aria-hidden className="size-4" />
                {ACTION_LABELS[name]}
                <span className="sr-only"> de {customerLabel}</span>
              </button>
            );
          }
          return (
            <button
              key={name}
              type="submit"
              name="action"
              value={name}
              disabled={pending}
              className={`${actionButton} ${style}`}
            >
              <Icon aria-hidden className="size-4" />
              {ACTION_LABELS[name]}
              <span className="sr-only"> de {customerLabel}</span>
            </button>
          );
        })}
      </form>

      {state.status === "error" && !followUpOpen ? (
        <p role="alert" className="relative z-10 w-full text-sm font-semibold text-terracota">
          {state.message}
        </p>
      ) : null}

      {actions.includes("prepare_follow_up") ? (
        <Dialog
          open={followUpOpen}
          onClose={() => setFollowUpOpen(false)}
          title="¿Cuándo quieres retomarla?"
          description={customerLabel}
        >
          <form action={action} className="space-y-4">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="action" value="prepare_follow_up" />
            {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => {
                const date = addDays(today, preset.days);
                return (
                  <button
                    key={preset.label}
                    type="submit"
                    name="followUpOn"
                    value={date}
                    disabled={pending}
                    className="flex min-h-14 flex-col items-center justify-center rounded-2xl border border-borde-campo bg-superficie px-3 py-2 hover:bg-neutro disabled:opacity-60"
                  >
                    <span className="font-semibold">{preset.label}</span>
                    {preset.days > 1 ? (
                      <span className="text-sm text-chocolate-suave">{formatFollowUp(date, today)}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </form>
          <form action={action} className="mt-4 space-y-2 border-t border-borde pt-4">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="action" value="prepare_follow_up" />
            <label htmlFor={dateId} className="block font-semibold">
              Otra fecha
            </label>
            <div className="flex gap-2">
              <input
                id={dateId}
                name="followUpOn"
                type="date"
                min={today}
                max="2100-12-31"
                required
                className={`${inputClasses} min-h-12`}
              />
              <SubmitButton variant="secondary" pendingLabel="Guardando…">
                Guardar
              </SubmitButton>
            </div>
          </form>
        </Dialog>
      ) : null}
    </div>
  );
}
