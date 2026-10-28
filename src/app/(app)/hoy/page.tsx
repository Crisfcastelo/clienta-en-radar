import { BellRing, MessageCircle, Plus } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/features/account/session";
import { InquiryCard } from "@/features/inquiries/components/inquiry-card";
import { inquiries } from "@/features/inquiries/data";
import { MESSAGES } from "@/features/inquiries/domain/labels";
import { buildTodaySummary } from "@/features/inquiries/domain/priority";
import type { TodayReason } from "@/features/inquiries/domain/priority";
import { dayPartIn, formatLongDate, todayIn } from "@/lib/dates";

export const metadata: Metadata = { title: "Hoy" };

const GREETINGS = { morning: "Buenos días", afternoon: "Buenas tardes", evening: "Buenas noches" } as const;

const SECTION_TITLES: Record<TodayReason, string> = {
  overdue: "Necesitan una revisión",
  due_today: "Para revisar hoy",
  pending: "Por responder",
};

export default async function TodayPage() {
  const user = await requireUser();
  const today = todayIn(user.timezone);
  const summary = buildTodaySummary(await inquiries().list(), today);
  const greeting = `${GREETINGS[dayPartIn(user.timezone)]}${user.displayName ? `, ${user.displayName}` : ""}`;

  const sections = (["overdue", "due_today", "pending"] as const)
    .map((reason) => ({ reason, items: summary.actions.filter((a) => a.reason === reason) }))
    .filter((section) => section.items.length > 0);

  return (
    <div className="space-y-8">
      <header className="space-y-1 pt-2">
        <p className="text-chocolate-suave first-letter:uppercase">{formatLongDate(today)}</p>
        <h1 className="text-3xl font-semibold md:text-4xl">{greeting}</h1>
      </header>

      {summary.hasAnyInquiry ? (
        <section aria-label="Resumen" className="grid grid-cols-2 gap-3">
          <Counter label="Por responder" value={summary.pendingCount} Icon={MessageCircle} tone="bg-dorado-claro" />
          <Counter label="En seguimiento" value={summary.followingCount} Icon={BellRing} tone="bg-oliva-claro" />
        </section>
      ) : null}

      <div className="md:hidden">
        <ButtonLink href="/consultas/nueva" size="lg" full>
          <Plus aria-hidden className="size-6" />
          Nueva consulta
        </ButtonLink>
      </div>

      {!summary.hasAnyInquiry ? (
        <Card className="space-y-4 p-6 text-center">
          <h2 className="text-2xl font-semibold">Empecemos</h2>
          <p className="mx-auto max-w-md text-lg">{MESSAGES.firstAccess}</p>
          <div className="hidden md:block">
            <ButtonLink href="/consultas/nueva">
              <Plus aria-hidden className="size-5" />
              Añadir mi primera consulta
            </ButtonLink>
          </div>
        </Card>
      ) : sections.length === 0 ? (
        <Card className="space-y-2 p-6 text-center">
          <h2 className="text-2xl font-semibold">{MESSAGES.emptyTitle}</h2>
          <p className="text-chocolate-suave">{MESSAGES.emptyBody}</p>
        </Card>
      ) : (
        sections.map(({ reason, items }) => (
          <section key={reason} aria-labelledby={`seccion-${reason}`} className="space-y-3">
            <h2 id={`seccion-${reason}`} className="flex items-baseline gap-2 text-xl font-semibold">
              {SECTION_TITLES[reason]}
              <span className="font-sans text-base font-normal text-chocolate-suave">({items.length})</span>
            </h2>
            <ul className="space-y-3">
              {items.map(({ inquiry }) => (
                <li key={inquiry.id}>
                  <InquiryCard inquiry={inquiry} today={today} timeZone={user.timezone} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function Counter({ label, value, Icon, tone }: { label: string; value: number; Icon: typeof BellRing; tone: string }) {
  return (
    <div className={`rounded-(--radius-tarjeta) border border-borde p-4 ${tone}`}>
      <span className="flex items-center gap-2 text-sm font-semibold">
        <Icon aria-hidden className="size-4" />
        {label}
      </span>
      <span className="mt-1 block font-display text-4xl font-semibold">{value}</span>
    </div>
  );
}
