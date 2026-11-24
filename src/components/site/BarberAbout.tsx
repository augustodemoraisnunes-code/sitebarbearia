import Link from "next/link";
import { Award, CalendarCheck, Scissors, Sparkles } from "lucide-react";
import PhotoSlot from "@/components/media/PhotoSlot";
import Reveal from "@/components/ui/Reveal";

type Props = {
  name: string;
  role: string;
  bio: string;
  years: string;
  specialties: string;
  image: string;
  gallery: Array<{ id: number; image_url: string; title: string }>;
};

export default function BarberAbout({
  name,
  role,
  bio,
  years,
  specialties,
  image,
  gallery,
}: Props) {
  const extras = gallery.slice(0, 3);

  return (
    <section id="barbeiro" className="section-y bg-charcoal">
      <div className="container-site">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Fotografia principal */}
          <Reveal className="lg:col-span-5">
            <div className="relative">
              <PhotoSlot
                src={image}
                alt={`Retrato de ${name}`}
                className="aspect-[4/5] w-full rounded-lg border border-white/10"
                sizes="(max-width: 1024px) 100vw, 40vw"
                placeholderLabel="Retrato do barbeiro"
                placeholderIcon={<Scissors size={34} strokeWidth={1.2} />}
              />
              <span className="absolute -bottom-5 -right-4 hidden rounded-md border border-bronze/50 bg-ink px-6 py-4 text-center shadow-lg sm:block">
                <span className="display-title block text-3xl text-bronze">
                  {years}+
                </span>
                <span className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-mist">
                  Anos de ofício
                </span>
              </span>
            </div>
          </Reveal>

          {/* Texto */}
          <div className="lg:col-span-7">
            <Reveal>
              <p className="kicker">O profissional</p>
              <h2 className="serif-title mt-4 text-3xl text-white md:text-4xl lg:text-[2.6rem]">
                Por trás de cada corte, uma identidade.
              </h2>
            </Reveal>

            <Reveal delay={120} className="mt-6">
              <div className="hairline h-px w-28" />
            </Reveal>

            <Reveal delay={180} className="mt-6">
              <p className="text-base leading-relaxed text-mist/90">{bio}</p>
            </Reveal>

            <Reveal delay={260} className="mt-8">
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="rounded-lg border border-white/8 bg-ink/60 p-5">
                  <dt className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-bronze">
                    <Award size={14} /> Nome
                  </dt>
                  <dd className="mt-2">
                    <span className="display-title text-2xl text-white">
                      {name}
                    </span>
                    <span className="mt-1 block text-xs uppercase tracking-[0.16em] text-mist/70">
                      {role}
                    </span>
                  </dd>
                </div>
                <div className="rounded-lg border border-white/8 bg-ink/60 p-5">
                  <dt className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-bronze">
                    <Sparkles size={14} /> Especialidades
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-mist/90">
                    {specialties}
                  </dd>
                </div>
              </dl>
            </Reveal>

            {extras.length > 0 && (
              <Reveal delay={320} className="mt-8 grid grid-cols-3 gap-3">
                {extras.map((g) => (
                  <PhotoSlot
                    key={g.id}
                    src={g.image_url}
                    alt={g.title || "Barbeiro no trabalho"}
                    className="aspect-square w-full rounded-md border border-white/10"
                    sizes="(max-width: 768px) 33vw, 200px"
                    placeholderLabel="Foto"
                    placeholderIcon={<Scissors size={20} strokeWidth={1.2} />}
                  />
                ))}
              </Reveal>
            )}

            <Reveal delay={380} className="mt-10">
              <Link href="/agendamento" className="btn btn-bronze">
                <CalendarCheck size={16} />
                Agendar com {name.split(" ")[0]}
              </Link>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
