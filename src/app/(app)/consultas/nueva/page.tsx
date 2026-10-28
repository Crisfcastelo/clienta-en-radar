import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/features/account/session";
import { createInquiryAction } from "@/features/inquiries/actions";
import { InquiryForm } from "@/features/inquiries/components/inquiry-form";
import { todayIn } from "@/lib/dates";

export const metadata: Metadata = { title: "Añadir consulta" };

export default async function NewInquiryPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="¿Quién te ha escrito?"
        back={{ href: "/hoy", label: "Hoy" }}
        intro="Guarda lo imprescindible. Lo demás puede esperar."
      />
      <Card className="p-5 sm:p-6">
        <InquiryForm
          mode="create"
          initialId={crypto.randomUUID()}
          today={todayIn(user.timezone)}
          action={createInquiryAction}
          afterSave={
            <>
              Puedes añadir otra o{" "}
              <Link href="/hoy" className="font-semibold underline underline-offset-4">
                volver a tus pendientes
              </Link>
              .
            </>
          }
        />
      </Card>
    </div>
  );
}
