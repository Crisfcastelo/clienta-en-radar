import { CalendarClock, CircleAlert, Inbox, PencilLine } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/features/account/session";
import { updateInquiryAction } from "@/features/inquiries/actions";
import { ChannelTag } from "@/features/inquiries/components/channel-tag";
import { InquiryActions } from "@/features/inquiries/components/inquiry-actions";
import { InquiryForm } from "@/features/inquiries/components/inquiry-form";
import { StatusBadge } from "@/features/inquiries/components/status-badge";
import { inquiries } from "@/features/inquiries/data";
import { MESSAGES } from "@/features/inquiries/domain/labels";
import { followUpState } from "@/features/inquiries/domain/priority";
import { idSchema } from "@/features/inquiries/schema";
import { formatDateTime, formatFollowUp, todayIn } from "@/lib/dates";

export const metadata: Metadata = { title: "Consulta" };

export default async function InquiryDetailPage({ params }: PageProps<"/consultas/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  if (!idSchema.safeParse({ id }).success) notFound();

  const inquiry = await inquiries().get(id);
  if (!inquiry) notFound();

  const today = todayIn(user.timezone);
  const overdue = followUpState(inquiry, today) === "overdue";
  const action = updateInquiryAction.bind(null, inquiry.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={inquiry.customerLabel} back={{ href: "/consultas", label: "Consultas" }} />

      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={inquiry.status} />
          <ChannelTag channel={inquiry.channel} />
          {inquiry.archivedAt ? (
            <span className="rounded-full bg-neutro px-3 py-1 text-sm font-semibold">Archivada</span>
          ) : null}
        </div>

        {overdue ? (
          <p className="flex items-start gap-2 font-semibold text-terracota">
            <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
            {MESSAGES.overdue}
          </p>
        ) : null}

        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-dorado-claro p-3">
            <dt className="flex items-center gap-1.5 text-sm font-semibold">
              <CalendarClock aria-hidden className="size-4" />
              Revisar
            </dt>
            <dd className="text-lg">{inquiry.followUpOn ? formatFollowUp(inquiry.followUpOn, today) : "Sin fecha"}</dd>
          </div>
          <div className="rounded-2xl bg-neutro p-3">
            <dt className="flex items-center gap-1.5 text-sm font-semibold">
              <Inbox aria-hidden className="size-4" />
              Recibida
            </dt>
            <dd className="text-lg">{formatDateTime(inquiry.createdAt, user.timezone)}</dd>
          </div>
        </dl>
        <p className="flex items-center gap-1.5 text-sm text-chocolate-suave">
          <PencilLine aria-hidden className="size-4" />
          Última modificación: {formatDateTime(inquiry.updatedAt, user.timezone)}
        </p>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="mb-4 text-xl font-semibold">Editar</h2>
        <InquiryForm mode="edit" inquiry={inquiry} today={today} action={action} />
      </Card>

      <InquiryActions
        id={inquiry.id}
        customerLabel={inquiry.customerLabel}
        archived={inquiry.archivedAt !== null}
        resolved={inquiry.status === "resuelta"}
      />
    </div>
  );
}
