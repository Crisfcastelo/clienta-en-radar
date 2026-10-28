"use client";

import { Archive, ArchiveRestore, RotateCcw, Trash2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { toast } from "@/components/toaster";
import { deleteInquiryAction, reopenAction, setArchivedAction } from "../actions";
import type { ActionState } from "../actions";

interface Props {
  id: string;
  customerLabel: string;
  archived: boolean;
  resolved: boolean;
}

const initial: ActionState = { status: "idle" };

function useToastOnSuccess(state: ActionState) {
  useEffect(() => {
    if (state.status === "success") toast(state.message);
  }, [state]);
}

export function InquiryActions({ id, customerLabel, archived, resolved }: Props) {
  const [archiveState, archiveAction] = useActionState(setArchivedAction, initial);
  const [reopenState, reopen] = useActionState(reopenAction, initial);
  const [deleteState, remove] = useActionState(deleteInquiryAction, initial);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useToastOnSuccess(archiveState);
  useToastOnSuccess(reopenState);

  const error = [archiveState, reopenState].find((s) => s.status === "error");

  return (
    <section aria-labelledby="mas-acciones" className="space-y-3">
      <h2 id="mas-acciones" className="text-lg font-semibold">
        Más acciones
      </h2>
      {error && error.status === "error" ? <Notice tone="error">{error.message}</Notice> : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {resolved || archived ? (
          <form action={reopen}>
            <input type="hidden" name="id" value={id} />
            <SubmitButton variant="secondary" full pendingLabel="Reabriendo…">
              <RotateCcw aria-hidden className="size-5" />
              Reabrir consulta
            </SubmitButton>
          </form>
        ) : null}

        <form action={archiveAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="archived" value={archived ? "false" : "true"} />
          <SubmitButton variant="secondary" full pendingLabel={archived ? "Recuperando…" : "Archivando…"}>
            {archived ? <ArchiveRestore aria-hidden className="size-5" /> : <Archive aria-hidden className="size-5" />}
            {archived ? "Sacar del archivo" : "Archivar"}
          </SubmitButton>
        </form>

        <Button variant="ghost" className="text-terracota" onClick={() => setConfirmOpen(true)}>
          <Trash2 aria-hidden className="size-5" />
          Eliminar
        </Button>
      </div>

      <p className="text-sm text-chocolate-suave">
        Archivar la quita de tus listas sin borrarla. Eliminar la borra para siempre.
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
          {deleteState.status === "error" ? <Notice tone="error">{deleteState.message}</Notice> : null}
          <SubmitButton variant="danger" full pendingLabel="Eliminando…">
            Sí, eliminar
          </SubmitButton>
          <Button variant="secondary" full onClick={() => setConfirmOpen(false)}>
            No, mantenerla
          </Button>
        </form>
      </Dialog>
    </section>
  );
}
