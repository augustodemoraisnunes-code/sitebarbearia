import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/format";

type Props = { whatsapp: string; businessName: string };

export default function WhatsAppButton({ whatsapp, businessName }: Props) {
  return (
    <a
      href={whatsappLink(
        whatsapp,
        `Olá! Vim pelo site da ${businessName} e gostaria de informações.`
      )}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-bronze text-ink shadow-[0_10px_30px_-8px_rgba(198,161,100,0.6)] transition-transform duration-300 hover:scale-110"
    >
      <MessageCircle size={26} strokeWidth={2.2} />
    </a>
  );
}
