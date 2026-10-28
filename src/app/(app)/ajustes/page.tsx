import { Download, LogOut } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { resetDemoDataAction, signOutAction } from "@/features/account/actions";
import { DEMO_MODE } from "@/features/account/demo-profile";
import { requireUser } from "@/features/account/session";

export const metadata: Metadata = { title: "Ajustes" };

const RETENTION_LABELS: Record<string, string> = {
  "90": "3 meses",
  "180": "6 meses",
  "365": "12 meses",
  "730": "24 meses",
  never: "No borrar nunca",
};

export default async function SettingsPage() {
  const user = await requireUser();
  const retention = user.retentionDays ? String(user.retentionDays) : "never";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Ajustes" />

      <Card className="space-y-2 p-5">
        <h2 className="text-xl font-semibold">Tu cuenta</h2>
        <dl className="space-y-1">
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-semibold">Nombre:</dt>
            <dd>{user.displayName ?? "Sin indicar"}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-semibold">Negocio:</dt>
            <dd>{user.businessName ?? "Sin indicar"}</dd>
          </div>
          <div className="flex flex-wrap gap-x-2">
            <dt className="font-semibold">Email:</dt>
            <dd className="break-all">{user.email}</dd>
          </div>
        </dl>
        <p className="text-sm text-chocolate-suave">Podrás editar estos datos cuando conectemos las cuentas.</p>
      </Card>

      <Card className="space-y-3 p-5">
        <h2 className="text-xl font-semibold">Tus datos</h2>
        <p>Descarga todas tus consultas cuando quieras. Son tuyas.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <a href="/api/exportar?formato=csv" download className={buttonClasses({ variant: "secondary" })}>
            <Download aria-hidden className="size-5" />
            Descargar para Excel (CSV)
          </a>
          <a href="/api/exportar?formato=json" download className={buttonClasses({ variant: "secondary" })}>
            <Download aria-hidden className="size-5" />
            Descargar copia completa (JSON)
          </a>
        </div>
        <p className="text-sm text-chocolate-suave">
          Borrado automático de consultas resueltas o archivadas: <strong>{RETENTION_LABELS[retention]}</strong>. Lo
          podrás cambiar cuando conectemos las cuentas.
        </p>
      </Card>

      <Card className="space-y-3 p-5">
        <h2 className="text-xl font-semibold">Sesión</h2>
        <form action={signOutAction}>
          <Button type="submit" variant="secondary">
            <LogOut aria-hidden className="size-5" />
            Cerrar sesión
          </Button>
        </form>
        <p className="text-sm text-chocolate-suave">
          Eliminar la cuenta y todos sus datos estará disponible aquí cuando conectemos las cuentas.
        </p>
      </Card>

      {DEMO_MODE ? (
        <Card className="space-y-3 border-dashed border-dorado p-5">
          <h2 className="text-xl font-semibold">Solo en la versión de prueba</h2>
          <p>Para revisar cómo se ve la app en distintos momentos.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <form action={resetDemoDataAction}>
              <input type="hidden" name="mode" value="ejemplo" />
              <Button type="submit" variant="secondary" full>
                Restaurar datos de ejemplo
              </Button>
            </form>
            <form action={resetDemoDataAction}>
              <input type="hidden" name="mode" value="vacio" />
              <Button type="submit" variant="secondary" full>
                Ver como cuenta nueva
              </Button>
            </form>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
