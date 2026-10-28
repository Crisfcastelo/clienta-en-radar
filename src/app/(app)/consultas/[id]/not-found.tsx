import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function InquiryNotFound() {
  return (
    <Card className="mx-auto max-w-xl space-y-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">No encontramos esta consulta</h1>
      <p className="text-chocolate-suave">Puede que la hayas eliminado o que el enlace no sea correcto.</p>
      <ButtonLink href="/consultas">Ver mis consultas</ButtonLink>
    </Card>
  );
}
