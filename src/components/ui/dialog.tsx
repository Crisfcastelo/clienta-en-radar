"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import type { ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}

/**
 * Diálogo modal con <dialog> nativo: bloquea el fondo, atrapa el foco,
 * cierra con Escape y devuelve el foco al botón que lo abrió.
 * En móvil se muestra como hoja inferior.
 */
export function Dialog({ open, onClose, title, description, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onClick={(event) => {
        // Clic en el fondo (fuera del contenido) cierra el diálogo.
        if (event.target === ref.current) onClose();
      }}
      className={
        "m-0 mt-auto max-h-[90dvh] w-full max-w-none rounded-t-[1.75rem] bg-superficie p-0 text-chocolate " +
        "sm:m-auto sm:max-w-lg sm:rounded-[1.75rem]"
      }
    >
      <div className="pb-safe">
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div className="space-y-1">
            <h2 id={titleId} className="text-xl font-semibold">
              {title}
            </h2>
            {description ? (
              <div id={descriptionId} className="text-chocolate-suave">
                {description}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 -mt-1 inline-flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-neutro"
          >
            <X aria-hidden className="size-6" />
            <span className="sr-only">Cerrar</span>
          </button>
        </div>
        <div className="px-6 pb-6 pt-4">{children}</div>
      </div>
    </dialog>
  );
}
