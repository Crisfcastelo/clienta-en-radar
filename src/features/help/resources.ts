/**
 * Registro de recursos y bonus. Solo se muestran los que están "disponible",
 * así nunca aparecen secciones vacías. Activar un bonus = añadir su ruta y
 * cambiar su estado aquí (y, en fase 6, comprobar el producto requerido).
 */
export type ResourceStatus = "disponible" | "oculto";

export interface HelpResource {
  slug: string;
  title: string;
  description: string;
  status: ResourceStatus;
  /** Código de producto en `entitlements` que da acceso. */
  productCode: string;
}

export const HELP_RESOURCES: readonly HelpResource[] = [
  {
    slug: "biblioteca-de-respuestas",
    title: "Biblioteca de respuestas",
    description: "Mensajes listos para copiar y adaptar a tu forma de hablar.",
    status: "oculto",
    productCode: "bonus_biblioteca",
  },
  {
    slug: "whatsapp-bajo-control",
    title: "WhatsApp bajo control",
    description: "Cómo organizar WhatsApp para que no se te escape ninguna conversación.",
    status: "oculto",
    productCode: "bonus_whatsapp",
  },
  {
    slug: "seguimientos",
    title: "Seguimientos",
    description: "Cuándo y cómo volver a escribir sin sentir que molestas.",
    status: "oculto",
    productCode: "bonus_seguimientos",
  },
];

export function availableResources(): HelpResource[] {
  return HELP_RESOURCES.filter((resource) => resource.status === "disponible");
}
