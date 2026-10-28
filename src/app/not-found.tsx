import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-semibold">Esta página no existe</h1>
      <p className="text-chocolate-suave">Puede que el enlace esté mal escrito o que ya no esté disponible.</p>
      <ButtonLink href="/hoy">Ir a Hoy</ButtonLink>
    </main>
  );
}
