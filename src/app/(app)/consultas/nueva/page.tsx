import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/features/account/session";
import { createInquiryAction } from "@/features/inquiries/actions";
import { InquiryForm } from "@/features/inquiries/components/inquiry-form";
import { todayIn } from "@/lib/dates";

export const metadata: Metadata = { title: "Nueva consulta" };

export default async function NewInquiryPage() {
  const user = await requireUser();
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Nueva consulta"
        back={{ href: "/hoy", label: "Hoy" }}
        intro="Solo necesitas un nombre y una frase. El resto es opcional."
      />
      <Card className="p-5 sm:p-6">
        <InquiryForm
          mode="create"
          initialId={crypto.randomUUID()}
          today={todayIn(user.timezone)}
          action={createInquiryAction}
        />
      </Card>
    </div>
  );
}
