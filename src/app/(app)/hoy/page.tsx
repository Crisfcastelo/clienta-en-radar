import { ArrowRight, Plus } from "lucide-react";
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
    <div className="space-y-7">
      <header className="space-y-2">
        <p className="text-chocolate-suave">
          {greeting} · <span className="first-letter:uppercase">{formatLongDate(today)}</span>
        </p>
        <h1 className="text-4xl md:text-5xl">¿Qué tienes pendiente?</h1>
        <p className="text-lg text-chocolate-suave">Aquí tienes las conversaciones que necesitan tu atención.</p>
        <Flourish />
      </header>

      <section
        aria-label="Resumen"
        className="space-y-3 rounded-[1.75rem] border border-white/80 bg-superficie/55 p-3 shadow-(--shadow-suave) backdrop-blur-md"
      >
        {summary.hasAnyInquiry ? (
          <div className="grid grid-cols-3 gap-2">
            <Counter label="Por responder" value={summary.pendingCount} tone="bg-dorado-claro" number="text-dorado" />
            <Counter
              label="Para revisar"
              value={summary.reviewCount}
              tone="bg-terracota-claro"
              number="text-terracota"
            />
            <Counter
              label="Resueltas esta semana"
              value={summary.resolvedThisWeek}
              tone="bg-salvia"
              number="text-bosque"
            />
          </div>
        ) : null}
        <ButtonLink href="/consultas/nueva" size="lg" full className="justify-between md:hidden">
          <span className="inline-flex items-center gap-2">
            <Plus aria-hidden className="size-6" />
            Añadir consulta
          </span>
          <ArrowRight aria-hidden className="size-5" />
        </ButtonLink>
      </section>

      {!summary.hasAnyInquiry ? (
        <Card className="space-y-3 p-6 text-center">
          <h2 className="text-2xl">{MESSAGES.welcome}</h2>
          <p className="mx-auto max-w-md text-lg">{MESSAGES.firstSteps}</p>
        </Card>
      ) : nothingPending ? (
        <Card className="space-y-2 p-6 text-center">
          <h2 className="text-2xl">{MESSAGES.emptyTitle}</h2>
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

/** Trazo dorado decorativo bajo el subtítulo. */
function Flourish() {
  return (
    <svg aria-hidden viewBox="0 0 120 12" className="h-3 w-28 text-dorado-deco">
      <path
        d="M2 8c14-6 26-6 38-2s24 4 38-1 26-5 40 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
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
      <h2 id={id} className="flex items-baseline gap-2 text-2xl">
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

function Counter({ label, value, tone, number }: { label: string; value: number; tone: string; number: string }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-2xl px-2 py-3 text-center ${tone}`}>
      <span className={`font-display text-4xl leading-none ${number}`}>{value}</span>
      <span className="mt-1.5 text-sm leading-tight font-semibold">{label}</span>
    </div>
  );
}
