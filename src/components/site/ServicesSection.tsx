import Link from "next/link";
import { Clock, Scissors } from "lucide-react";
import PhotoSlot from "@/components/media/PhotoSlot";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { formatBRL } from "@/lib/format";
import type { Service } from "@/lib/types";

type Props = { services: Service[] };

export default function ServicesSection({ services }: Props) {
  return (
    <section id="servicos" className="section-y bg-cream text-ink">
      <div className="container-site">
        <SectionHeading
          light
          kicker="O que oferecemos"
          title="Serviços"
          subtitle="Encontre o estilo que combina com você."
        />

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, i) => (
            <Reveal key={service.id} delay={i * 80}>
              <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-ink/8 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-bronze/60 hover:shadow-[0_18px_40px_-24px_rgba(10,10,11,0.45)]">
                <PhotoSlot
                  src={service.image_url}
                  alt={service.name}
                  className="aspect-[4/3] w-full"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  zoom
                  placeholderLabel="Foto do serviço"
                  placeholderIcon={<Scissors size={30} strokeWidth={1.2} />}
                />

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="serif-title text-xl text-ink">{service.name}</h3>
                    <span className="display-title shrink-0 text-2xl text-bronze-deep">
                      {formatBRL(service.price)}
                    </span>
                  </div>

                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/65">
                    {service.description}
                  </p>

                  <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-5">
                    <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink/55">
                      <Clock size={14} className="text-bronze-deep" />
                      {service.duration_minutes} min
                    </span>
                    <Link
                      href={`/agendamento?servico=${service.id}`}
                      className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-bronze-deep transition-colors hover:text-ink"
                    >
                      Agendar este serviço →
                    </Link>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {services.length === 0 && (
          <p className="mt-12 text-center text-sm text-ink/60">
            Nenhum serviço disponível no momento.
          </p>
        )}
      </div>
    </section>
  );
}
