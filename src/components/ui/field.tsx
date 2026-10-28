import { CircleAlert } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

export const inputClasses =
  "block w-full rounded-2xl border border-borde-campo bg-superficie px-4 py-3 text-chocolate " +
  "placeholder:text-chocolate-suave/80 aria-[invalid=true]:border-terracota aria-[invalid=true]:border-2";

interface FieldProps {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: (aria: { id: string; "aria-describedby"?: string; "aria-invalid"?: true }) => ReactNode;
}

/** Etiqueta, ayuda y error conectados al campo para lectores de pantalla. */
export function Field({ id, label, hint, error, optional, children }: FieldProps) {
  const hintId = hint ? `${id}-ayuda` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block font-semibold">
        {label}
        {optional ? <span className="font-normal text-chocolate-suave"> (opcional)</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className="text-sm text-chocolate-suave">
          {hint}
        </p>
      ) : null}
      {children({ id, "aria-describedby": describedBy, ...(error ? { "aria-invalid": true as const } : {}) })}
      {error ? <FieldError id={errorId!}>{error}</FieldError> : null}
    </div>
  );
}

export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-sm font-semibold text-terracota">
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function TextInput({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`${inputClasses} ${className}`} {...props} />;
}

export function TextArea({ className = "", ...props }: ComponentProps<"textarea">) {
  return <textarea className={`${inputClasses} min-h-28 resize-y ${className}`} {...props} />;
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return <select className={`${inputClasses} appearance-auto ${className}`} {...props} />;
}
