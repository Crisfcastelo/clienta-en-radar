import { BellRing, CircleCheck, Hourglass, MessageCircle } from "lucide-react";
import { STATUS_LABELS } from "../domain/labels";
import type { InquiryStatus } from "../domain/types";

export const STATUS_ICONS: Record<InquiryStatus, typeof BellRing> = {
  por_responder: MessageCircle,
  esperando_respuesta: Hourglass,
  hacer_seguimiento: BellRing,
  resuelta: CircleCheck,
};

const STATUS_STYLES: Record<InquiryStatus, string> = {
  por_responder: "bg-dorado-claro border-dorado/40",
  esperando_respuesta: "bg-neutro border-borde-campo/40",
  hacer_seguimiento: "bg-terracota-claro border-terracota/30",
  resuelta: "bg-oliva-claro border-oliva/40",
};

/** Estado con icono y texto: nunca depende solo del color. */
export function StatusBadge({ status }: { status: InquiryStatus }) {
  const Icon = STATUS_ICONS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold text-chocolate ${STATUS_STYLES[status]}`}
    >
      <Icon aria-hidden className="size-4" />
      {STATUS_LABELS[status]}
    </span>
  );
}
