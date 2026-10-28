import type { Metadata } from "next";
import { BrandName } from "@/components/brand";
import { Card } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { getSession } from "@/features/account/session";
import { isDemoMode } from "@/lib/env";
import { MESSAGES } from "@/features/inquiries/domain/labels";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function SignInPage() {
  // Con sesión abierta no tiene sentido volver a pedir el código.
  if (!isDemoMode() && (await getSession())) redirect("/hoy");

  return (
    <main className="pt-safe mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-4 py-10">
      <div className="space-y-3">
        <BrandName />
        <p className="font-display text-xl">{MESSAGES.tagline}</p>
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl">Entra en tu cuenta</h1>
        <p className="text-chocolate-suave">Sin contraseñas: te enviamos un código a tu email cada vez que entras.</p>
      </div>
      <Card className="p-5 sm:p-6">
        <SignInForm />
      </Card>
      {isDemoMode() ? (
        <p className="rounded-2xl bg-dorado-claro px-4 py-3 text-sm">
          Versión de prueba: no se envía ningún email. Escribe cualquier email y cualquier código de 6 números.
        </p>
      ) : null}
    </main>
  );
}
