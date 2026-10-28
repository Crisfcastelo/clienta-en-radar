"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Fase 2: solo interfaz, no envía emails. En fase 3 cada paso llamará a una
 * Server Action con Supabase Auth (signInWithOtp y verifyOtp de tipo email).
 */
export function SignInForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    if (!EMAIL.test(value)) {
      setError("Escribe un email válido, por ejemplo nombre@gmail.com.");
      return;
    }
    setError(null);
    setEmail(value);
    setStep("code");
  }

  function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("code") ?? "").replace(/\s/g, "");
    if (!/^\d{6}$/.test(value)) {
      setError("El código tiene 6 números. Revisa el email que te hemos enviado.");
      return;
    }
    setError(null);
    router.push("/hoy");
  }

  if (step === "email") {
    return (
      <form onSubmit={submitEmail} noValidate className="space-y-5">
        <Field id="email" label="Tu email" hint="El mismo que usaste al comprar." error={error ?? undefined}>
          {(aria) => (
            <TextInput
              {...aria}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              defaultValue={email}
            />
          )}
        </Field>
        <Button type="submit" size="lg" full>
          Enviarme un código
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={submitCode} noValidate className="space-y-5">
      <Notice tone="info">
        Te hemos enviado un código de 6 números a <strong className="break-all">{email}</strong>. Puede tardar un
        minuto; mira también en spam.
      </Notice>
      <Field id="code" label="Código" error={error ?? undefined}>
        {(aria) => (
          <TextInput
            {...aria}
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            className="text-center text-2xl tracking-[0.4em]"
          />
        )}
      </Field>
      <Button type="submit" size="lg" full>
        Entrar
      </Button>
      <Button
        variant="ghost"
        full
        onClick={() => {
          setError(null);
          setStep("email");
        }}
      >
        Usar otro email
      </Button>
    </form>
  );
}
