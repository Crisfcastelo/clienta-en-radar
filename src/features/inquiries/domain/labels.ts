import type { InquiryChannel, InquiryStatus } from "./types";

export const STATUS_LABELS: Record<InquiryStatus, string> = {
  por_responder: "Por responder",
  esperando_respuesta: "Esperando respuesta",
  hacer_seguimiento: "Hacer seguimiento",
  resuelta: "Resuelta",
};

export const STATUS_HINTS: Record<InquiryStatus, string> = {
  por_responder: "Te toca contestar a ti.",
  esperando_respuesta: "Ya contestaste. Ahora le toca a ella.",
  hacer_seguimiento: "Conviene volver a escribirle.",
  resuelta: "No necesita nada más.",
};

export const CHANNEL_LABELS: Record<InquiryChannel, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  email: "Email",
  otro: "Otro",
};

export const MESSAGES = {
  firstAccess: "Vamos a quitarte una preocupación de encima. Empieza añadiendo las consultas que tienes pendientes.",
  emptyTitle: "Todo al día por aquí.",
  emptyBody: "No tienes ninguna consulta pendiente registrada.",
  resolved: "Una cosa menos en la cabeza.",
  overdue: "Esta conversación necesita una revisión.",
} as const;
