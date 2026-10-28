import { CalendarClock, CircleAlert, Inbox } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { formatFollowUp, formatReceived } from "@/lib/dates";
import { MESSAGES } from "../domain/labels";
import { followUpState } from "../domain/priority";
import type { Inquiry, IsoDate } from "../domain/types";
import { ChannelTag } from "./channel-tag";
import { QuickActions } from "./quick-actions";
import { StatusBadge } from "./status-badge";

interface Props {
  inquiry: Inquiry;
  today: IsoDate;
  timeZone: string;
  headingLevel?: "h2" | "h3";
}

/**
 * Tarjeta compacta. Toda la tarjeta enlaza al detalle ("Ver detalle", con un enlace
 * estirado) y las acciones rápidas quedan por encima para poder pulsarlas aparte.
 */
export function InquiryCard({ inquiry, today, timeZone, headingLevel: Heading = "h3" }: Props) {
  const state = followUpState(inquiry, today);
  const overdue = state === "overdue";

  return (
    <Card
      className={`relative p-4 focus-within:ring-3 focus-within:ring-oliva ${overdue ? "border-terracota/50" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <Heading className="min-w-0 flex-1 font-sans text-lg font-bold">
          <Link
            href={`/consultas/${inquiry.id}`}
            className="break-words outline-none after:absolute after:inset-0 after:rounded-(--radius-tarjeta) after:content-['']"
          >
            {inquiry.customerLabel}
          </Link>
        </Heading>
        <StatusBadge status={inquiry.status} />
      </div>

      <p className="mt-1 line-clamp-2 text-chocolate-suave">{inquiry.summary}</p>

      {overdue ? (
        <p className="mt-3 flex items-start gap-1.5 font-semibold text-terracota">
          <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0" />
          <span>
            {MESSAGES.overdue}{" "}
            <span className="font-normal">(revisar {formatFollowUp(inquiry.followUpOn!, today)})</span>
          </span>
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {inquiry.followUpOn && !overdue && state !== "none" ? (
          <span className="inline-flex items-center gap-1 font-semibold">
            <CalendarClock aria-hidden className="size-4" />
            Revisar {formatFollowUp(inquiry.followUpOn, today)}
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1 text-chocolate-suave">
          <Inbox aria-hidden className="size-4" />
          Recibida {formatReceived(inquiry.createdAt, timeZone)}
        </span>
        <ChannelTag channel={inquiry.channel} />
      </div>

      <div className="mt-3">
        <QuickActions id={inquiry.id} customerLabel={inquiry.customerLabel} status={inquiry.status} today={today} />
      </div>
    </Card>
  );
}
