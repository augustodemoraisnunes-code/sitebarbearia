import Link from "next/link";
import {
  AtSign,
  MapPin,
  MessageCircle,
  Phone,
  Clock,
  CalendarCheck,
} from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { whatsappLink } from "@/lib/format";

type Props = {
  phone: string;
  whatsapp: string;
  instagram: string;
  address: string;
  schedule: string;
  mapUrl: string;
  businessName: string;
};

export default function ContactSection({
  phone,
  whatsapp,
  instagram,
  address,
  schedule,
  mapUrl,
  businessName,
}: Props) {
  const items = [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: phone,
      href: whatsappLink(whatsapp, `Olá! Vim pelo site da ${businessName}.`),
      external: true,
    },
    { icon: Phone, label: "Telefone", value: phone, href: `tel:${phone.replace(/\D/g, "")}` },
    {
      icon: AtSign,
      label: "Instagram",
      value: "@instagram",
      href: instagram,
      external: true,
    },
    { icon: MapPin, label: "Endereço", value: address },
    { icon: Clock, label: "Horários", value: schedule },
  ];

  return (
    <section id="contato" className="section-y bg-charcoal">
      <div className="container-site">
        <SectionHeading
          kicker="Contato e localização"
          title="Seu próximo corte está a um clique."
          subtitle="Tire dúvidas, confirme detalhes ou agende direto pelo site."
        />

        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <Reveal as="ul" className="flex flex-col divide-y divide-white/8 rounded-lg border border-white/8 bg-ink/60">
              {items.map((item) => (
                <li key={item.label} className="flex items-start gap-4 p-5">
                  <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-bronze/40 text-bronze">
                    <item.icon size={18} strokeWidth={1.6} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.62rem] font-bold uppercase tracking-[0.22em] text-bronze">
                      {item.label}
                    </span>
                    {item.href ? (
                      <a
                        href={item.href}
                        target={item.external ? "_blank" : undefined}
                        rel={item.external ? "noopener noreferrer" : undefined}
                        className="mt-1 block break-words text-sm text-mist transition-colors hover:text-white"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <span className="mt-1 block break-words text-sm text-mist">
                        {item.value}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </Reveal>

            <Reveal delay={140} className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/agendamento" className="btn btn-bronze flex-1">
                <CalendarCheck size={16} />
                Agendar pelo site
              </Link>
              <a
                href={whatsappLink(
                  whatsapp,
                  `Olá! Gostaria de agendar um horário na ${businessName}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline flex-1"
              >
                <MessageCircle size={16} />
                Falar no WhatsApp
              </a>
            </Reveal>
          </div>

          <Reveal delay={120}>
            <div className="h-full min-h-[340px] overflow-hidden rounded-lg border border-bronze/30 bg-ink">
              <iframe
                title={`Mapa — ${businessName}`}
                src={mapUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full min-h-[340px] w-full grayscale-[35%]"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
