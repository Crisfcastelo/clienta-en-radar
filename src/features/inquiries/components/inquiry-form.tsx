"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Field, FieldError, Select, TextArea, TextInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { toast } from "@/components/toaster";
import { newId } from "@/lib/ids";
import type { FormState } from "../actions";
import { ListTodo, MessageCircle, UserRound } from "lucide-react";
import { NEXT_ACTION_SUGGESTIONS, STATUS_LABELS } from "../domain/labels";
import { INQUIRY_STATUSES } from "../domain/types";
import type { Inquiry } from "../domain/types";
import { LIMITS } from "../schema";
import { ChannelPicker } from "./channel-picker";
import { FollowUpInput } from "./follow-up-input";

type Props = {
  today: string;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  /** Qué ofrecer después de guardar una nueva (por defecto, nada: el formulario queda listo para otra). */
  afterSave?: ReactNode;
} & (
  { mode: "create"; initialId: string; inquiry?: undefined } | { mode: "edit"; inquiry: Inquiry; initialId?: undefined }
);

const initial: FormState = { status: "idle" };

const FIELD_ORDER = ["channel", "customerLabel", "summary", "status", "nextAction", "followUpOn", "notes"] as const;

export function InquiryForm(props: Props) {
  const { mode, today, action, afterSave } = props;
  const [formId, setFormId] = useState(props.mode === "create" ? props.initialId : props.inquiry.id);
  const [summaryLength, setSummaryLength] = useState(props.inquiry?.summary.length ?? 0);
  const [state, formAction] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await action(prev, formData);
    if (result.status === "success") {
      // Al crear, la confirmación va en el propio formulario; al editar, en un aviso flotante.
      if (mode === "edit") toast(result.message);
      if (mode === "create") {
        // Nuevo id para la siguiente consulta: un segundo envío del mismo formulario no duplica.
        setFormId(newId());
        setSummaryLength(0);
      }
    }
    return result;
  }, initial);
  const formRef = useRef<HTMLFormElement>(null);

  const errors = state.status === "error" ? state.fieldErrors : {};
  const echoed = state.status === "error" ? state.values : null;
  const value = (key: string, fallback: string | null | undefined) => echoed?.[key] ?? fallback ?? "";

  useEffect(() => {
    if (state.status === "error") {
      // Lleva el foco al primer campo con error para que no haya que buscarlo.
      const firstKey = FIELD_ORDER.find((key) => state.fieldErrors[key]);
      const target = firstKey ? formRef.current?.querySelector<HTMLElement>(`[name="${firstKey}"]`) : null;
      target?.focus();
    }
  }, [state]);

  useEffect(() => {
    // Tras guardar, el formulario se vacía y el foco vuelve al primer campo para añadir otra.
    if (mode === "create" && formId !== props.initialId) {
      formRef.current?.querySelector<HTMLElement>('[name="customerLabel"]')?.focus();
    }
  }, [formId, mode, props.initialId]);

  const isEdit = mode === "edit";
  const inquiry = props.inquiry;

  return (
    <form ref={formRef} action={formAction} noValidate className="space-y-6" key={isEdit ? undefined : formId}>
      {state.status === "error" ? <Notice tone="error">{state.message}</Notice> : null}
      {state.status === "success" && mode === "create" ? (
        <Notice tone="success">
          {state.message}
          {afterSave ? <div className="mt-1 font-normal">{afterSave}</div> : null}
        </Notice>
      ) : null}

      {mode === "create" ? <input type="hidden" name="id" value={formId} /> : null}

      <div className="space-y-2">
        <ChannelPicker
          defaultValue={value("channel", inquiry?.channel)}
          error={errors.channel}
          errorId="channel-error"
        />
        {errors.channel ? <FieldError id="channel-error">{errors.channel}</FieldError> : null}
      </div>

      <Field
        id="customerLabel"
        label="Nombre o referencia"
        optional
        hint="Como tú la reconozcas. Si lo dejas vacío, aparecerá como «Sin nombre»."
        error={errors.customerLabel}
      >
        {(aria) => (
          <IconInput icon={<UserRound aria-hidden className="size-5" />}>
            <TextInput
              {...aria}
              name="customerLabel"
              autoComplete="off"
              maxLength={LIMITS.customerLabel}
              placeholder="Nombre o iniciales"
              defaultValue={value("customerLabel", inquiry?.customerLabel)}
              className="pl-11"
            />
          </IconInput>
        )}
      </Field>

      <Field id="summary" label="Qué necesita" hint={`${summaryLength}/${LIMITS.summary}`} error={errors.summary}>
        {(aria) => (
          <IconInput icon={<MessageCircle aria-hidden className="size-5" />} top>
            <TextArea
              {...aria}
              name="summary"
              rows={3}
              maxLength={LIMITS.summary}
              defaultValue={value("summary", inquiry?.summary)}
              onChange={(event) => setSummaryLength(event.target.value.length)}
              className="pl-11"
            />
          </IconInput>
        )}
      </Field>

      <Field id="status" label="Estado" error={errors.status}>
        {(aria) => (
          <Select {...aria} name="status" defaultValue={value("status", inquiry?.status ?? "por_responder")}>
            {INQUIRY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field id="nextAction" label="Próxima acción" optional error={errors.nextAction}>
        {(aria) => <NextActionInput {...aria} defaultValue={value("nextAction", inquiry?.nextAction)} />}
      </Field>

      <Field
        id="followUpOn"
        label="Próxima revisión"
        optional
        hint="Ese día aparecerá en Para revisar."
        error={errors.followUpOn}
      >
        {(aria) => (
          <FollowUpInput
            id={aria.id}
            name="followUpOn"
            today={today}
            defaultValue={value("followUpOn", inquiry?.followUpOn)}
            describedBy={aria["aria-describedby"]}
            invalid={Boolean(aria["aria-invalid"])}
          />
        )}
      </Field>

      <details
        className="group rounded-2xl border border-borde bg-superficie/60 px-4 py-3"
        open={Boolean(inquiry?.notes || echoed?.notes || errors.notes)}
      >
        <summary className="min-h-8 cursor-pointer font-semibold">Notas privadas (opcional)</summary>
        <div className="mt-3">
          <Field
            id="notes"
            label="Notas"
            hint="Solo para ti. Evita apuntar teléfonos, direcciones o datos de salud."
            error={errors.notes}
          >
            {(aria) => (
              <TextArea
                {...aria}
                name="notes"
                rows={4}
                maxLength={LIMITS.notes}
                defaultValue={value("notes", inquiry?.notes)}
              />
            )}
          </Field>
        </div>
      </details>

      <div className="flex flex-col gap-3 sm:flex-row">
        <SubmitButton size="lg" full>
          {isEdit ? "Guardar cambios" : "Guardar consulta"}
        </SubmitButton>
      </div>
    </form>
  );
}

/** Campo con icono decorativo a la izquierda, como en el diseño. */
function IconInput({ icon, top = false, children }: { icon: ReactNode; top?: boolean; children: ReactNode }) {
  return (
    <div className="relative">
      <span
        className={`pointer-events-none absolute left-4 text-chocolate-suave ${top ? "top-3.5" : "top-1/2 -translate-y-1/2"}`}
      >
        {icon}
      </span>
      {children}
    </div>
  );
}

/** Texto libre con atajos de un toque que rellenan el campo. */
function NextActionInput({
  defaultValue,
  ...aria
}: {
  id: string;
  defaultValue: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <IconInput icon={<ListTodo aria-hidden className="size-5" />}>
        <TextInput
          {...aria}
          ref={ref}
          name="nextAction"
          autoComplete="off"
          maxLength={LIMITS.nextAction}
          placeholder="Ej. Enviar presupuesto"
          defaultValue={defaultValue}
          className="pl-11"
        />
      </IconInput>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Atajos de próxima acción">
        {NEXT_ACTION_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => {
              if (ref.current) {
                ref.current.value = suggestion;
                ref.current.focus();
              }
            }}
            className="min-h-10 rounded-full border border-borde-campo bg-superficie px-3 text-sm font-semibold hover:bg-neutro"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
