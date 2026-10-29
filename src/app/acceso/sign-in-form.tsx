"use client";

import { useActionState } from "react";
import { Field, TextInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { SubmitButton } from "@/components/ui/submit-button";
import { requestCodeAction, verifyCodeAction } from "@/features/auth/actions";
import type { SignInState } from "@/features/auth/actions";

const initial: SignInState = { step: "email" };

/** Acceso en dos pasos: email y código de 6 cifras. Sin contraseñas que recordar. */
export function SignInForm() {
  const [state, action] = useActionState(async (prev: SignInState, formData: FormData): Promise<SignInState> => {
    const intent = formData.get("intent");
    if (intent === "cambiar") return { step: "email", email: prev.step === "code" ? prev.email : undefined };
    if (intent === "verificar") return verifyCodeAction(prev, formData);
    return requestCodeAction(prev, formData);
  }, initial);

  if (state.step === "email") {
    return (
      <form action={action} noValidate className="space-y-5">
        <input type="hidden" name="intent" value="pedir" />
        <Field id="email" label="Tu email" hint="El mismo que usaste al comprar." error={state.error}>
          {(aria) => (
            <TextInput
              {...aria}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              defaultValue={state.email ?? ""}
            />
          )}
        </Field>
        <SubmitButton size="lg" full pendingLabel="Enviando…">
          Enviarme un código
        </SubmitButton>
      </form>
    );
  }

  return (
    <div className="space-y-5">
      <Notice tone="info">
        Si <strong className="break-all">{state.email}</strong> tiene acceso,{" "}
        {state.resent ? "te hemos enviado un código nuevo" : "te hemos enviado un código de 6 números"}. Puede tardar un
        minuto; mira también en spam.
      </Notice>
      <form action={action} noValidate className="space-y-5">
        <input type="hidden" name="intent" value="verificar" />
        <input type="hidden" name="email" value={state.email} />
        <Field id="code" label="Código" error={state.error}>
          {(aria) => (
            <TextInput
              {...aria}
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={7}
              autoFocus
              className="text-center text-2xl tracking-[0.4em]"
            />
          )}
        </Field>
        <SubmitButton size="lg" full pendingLabel="Comprobando…">
          Entrar
        </SubmitButton>
      </form>
      <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
        <form action={action}>
          <input type="hidden" name="intent" value="pedir" />
          <input type="hidden" name="reenviar" value="1" />
          <input type="hidden" name="email" value={state.email} />
          <SubmitButton variant="ghost" full pendingLabel="Enviando…">
            Enviarme otro código
          </SubmitButton>
        </form>
        <form action={action}>
          <input type="hidden" name="intent" value="cambiar" />
          <SubmitButton variant="ghost" full pendingLabel="…">
            Usar otro email
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
