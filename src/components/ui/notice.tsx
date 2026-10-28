import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "success" | "error" | "info";

const tones: Record<Tone, { box: string; Icon: typeof Info }> = {
  success: { box: "bg-oliva-claro border-oliva/40", Icon: CircleCheck },
  error: { box: "bg-terracota-claro border-terracota/40", Icon: CircleAlert },
  info: { box: "bg-dorado-claro border-dorado/30", Icon: Info },
};

/** Mensaje en línea. `role` se elige según urgencia: status (educado) o alert (errores). */
export function Notice({ tone, children, className = "" }: { tone: Tone; children: ReactNode; className?: string }) {
  const { box, Icon } = tones[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 ${box} ${className}`}
    >
      <Icon aria-hidden className={`mt-0.5 size-5 shrink-0 ${tone === "error" ? "text-terracota" : "text-oliva"}`} />
      <div className="font-semibold">{children}</div>
    </div>
  );
}
