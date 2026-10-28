import { ChevronRight, Share, SquarePlus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { availableResources } from "@/features/help/resources";

export const metadata: Metadata = { title: "Ayuda" };

const STEPS = [
  {
    title: "Apunta cada consulta",
    body: "Cuando alguien te escriba y no puedas contestar en ese momento, añádela con un nombre y una frase. Diez segundos.",
  },
  {
    title: "Cambia el estado cuando avances",
    body: "¿Ya contestaste? Pásala a «Esperando respuesta». Si quieres volver a escribirle, ponle una fecha de revisión.",
  },
  {
    title: "Mira Hoy y olvídate del resto",
    body: "Hoy te enseña solo lo que necesita tu atención. Cuando algo esté cerrado, márcalo como resuelto.",
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
    a: "La consulta aparece arriba en Hoy con el aviso «Esta conversación necesita una revisión». La app no cambia el estado por su cuenta.",
  },
  {
    q: "¿Archivar es lo mismo que eliminar?",
    a: "No. Archivar la quita de tus listas pero puedes recuperarla. Eliminar la borra para siempre.",
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

export default function HelpPage() {
  const resources = availableResources();

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <PageHeader title="Ayuda" intro="Todo lo que necesitas para empezar, en dos minutos." />

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
