import { CalendarClock, ChevronRight, CircleAlert } from "lucide-react";
import Link from "next/link";
import { formatFollowUp, formatReceived, formatReceivedShort } from "@/lib/dates";
import { MESSAGES } from "../domain/labels";
import { followUpState } from "../domain/priority";
import type { Inquiry, IsoDate } from "../domain/types";
import { ChannelAvatar } from "./channel-tag";
import { QuickActions } from "./quick-actions";
import { StatusBadge } from "./status-badge";

interface Props {
  inquiry: Inquiry;
  today: IsoDate;
  timeZone: string;
  headingLevel?: "h2" | "h3";
}

/**
 * Fila de consulta. Toda la fila enlaza al detalle ("Ver detalle", con un enlace
 * estirado) y las acciones rápidas quedan por encima para poder pulsarlas aparte.
 * El punto de color solo marca revisiones vencidas, nunca "mensajes nuevos":
 * la app no lee WhatsApp ni Instagram.
 */
export function InquiryCard({ inquiry, today, timeZone, headingLevel: Heading = "h3" }: Props) {
  const state = followUpState(inquiry, today);
  const overdue = state === "overdue";

  return (
    <article
      className={
        "relative rounded-(--radius-tarjeta) border bg-superficie/90 p-4 shadow-(--shadow-suave) " +
        "focus-within:ring-3 focus-within:ring-bosque " +
        (overdue ? "border-terracota/40" : "border-white/80")
      }
    >
      {overdue ? <span aria-hidden className="absolute top-6 left-1.5 size-2 rounded-full bg-terracota" /> : null}

      <div className="flex gap-3">
        <ChannelAvatar channel={inquiry.channel} />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <Heading className="min-w-0 font-sans text-base leading-snug font-bold">
              <Link
                href={`/consultas/${inquiry.id}`}
                className="break-words outline-none after:absolute after:inset-0 after:rounded-(--radius-tarjeta) after:content-['']"
              >
                {inquiry.customerLabel}
              </Link>
            </Heading>
            <time
              dateTime={inquiry.createdAt}
              title={`Recibida ${formatReceived(inquiry.createdAt, timeZone)}`}
              className="shrink-0 text-sm text-chocolate-suave"
            >
              <span className="sr-only">Recibida: </span>
              {formatReceivedShort(inquiry.createdAt, timeZone)}
            </time>
          </div>

          <p className="mt-0.5 line-clamp-2 text-chocolate-suave">{inquiry.summary}</p>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <StatusBadge status={inquiry.status} />
            {inquiry.followUpOn && state !== "none" && !overdue ? (
              <span className="inline-flex items-center gap-1 text-sm font-semibold">
                <CalendarClock aria-hidden className="size-4" />
                Revisar {formatFollowUp(inquiry.followUpOn, today)}
              </span>
            ) : null}
          </div>

          {overdue ? (
            <p className="mt-2 flex items-start gap-1.5 text-sm font-semibold text-terracota">
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span>
                {MESSAGES.overdue}{" "}
                <span className="font-normal">(revisar {formatFollowUp(inquiry.followUpOn!, today)})</span>
              </span>
            </p>
          ) : null}
        </div>

        <ChevronRight aria-hidden className="mt-3 size-5 shrink-0 self-start text-chocolate-suave" />
      </div>

      <div className="mt-3 border-t border-borde/80 pt-3">
        <QuickActions id={inquiry.id} customerLabel={inquiry.customerLabel} status={inquiry.status} today={today} />
      </div>
    </article>
  );
}
