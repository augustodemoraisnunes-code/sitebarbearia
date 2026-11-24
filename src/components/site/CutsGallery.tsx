"use client";

import { useMemo, useState } from "react";
import { Scissors } from "lucide-react";
import PhotoSlot from "@/components/media/PhotoSlot";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import GalleryLightbox from "@/components/site/GalleryLightbox";
import type { GalleryItem } from "@/lib/types";

type Props = { items: GalleryItem[] };

const CATEGORY_LABELS: Record<string, string> = {
  corte: "Cortes",
  degradê: "Degradê",
  classico: "Clássicos",
  barba: "Barba",
  design: "Designs",
};

/** Categorias que NÃO pertencem à galeria de cortes. */
const HIDDEN_CATEGORIES = new Set(["ambiente", "barbeiro"]);

export default function CutsGallery({ items: allItems }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>("todos");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const items = useMemo(
    () => allItems.filter((i) => !HIDDEN_CATEGORIES.has(i.category)),
    [allItems]
  );

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category));
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    if (activeCategory === "todos") return items;
    return items.filter((i) => i.category === activeCategory);
  }, [items, activeCategory]);

  const featured = useMemo(
    () => filtered.filter((i) => i.is_featured),
    [filtered]
  );

  return (
    <section id="galeria" className="section-y bg-ink">
      <div className="container-site">
        <SectionHeading
          kicker="Portfólio"
          title="Trabalhos realizados"
          subtitle="Cada corte tem seu estilo. Cada detalhe faz diferença."
        />

        {categories.length > 1 && (
          <Reveal className="mt-10 flex flex-wrap justify-center gap-3">
            {["todos", ...categories].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full border px-5 py-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] transition-all duration-200 ${
                  activeCategory === cat
                    ? "border-bronze bg-bronze text-ink"
                    : "border-white/15 text-mist hover:border-bronze hover:text-bronze"
                }`}
              >
                {cat === "todos" ? "Todos" : CATEGORY_LABELS[cat] ?? cat}
              </button>
            ))}
          </Reveal>
        )}

        {filtered.length === 0 ? (
          <Reveal className="mt-14 flex flex-col items-center gap-4 rounded-lg border border-dashed border-white/15 bg-charcoal/60 px-6 py-16 text-center">
            <Scissors size={34} strokeWidth={1.2} className="text-bronze" />
            <p className="serif-title text-xl text-white">
              As fotos dos cortes aparecem aqui
            </p>
            <p className="max-w-md text-sm leading-relaxed text-mist/75">
              Adicione as fotografias reais dos trabalhos pelo painel
              administrativo (Galeria) e elas serão exibidas nesta seção
              automaticamente.
            </p>
            <a href="/agendamento" className="btn btn-bronze mt-2">
              Agendar horário
            </a>
          </Reveal>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item, i) => (
              <Reveal key={item.id} delay={(i % 6) * 70}>
                <button
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className="group relative block w-full overflow-hidden rounded-lg border border-white/8 bg-charcoal text-left"
                  aria-label={`Ampliar ${item.title || "foto"} ${i + 1}`}
                >
                  <PhotoSlot
                    src={item.image_url}
                    alt={item.title || "Corte realizado"}
                    className="aspect-[4/5] w-full"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    zoom
                    placeholderLabel="Foto do corte"
                    placeholderIcon={<Scissors size={28} strokeWidth={1.2} />}
                  />
                  <span className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/90 via-ink/10 to-transparent p-5 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    {item.is_featured && (
                      <span className="mb-2 w-fit rounded-sm bg-bronze px-2 py-1 text-[0.55rem] font-bold uppercase tracking-[0.18em] text-ink">
                        Destaque
                      </span>
                    )}
                    <span className="serif-title text-lg text-white">
                      {item.title || "Trabalho realizado"}
                    </span>
                    {item.description && (
                      <span className="mt-1 text-xs text-mist/85">
                        {item.description}
                      </span>
                    )}
                  </span>
                  {item.is_featured && (
                    <span className="absolute left-3 top-3 rounded-sm border border-bronze/60 bg-ink/80 px-2 py-1 text-[0.55rem] font-bold uppercase tracking-[0.18em] text-bronze">
                      Destaque
                    </span>
                  )}
                </button>
              </Reveal>
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && filtered[lightboxIndex] && (
        <GalleryLightbox
          items={filtered}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </section>
  );
}
