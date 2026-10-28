import { CalendarClock, CircleCheck, MessageCircle, Plus } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/features/account/session";
import { InquiryCard } from "@/features/inquiries/components/inquiry-card";
import { inquiries } from "@/features/inquiries/data";
import { MESSAGES } from "@/features/inquiries/domain/labels";
import { buildTodaySummary } from "@/features/inquiries/domain/priority";
import type { Inquiry } from "@/features/inquiries/domain/types";
import { dayPartIn, formatLongDate, todayIn } from "@/lib/dates";

export const metadata: Metadata = { title: "Hoy" };

const GREETINGS = { morning: "Buenos días", afternoon: "Buenas tardes", evening: "Buenas noches" } as const;

export default async function TodayPage() {
  const user = await requireUser();
  const today = todayIn(user.timezone);
  const summary = buildTodaySummary(await inquiries().list(), today, user.timezone);
  const greeting = `${GREETINGS[dayPartIn(user.timezone)]}${user.displayName ? `, ${user.displayName}` : ""}`;
  const nothingPending = summary.toReview.length === 0 && summary.toAnswer.length === 0;

  return (
    <div className="space-y-8">
      <header className="space-y-2 pt-2">
        <p className="text-chocolate-suave">
          {greeting} · <span className="first-letter:uppercase">{formatLongDate(today)}</span>
        </p>
        <h1 className="text-3xl font-semibold md:text-4xl">¿Qué tienes pendiente?</h1>
        <p className="text-chocolate-suave">Aquí tienes las conversaciones que necesitan tu atención.</p>
      </header>

      {summary.hasAnyInquiry ? (
        <section aria-label="Resumen" className="grid grid-cols-3 gap-2 sm:gap-3">
          <Counter label="Por responder" value={summary.pendingCount} Icon={MessageCircle} tone="bg-dorado-claro" />
          <Counter label="Para revisar" value={summary.reviewCount} Icon={CalendarClock} tone="bg-terracota-claro" />
          <Counter
            label="Resueltas esta semana"
            value={summary.resolvedThisWeek}
            Icon={CircleCheck}
            tone="bg-oliva-claro"
          />
        </section>
      ) : null}

      <div className="md:hidden">
        <ButtonLink href="/consultas/nueva" size="lg" full>
          <Plus aria-hidden className="size-6" />
          Añadir consulta
        </ButtonLink>
      </div>

      {!summary.hasAnyInquiry ? (
        <Card className="space-y-3 p-6 text-center">
          <h2 className="text-2xl font-semibold">{MESSAGES.welcome}</h2>
          <p className="mx-auto max-w-md text-lg">{MESSAGES.firstSteps}</p>
          <div className="hidden md:block">
            <ButtonLink href="/consultas/nueva">
              <Plus aria-hidden className="size-5" />
              Añadir consulta
            </ButtonLink>
          </div>
        </Card>
      ) : nothingPending ? (
        <Card className="space-y-2 p-6 text-center">
          <h2 className="text-2xl font-semibold">{MESSAGES.emptyTitle}</h2>
          <p className="text-chocolate-suave">{MESSAGES.emptyBody}</p>
        </Card>
      ) : (
        <>
          <Section id="para-revisar" title="Para revisar" items={summary.toReview} today={today} tz={user.timezone} />
          <Section id="por-responder" title="Por responder" items={summary.toAnswer} today={today} tz={user.timezone} />
        </>
      )}
    </div>
  );
}

function Section({
  id,
  title,
  items,
  today,
  tz,
}: {
  id: string;
  title: string;
  items: Inquiry[];
  today: string;
  tz: string;
}) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="flex items-baseline gap-2 text-xl font-semibold">
        {title}
        <span className="font-sans text-base font-normal text-chocolate-suave">({items.length})</span>
      </h2>
      <ul className="space-y-3">
        {items.map((inquiry) => (
          <li key={inquiry.id}>
            <InquiryCard inquiry={inquiry} today={today} timeZone={tz} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Counter({
  label,
  value,
  Icon,
  tone,
}: {
  label: string;
  value: number;
  Icon: typeof CircleCheck;
  tone: string;
}) {
  return (
    <div className={`flex flex-col justify-between rounded-(--radius-tarjeta) border border-borde p-3 sm:p-4 ${tone}`}>
      <span className="flex items-start gap-1.5 text-sm leading-tight font-semibold">
        <Icon aria-hidden className="mt-px size-4 shrink-0" />
        {label}
      </span>
      <span className="mt-2 block font-display text-3xl font-semibold sm:text-4xl">{value}</span>
    </div>
  );
}
