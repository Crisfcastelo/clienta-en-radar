import { ChevronRight, Share, SquarePlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { requireUser } from "@/features/account/session";
import { availableResources } from "@/features/help/resources";
import { inquiries } from "@/features/inquiries/data";
import { MESSAGES } from "@/features/inquiries/domain/labels";

export const metadata: Metadata = { title: "Ayuda y recursos" };

const STEPS = [
  {
    title: "Apunta lo imprescindible",
    body: "Cuando alguien te escriba y no puedas contestar en ese momento, añádela con un nombre y lo que necesita. Diez segundos.",
  },
  {
    title: "Cuando respondas, márcalo",
    body: "Pulsa «Marcar como respondida». Si quieres retomarla más adelante, usa «Preparar seguimiento» y elige el día.",
  },
  {
    title: "Mira Hoy y olvídate del resto",
    body: "Hoy te enseña solo lo que necesita tu atención. Cuando algo esté cerrado, pulsa «Resolver»: queda en tu historial.",
  },
];

const FAQ = [
  {
    q: "¿La app lee mis mensajes de WhatsApp o Instagram?",
    a: "No. No se conecta a ninguna red ni envía mensajes por ti. Tú apuntas lo esencial y decides qué hacer.",
  },
  {
    q: "¿Qué diferencia hay entre «Esperando respuesta» y «Hacer seguimiento»?",
    a: "«Esperando respuesta» es cuando la pelota está en su tejado. «Hacer seguimiento» es cuando te toca a ti volver a escribirle.",
  },
  {
    q: "¿Qué pasa cuando llega la fecha de revisión?",
    a: "La consulta aparece en «Para revisar». Si se te pasa el día, sigue ahí con el aviso «Esta conversación necesita una revisión» hasta que hagas algo con ella. La app no cambia el estado por su cuenta.",
  },
  {
    q: "¿Qué pasa con las consultas resueltas?",
    a: "Siguen guardadas en tu historial. Las encuentras en Consultas, con el filtro «Resueltas», y puedes reabrirlas cuando quieras.",
  },
  {
    q: "¿Qué datos debería apuntar?",
    a: "Lo justo para reconocer la conversación. No hace falta teléfono, email ni datos sensibles: con un nombre o un apodo basta.",
  },
  {
    q: "¿Funciona sin conexión?",
    a: "Necesitas internet para ver y guardar consultas. Si te quedas sin conexión, la app te avisará.",
  },
  {
    q: "¿Puedo llevarme mis datos?",
    a: "Sí. En Ajustes puedes descargar todas tus consultas en un archivo cuando quieras.",
  },
];

export default async function HelpPage() {
  await requireUser();
  const resources = availableResources();
  const savedCount = (await inquiries().list()).length;

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <PageHeader
        title="Todo lo que necesitas, a mano"
        intro={
          // El subtítulo definitivo promete recursos: solo se muestra cuando ya hay alguno disponible.
          resources.length > 0
            ? "Respuestas preparadas, ayuda para organizar WhatsApp y mensajes de seguimiento."
            : "Cómo funciona, cómo instalarla y respuestas a las dudas más habituales."
        }
      />

      {savedCount < 3 ? <Notice tone="info">{MESSAGES.firstSteps}</Notice> : null}

      <section aria-labelledby="bienvenida" className="space-y-4">
        <h2 id="bienvenida" className="text-2xl font-semibold">
          Cómo funciona
        </h2>
        <ol className="space-y-3">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <Card className="flex gap-4 p-5">
                <span
                  aria-hidden
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-oliva font-display text-lg font-semibold text-white"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-sans text-lg font-bold">{step.title}</h3>
                  <p className="text-chocolate-suave">{step.body}</p>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="instalar" className="space-y-4">
        <h2 id="instalar" className="text-2xl font-semibold">
          Tenla en la pantalla de inicio
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="space-y-2 p-5">
            <h3 className="font-sans text-lg font-bold">En iPhone (Safari)</h3>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Pulsa <Share aria-hidden className="inline size-4" /> <strong>Compartir</strong>.
              </li>
              <li>
                Elige <SquarePlus aria-hidden className="inline size-4" /> <strong>Añadir a pantalla de inicio</strong>.
              </li>
              <li>
                Pulsa <strong>Añadir</strong>.
              </li>
            </ol>
          </Card>
          <Card className="space-y-2 p-5">
            <h3 className="font-sans text-lg font-bold">En Android (Chrome)</h3>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Abre el menú <strong>⋮</strong> de arriba a la derecha.
              </li>
              <li>
                Elige <strong>Añadir a pantalla de inicio</strong> o <strong>Instalar aplicación</strong>.
              </li>
              <li>Confirma.</li>
            </ol>
          </Card>
        </div>
      </section>

      <section aria-labelledby="preguntas" className="space-y-4">
        <h2 id="preguntas" className="text-2xl font-semibold">
          Preguntas frecuentes
        </h2>
        <div className="space-y-2">
          {FAQ.map((item) => (
            <details key={item.q} className="group rounded-2xl border border-borde bg-superficie">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 font-semibold [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronRight aria-hidden className="size-5 shrink-0 transition-transform group-open:rotate-90" />
              </summary>
              <p className="px-5 pb-4 text-chocolate-suave">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {resources.length > 0 ? (
        <section aria-labelledby="recursos" className="space-y-4">
          <h2 id="recursos" className="text-2xl font-semibold">
            Recursos
          </h2>
          <ul className="space-y-3">
            {resources.map((resource) => (
              <li key={resource.slug}>
                <Link href={`/ayuda/${resource.slug}`} className="block">
                  <Card className="p-5 hover:bg-neutro">
                    <h3 className="font-sans text-lg font-bold">{resource.title}</h3>
                    <p className="text-chocolate-suave">{resource.description}</p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
