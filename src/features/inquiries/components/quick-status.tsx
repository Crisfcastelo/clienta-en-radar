"use client";

import { ChevronRight } from "lucide-react";
import { useActionState, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Notice } from "@/components/ui/notice";
import { toast } from "@/components/toaster";
import { changeStatusAction } from "../actions";
import type { ActionState } from "../actions";
import { STATUS_HINTS, STATUS_LABELS } from "../domain/labels";
import { INQUIRY_STATUSES } from "../domain/types";
import type { InquiryStatus } from "../domain/types";
import { STATUS_ICONS } from "./status-badge";

interface Props {
  id: string;
  customerLabel: string;
  status: InquiryStatus;
}

const initial: ActionState = { status: "idle" };

/** Cambio de estado en un toque: cada opción es un botón que guarda directamente. */
export function QuickStatus({ id, customerLabel, status }: Props) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await changeStatusAction(prev, formData);
    if (result.status === "success") {
      setOpen(false);
      toast(result.message);
    }
    return result;
  }, initial);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative z-10 inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm font-semibold text-oliva underline-offset-4 hover:underline"
      >
        Cambiar estado
        <span className="sr-only"> de {customerLabel}</span>
        <ChevronRight aria-hidden className="size-4" />
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="¿En qué punto está?" description={customerLabel}>
        <form action={action} className="space-y-2">
          <input type="hidden" name="id" value={id} />
          {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
          {INQUIRY_STATUSES.map((option) => {
            const Icon = STATUS_ICONS[option];
            const isCurrent = option === status;
            return (
              <button
                key={option}
                type="submit"
                name="status"
                value={option}
                disabled={pending}
                aria-current={isCurrent ? "true" : undefined}
                className={
                  "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left disabled:opacity-60 " +
                  (isCurrent
                    ? "border-2 border-oliva bg-oliva-claro"
                    : "border-borde-campo bg-superficie hover:bg-neutro")
                }
              >
                <Icon aria-hidden className="size-6 shrink-0" />
                <span className="flex-1">
                  <span className="block font-semibold">
                    {STATUS_LABELS[option]}
                    {isCurrent ? <span className="font-normal text-chocolate-suave"> · actual</span> : null}
                  </span>
                  <span className="block text-sm text-chocolate-suave">{STATUS_HINTS[option]}</span>
                </span>
              </button>
            );
          })}
        </form>
      </Dialog>
    </>
  );
}
