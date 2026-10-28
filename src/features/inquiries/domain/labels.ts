import type { InquiryChannel, InquiryStatus } from "./types";

export const STATUS_LABELS: Record<InquiryStatus, string> = {
  por_responder: "Por responder",
  esperando_respuesta: "Esperando respuesta",
  hacer_seguimiento: "Hacer seguimiento",
  resuelta: "Resuelta",
};

export const CHANNEL_LABELS: Record<InquiryChannel, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  email: "Email",
  otro: "Otro",
};

/** Textos definitivos de docs/contenido-funcional.md. No cambiar sin revisarlo con Crisfcastelo. */
export const MESSAGES = {
  tagline: "Tus consultas pendientes, fuera de tu cabeza y bajo control.",
  welcome: "Vamos a quitarte una preocupación de encima.",
  firstSteps: "Empieza con tres consultas que tengas pendientes. No necesitas registrar todo lo anterior.",
  emptyTitle: "Todo al día por aquí.",
  emptyBody: "No tienes ninguna consulta pendiente registrada.",
  saved: "Guardada. Ya no tienes que acordarte de memoria.",
  resolved: "Una cosa menos en la cabeza.",
  overdue: "Esta conversación necesita una revisión.",
} as const;
