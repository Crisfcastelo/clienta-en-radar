/**
 * Recursos de Ayuda. Solo se muestran los que están "disponible", así nunca aparecen
 * secciones vacías. El contenido lo redacta Crisfcastelo (docs/contenido-funcional.md);
 * la app no lo inventa. Activar uno = añadir su contenido y su ruta y cambiar el estado.
 *
 * Fuera de la app por decisión de producto: Agenda sin idas y venidas,
 * Cierra el día y desconecta, y el bonus épico de la primera compradora.
 */
export type ResourceStatus = "disponible" | "oculto";

export interface HelpResource {
  slug: string;
  title: string;
  description: string;
  status: ResourceStatus;
}

export const HELP_RESOURCES: readonly HelpResource[] = [
  {
    slug: "responde-sin-pensar",
    title: "Responde sin pensar",
    description: "Mensajes listos para copiar y adaptar, clasificados por situación.",
    status: "oculto",
  },
  {
    slug: "whatsapp-bajo-control",
    title: "WhatsApp bajo control",
    description: "Configuración guiada, etiquetas, respuestas rápidas y mensajes de ausencia.",
    status: "oculto",
  },
  {
    slug: "no-dejes-la-conversacion-a-medias",
    title: "No dejes la conversación a medias",
    description: "Secuencias de seguimiento, ejemplos y criterios para saber cuándo escribir.",
    status: "oculto",
  },
];

export function availableResources(): HelpResource[] {
  return HELP_RESOURCES.filter((resource) => resource.status === "disponible");
}
