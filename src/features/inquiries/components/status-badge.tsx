import { BellRing, CircleCheck, Hourglass, MessageCircle } from "lucide-react";
import { STATUS_LABELS } from "../domain/labels";
import type { InquiryStatus } from "../domain/types";

export const STATUS_ICONS: Record<InquiryStatus, typeof BellRing> = {
  por_responder: MessageCircle,
  esperando_respuesta: Hourglass,
  hacer_seguimiento: BellRing,
  resuelta: CircleCheck,
};

const STATUS_STYLES: Record<InquiryStatus, { pill: string; dot: string }> = {
  por_responder: { pill: "bg-dorado-claro", dot: "bg-dorado-deco" },
  esperando_respuesta: { pill: "bg-neutro", dot: "bg-chocolate-suave" },
  hacer_seguimiento: { pill: "bg-terracota-claro", dot: "bg-terracota" },
  resuelta: { pill: "bg-salvia", dot: "bg-bosque" },
};

/** Estado como píldora con punto de color y texto: nunca depende solo del color. */
export function StatusBadge({ status }: { status: InquiryStatus }) {
  const { pill, dot } = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-semibold text-chocolate ${pill}`}
    >
      <span aria-hidden className={`size-1.5 rounded-full ${dot}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
