"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "./button";
import type { ComponentProps } from "react";

type Props = Omit<ComponentProps<typeof Button>, "type"> & { pendingLabel?: string };

/** Botón de envío que se bloquea mientras se guarda, para evitar dobles envíos. */
export function SubmitButton({ children, pendingLabel = "Guardando…", disabled, ...props }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled} aria-disabled={pending || disabled} {...props}>
      {pending ? (
        <>
          <LoaderCircle aria-hidden className="size-5 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
