import Link from "next/link";
import { ArrowDown, Scissors } from "lucide-react";
import PhotoSlot from "@/components/media/PhotoSlot";
import Reveal from "@/components/ui/Reveal";

type Props = {
  kicker: string;
  title: string;
  description: string;
  image: string;
  address: string;
  schedule: string;
};

export default function Hero({
  kicker,
  title,
  description,
  image,
  address,
  schedule,
}: Props) {
  return (
    <section id="inicio" className="relative isolate min-h-[92svh] overflow-hidden">
      <PhotoSlot
        src={image}
        alt="Barbeiro realizando um corte na barbearia"
        className="absolute inset-0 h-full w-full"
        sizes="100vw"
        priority
        placeholderLabel="Espaço para foto de destaque"
        placeholderIcon={<Scissors size={40} strokeWidth={1.2} />}
      />
      <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(10,10,11,0.96)_0%,rgba(10,10,11,0.82)_38%,rgba(10,10,11,0.45)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />

      <div className="container-site relative flex min-h-[92svh] flex-col justify-end pb-16 pt-32 md:pb-20 lg:justify-center lg:pb-24">
        <div className="max-w-3xl">
          <Reveal>
            <p className="kicker mb-6 flex items-center gap-4">
              <span className="h-px w-10 bg-bronze" />
              {kicker}
            </p>
          </Reveal>

          <Reveal delay={120}>
            <h1 className="display-title text-[clamp(3rem,10vw,6.5rem)] text-white">
              {title}
            </h1>
          </Reveal>

          <Reveal delay={240}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-mist md:text-lg">
              {description}
            </p>
          </Reveal>

          <Reveal delay={360}>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link href="/agendamento" className="btn btn-bronze">
                Agendar horário
              </Link>
              <a href="#galeria" className="btn btn-outline">
                Ver cortes
              </a>
            </div>
          </Reveal>

          <Reveal delay={480}>
            <dl className="mt-12 grid max-w-2xl grid-cols-1 gap-6 border-t border-white/10 pt-8 sm:grid-cols-2">
              <div>
                <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-bronze">
                  Endereço
                </dt>
                <dd className="mt-2 text-sm text-mist">{address}</dd>
              </div>
              <div>
                <dt className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-bronze">
                  Funcionamento
                </dt>
                <dd className="mt-2 text-sm text-mist">{schedule}</dd>
              </div>
            </dl>
          </Reveal>
        </div>

        <a
          href="#diferenciais"
          aria-label="Rolar para os diferenciais"
          className="absolute bottom-6 right-6 hidden h-12 w-12 items-center justify-center rounded-full border border-white/20 text-mist transition-colors hover:border-bronze hover:text-bronze md:flex"
        >
          <ArrowDown size={18} className="animate-bounce" />
        </a>
      </div>
    </section>
  );
}
