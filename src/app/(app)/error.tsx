"use client";

import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Nunca mostramos el mensaje técnico: puede contener detalles internos.
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card role="alert" className="mx-auto max-w-xl space-y-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Algo no ha ido bien</h1>
      <p className="text-chocolate-suave">
        No hemos podido cargar esta pantalla. Tus consultas están a salvo. Prueba de nuevo en unos segundos.
      </p>
      <div className="flex flex-col justify-center gap-2 sm:flex-row">
        <Button onClick={reset}>Reintentar</Button>
        <ButtonLink href="/hoy" variant="secondary">
          Ir a Hoy
        </ButtonLink>
      </div>
    </Card>
  );
}
