import { Camera, Mail, MessageCircle, MessagesSquare } from "lucide-react";
import { CHANNEL_LABELS } from "../domain/labels";
import type { InquiryChannel } from "../domain/types";

export const CHANNEL_ICONS: Record<InquiryChannel, typeof Mail> = {
  whatsapp: MessageCircle,
  instagram: Camera,
  email: Mail,
  otro: MessagesSquare,
};

export function ChannelTag({ channel }: { channel: InquiryChannel | null }) {
  if (!channel) return null;
  const Icon = CHANNEL_ICONS[channel];
  return (
    <span className="inline-flex items-center gap-1 text-sm text-chocolate-suave">
      <Icon aria-hidden className="size-4" />
      {CHANNEL_LABELS[channel]}
    </span>
  );
}
