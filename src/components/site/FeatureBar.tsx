import { BadgeCheck, Compass, Scissors, Sparkles } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

const ITEMS = [
  {
    icon: Scissors,
    title: "Cortes personalizados",
    text: "Estilos pensados para valorizar cada cliente.",
  },
  {
    icon: BadgeCheck,
    title: "Técnica e precisão",
    text: "Atenção aos detalhes e acabamento impecável.",
  },
  {
    icon: Compass,
    title: "Ambiente premium",
    text: "Conforto, estrutura e experiência completa.",
  },
  {
    icon: Sparkles,
    title: "Atendimento profissional",
    text: "Experiência individual e personalizada.",
  },
];

export default function FeatureBar() {
  return (
    <section
      id="diferenciais"
      aria-label="Diferenciais da barbearia"
      className="border-y border-white/8 bg-charcoal"
    >
      <div className="container-site grid grid-cols-1 divide-y divide-white/8 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
        {ITEMS.map((item, i) => (
          <Reveal
            key={item.title}
            delay={i * 90}
            className="flex items-start gap-4 px-0 py-8 sm:px-6 lg:px-8 lg:py-10"
          >
            <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-bronze/40 text-bronze">
              <item.icon size={20} strokeWidth={1.6} />
            </span>
            <span className="block">
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-mist/80">
                {item.text}
              </p>
            </span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
