import { Star } from "lucide-react";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import type { Testimonial } from "@/lib/types";

type Props = { testimonials: Testimonial[] };

export default function TestimonialsSection({ testimonials }: Props) {
  return (
    <section id="depoimentos" className="section-y bg-cream text-ink">
      <div className="container-site">
        <SectionHeading
          light
          kicker="Depoimentos"
          title="Quem conhece, recomenda."
          subtitle="A confiança de quem já sentou na cadeira."
        />

        {testimonials.length === 0 ? (
          <Reveal className="mx-auto mt-12 max-w-xl rounded-lg border border-dashed border-ink/20 bg-white px-6 py-12 text-center">
            <p className="serif-title text-lg text-ink">
              Os depoimentos dos clientes aparecem aqui
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink/60">
              Cadastre avaliações reais no painel administrativo
              (Configurações → Depoimentos).
            </p>
          </Reveal>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.id} delay={i * 90} as="article">
                <figure className="flex h-full flex-col rounded-lg border border-ink/8 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-bronze/60">
                  <div className="flex gap-1" aria-label={`${t.rating} de 5 estrelas`}>
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star
                        key={s}
                        size={16}
                        className={
                          s < t.rating
                            ? "fill-bronze text-bronze"
                            : "text-ink/20"
                        }
                      />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-ink/75">
                    “{t.content}”
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3 border-t border-ink/10 pt-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-bold text-bronze">
                      {t.client_name.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold uppercase tracking-[0.1em] text-ink">
                      {t.client_name}
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
