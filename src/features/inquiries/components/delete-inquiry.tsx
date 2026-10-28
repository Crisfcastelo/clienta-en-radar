"use client";

import { Trash2 } from "lucide-react";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteInquiryAction } from "../actions";
import type { ActionState } from "../actions";

const initial: ActionState = { status: "idle" };

/** Eliminar siempre pide confirmación: no se puede deshacer. */
export function DeleteInquiry({ id, customerLabel }: { id: string; customerLabel: string }) {
  const [state, remove] = useActionState(deleteInquiryAction, initial);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="space-y-1">
      <Button variant="ghost" className="-ml-2 text-terracota" onClick={() => setConfirmOpen(true)}>
        <Trash2 aria-hidden className="size-5" />
        Eliminar consulta
      </Button>
      <p className="text-sm text-chocolate-suave">
        Si ya no la necesitas, mejor resuélvela: así queda en el historial. Eliminar la borra para siempre.
      </p>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="¿Eliminar esta consulta?"
        description={
          <>
            Se borrará <strong className="text-chocolate">{customerLabel}</strong> con sus notas. No se puede deshacer.
          </>
        }
      >
        <form action={remove} className="space-y-3">
          <input type="hidden" name="id" value={id} />
          {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
          <SubmitButton variant="danger" full pendingLabel="Eliminando…">
            Sí, eliminar
          </SubmitButton>
          <Button variant="secondary" full onClick={() => setConfirmOpen(false)}>
            No, mantenerla
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
