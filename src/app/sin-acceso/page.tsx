import type { Metadata } from "next";
import { BrandName } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signOutAction } from "@/features/account/actions";

export const metadata: Metadata = { title: "Sin acceso" };

/** Cuenta con sesión iniciada pero sin compra asociada a su email. */
export default function NoAccessPage() {
  return (
    <main className="pt-safe mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-4 py-10">
      <BrandName />
      <Card className="space-y-4 p-6">
        <h1 className="text-2xl font-semibold">Este email todavía no tiene acceso</h1>
        <p>No encontramos ninguna compra de Clienta en Radar con el email con el que has entrado.</p>
        <ul className="list-disc space-y-1 pl-5 text-chocolate-suave">
          <li>Si pagaste con otro email, sal y entra con ese.</li>
          <li>Si acabas de pagar, espera un par de minutos y vuelve a entrar.</li>
          <li>Si crees que es un error, responde al email de confirmación de tu compra y lo revisamos.</li>
        </ul>
        <form action={signOutAction}>
          <Button type="submit" variant="secondary" full>
            Entrar con otro email
          </Button>
        </form>
      </Card>
    </main>
  );
}
