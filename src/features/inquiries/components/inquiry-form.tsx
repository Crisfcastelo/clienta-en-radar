"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { ChoiceChips } from "@/components/ui/choice-chips";
import { Field, FieldError, TextArea, TextInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { toast } from "@/components/toaster";
import { newId } from "@/lib/ids";
import type { FormState } from "../actions";
import { CHANNEL_LABELS, STATUS_LABELS } from "../domain/labels";
import { INQUIRY_CHANNELS, INQUIRY_STATUSES } from "../domain/types";
import type { Inquiry } from "../domain/types";
import { LIMITS } from "../schema";
import { CHANNEL_ICONS } from "./channel-tag";
import { STATUS_ICONS } from "./status-badge";
import { FollowUpInput } from "./follow-up-input";

type Props = {
  today: string;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
} & (
  { mode: "create"; initialId: string; inquiry?: undefined } | { mode: "edit"; inquiry: Inquiry; initialId?: undefined }
);

const initial: FormState = { status: "idle" };

const FIELD_ORDER = ["customerLabel", "summary", "channel", "followUpOn", "notes", "status"] as const;

export function InquiryForm(props: Props) {
  const { mode, today, action } = props;
  const [formId, setFormId] = useState(props.mode === "create" ? props.initialId : props.inquiry.id);
  const [summaryLength, setSummaryLength] = useState(props.inquiry?.summary.length ?? 0);
  const [state, formAction] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await action(prev, formData);
    if (result.status === "success") {
      toast(result.message);
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
          {state.message} ¿Añades otra? Si no,{" "}
          <Link href="/hoy" className="underline underline-offset-4">
            vuelve a Hoy
          </Link>
          .
        </Notice>
      ) : null}

      {mode === "create" ? <input type="hidden" name="id" value={formId} /> : null}

      <Field
        id="customerLabel"
        label="Nombre o referencia"
        hint="Como tú la reconozcas: «Lucía (boda)», «Tienda Alacena»…"
        error={errors.customerLabel}
      >
        {(aria) => (
          <TextInput
            {...aria}
            name="customerLabel"
            autoComplete="off"
            maxLength={LIMITS.customerLabel}
            defaultValue={value("customerLabel", inquiry?.customerLabel)}
          />
        )}
      </Field>

      <Field
        id="summary"
        label="¿Qué te ha preguntado?"
        hint={`Una frase basta. ${summaryLength}/${LIMITS.summary}`}
        error={errors.summary}
      >
        {(aria) => (
          <TextArea
            {...aria}
            name="summary"
            rows={3}
            maxLength={LIMITS.summary}
            defaultValue={value("summary", inquiry?.summary)}
            onChange={(event) => setSummaryLength(event.target.value.length)}
          />
        )}
      </Field>

      <div className="space-y-2">
        <ChoiceChips
          name="channel"
          legend="¿Por dónde te escribió?"
          optional
          defaultValue={value("channel", inquiry?.channel)}
          error={errors.channel}
          errorId="channel-error"
          options={INQUIRY_CHANNELS.map((channel) => {
            const Icon = CHANNEL_ICONS[channel];
            return { value: channel, label: CHANNEL_LABELS[channel], icon: <Icon aria-hidden className="size-4" /> };
          })}
        />
        {errors.channel ? <FieldError id="channel-error">{errors.channel}</FieldError> : null}
      </div>

      {isEdit ? (
        <div className="space-y-2">
          <ChoiceChips
            name="status"
            legend="Estado"
            defaultValue={value("status", inquiry?.status)}
            error={errors.status}
            errorId="status-error"
            options={INQUIRY_STATUSES.map((status) => {
              const Icon = STATUS_ICONS[status];
              return { value: status, label: STATUS_LABELS[status], icon: <Icon aria-hidden className="size-4" /> };
            })}
          />
          {errors.status ? <FieldError id="status-error">{errors.status}</FieldError> : null}
        </div>
      ) : (
        <p className="rounded-2xl bg-dorado-claro px-4 py-3 text-sm">
          Se guardará como <strong>Por responder</strong>. Podrás cambiarlo cuando contestes.
        </p>
      )}

      <Field
        id="followUpOn"
        label="¿Cuándo quieres revisarla?"
        optional
        hint="Te la recordaremos en Hoy a partir de ese día."
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
