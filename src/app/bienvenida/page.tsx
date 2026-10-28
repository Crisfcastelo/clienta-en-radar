import type { Metadata } from "next";
import { BrandMark } from "@/components/brand";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { completeOnboardingAction } from "@/features/account/actions";
import { DEMO_MODE } from "@/features/account/demo-profile";
import { requireUser } from "@/features/account/session";
import { createInquiryAction } from "@/features/inquiries/actions";
import { InquiryForm } from "@/features/inquiries/components/inquiry-form";
import { inquiries } from "@/features/inquiries/data";
import { MESSAGES } from "@/features/inquiries/domain/labels";
import { todayIn } from "@/lib/dates";

export const metadata: Metadata = { title: "Bienvenida" };

type Step = 1 | 2 | 3;

/**
 * Primera configuración: tres pasos que se pueden saltar. Solo aparece la primera vez;
 * al terminar o saltarla se guarda y no vuelve a mostrarse.
 */
export default async function WelcomePage({ searchParams }: PageProps<"/bienvenida">) {
  const user = await requireUser();
  const raw = (await searchParams).paso;
  const step: Step = raw === "2" ? 2 : raw === "3" ? 3 : 1;

  return (
    <main className="pt-safe mx-auto flex min-h-dvh max-w-xl flex-col gap-6 px-4 py-8">
      {DEMO_MODE ? (
        <p className="rounded-2xl bg-dorado-claro px-4 py-2 text-center text-sm">
          Versión de prueba con datos ficticios.
        </p>
      ) : null}
      <div className="flex items-center justify-between">
        <BrandMark className="size-10" />
        <p className="text-sm font-semibold text-chocolate-suave">Paso {step} de 3</p>
      </div>

      {step === 1 ? <StepWelcome /> : null}
      {step === 2 ? <StepFirstInquiries today={todayIn(user.timezone)} /> : null}
      {step === 3 ? <StepReady /> : null}
    </main>
  );
}

function SkipButton() {
  return (
    <form action={completeOnboardingAction}>
      <Button type="submit" variant="ghost" full>
        Saltar por ahora
      </Button>
    </form>
  );
}

function StepWelcome() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-6">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold">{MESSAGES.welcome}</h1>
        <p className="text-xl text-chocolate-suave">{MESSAGES.tagline}</p>
      </div>
      <div className="space-y-2">
        <ButtonLink href="/bienvenida?paso=2" size="lg" full>
          Empezar
        </ButtonLink>
        <SkipButton />
      </div>
    </div>
  );
}

async function StepFirstInquiries({ today }: { today: string }) {
  const count = (await inquiries().list()).length;
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold">¿Quién te ha escrito?</h1>
        <p className="text-lg">{MESSAGES.firstSteps}</p>
      </div>
      <Card className="p-5 sm:p-6">
        <InquiryForm mode="create" initialId={crypto.randomUUID()} today={today} action={createInquiryAction} />
      </Card>
      <div className="space-y-2">
        <p role="status" className="text-center font-semibold">
          {count === 0
            ? "Aún no has guardado ninguna."
            : count === 1
              ? "Llevas 1 guardada."
              : `Llevas ${count} guardadas.`}
        </p>
        <ButtonLink href="/bienvenida?paso=3" variant="secondary" size="lg" full>
          Ya está por ahora
        </ButtonLink>
      </div>
    </div>
  );
}

function StepReady() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-6">
      <div className="space-y-4 text-lg">
        <h1 className="text-4xl font-semibold">Ya tienes tu radar preparado.</h1>
        <p>Ahora sabes dónde consultar qué conversaciones tienes pendientes y cuáles necesitan seguimiento.</p>
        <p>No hace falta que lo tengas todo perfecto desde el primer día.</p>
        <p>
          Empieza con las consultas que tienes ahora mismo. Cuando respondas a alguien, actualiza su estado. Y cuando
          necesites retomar una conversación, deja indicada la próxima revisión.
        </p>
        <p className="font-semibold">La idea es sencilla: que no tengas que acordarte de todo.</p>
      </div>
      <form action={completeOnboardingAction}>
        <Button type="submit" size="lg" full>
          Ir a mis pendientes
        </Button>
      </form>
    </div>
  );
}
