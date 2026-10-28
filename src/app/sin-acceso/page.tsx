import { Download } from "lucide-react";
import type { Metadata } from "next";
import { BrandName } from "@/components/brand";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireSession } from "@/features/account/session";
import { signOutAction } from "@/features/auth/actions";
import { inquiries } from "@/features/inquiries/data";

export const metadata: Metadata = { title: "Sin acceso" };

/**
 * Cuenta con sesión pero sin compra asociada a su email. Si tenía datos (por ejemplo,
 * tras un reembolso), puede seguir descargándolos: son suyos.
 */
export default async function NoAccessPage() {
  const session = await requireSession();
  const hasData = (await inquiries().list()).length > 0;

  return (
    <main className="pt-safe mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-4 py-10">
      <BrandName />
      <Card className="space-y-4 p-6">
        <h1 className="text-2xl">Este email todavía no tiene acceso</h1>
        <p>
          No encontramos ninguna compra de Clienta en Radar con <strong className="break-all">{session.email}</strong>.
        </p>
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

      {hasData ? (
        <Card className="space-y-3 p-6">
          <h2 className="text-xl">Tus datos siguen siendo tuyos</h2>
          <p className="text-chocolate-suave">Puedes descargar las consultas que guardaste.</p>
          <a href="/api/exportar?formato=csv" download className={buttonClasses({ variant: "secondary", full: true })}>
            <Download aria-hidden className="size-5" />
            Descargar para Excel (CSV)
          </a>
        </Card>
      ) : null}
    </main>
  );
}
