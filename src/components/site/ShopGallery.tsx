"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import PhotoSlot from "@/components/media/PhotoSlot";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import GalleryLightbox from "@/components/site/GalleryLightbox";
import type { GalleryItem } from "@/lib/types";

type Props = {
  items: GalleryItem[];
  cover: string;
};

export default function ShopGallery({ items, cover }: Props) {
  const [index, setIndex] = useState<number | null>(null);

  // A foto de capa (configuração) entra na primeira posição quando existir.
  const list: GalleryItem[] = cover
    ? [
        {
          id: -1,
          image_url: cover,
          title: "Nosso espaço",
          category: "ambiente",
          description: "",
          is_featured: true,
          sort_order: 0,
          created_at: "",
        },
        ...items.filter((i) => i.image_url !== cover),
      ]
    : items;

  const [first, ...rest] = list;

  return (
    <section id="ambiente" className="section-y bg-ink">
      <div className="container-site">
        <SectionHeading
          kicker="A casa"
          title="Nosso ambiente"
          subtitle="Um espaço pensado para conforto, estilo e uma experiência premium do início ao fim."
        />

        {!first ? (
          <Reveal className="mt-14 flex flex-col items-center gap-4 rounded-lg border border-dashed border-white/15 bg-charcoal/60 px-6 py-16 text-center">
            <Camera size={34} strokeWidth={1.2} className="text-bronze" />
            <p className="serif-title text-xl text-white">
              As fotos do ambiente aparecem aqui
            </p>
            <p className="max-w-md text-sm leading-relaxed text-mist/75">
              Envie fotos da fachada, das cadeiras, espelhos e detalhes do
              interior pelo painel administrativo (Galeria → Ambiente).
            </p>
          </Reveal>
        ) : (
          <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <button
                type="button"
                onClick={() => setIndex(0)}
                className="group relative block w-full overflow-hidden rounded-lg border border-white/8"
                aria-label="Ampliar foto do ambiente"
              >
                <PhotoSlot
                  src={first.image_url}
                  alt={first.title || "Ambiente da barbearia"}
                  className="aspect-[4/3] w-full"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  zoom
                  placeholderLabel="Foto do ambiente"
                  placeholderIcon={<Camera size={30} strokeWidth={1.2} />}
                />
              </button>
            </Reveal>

            <div className="grid grid-cols-2 gap-4 lg:col-span-5">
              {rest.slice(0, 4).map((item, i) => (
                <Reveal key={item.id} delay={(i + 1) * 80}>
                  <button
                    type="button"
                    onClick={() => setIndex(i + 1)}
                    className="group relative block w-full overflow-hidden rounded-lg border border-white/8"
                    aria-label={`Ampliar ${item.title || "foto do ambiente"}`}
                  >
                    <PhotoSlot
                      src={item.image_url}
                      alt={item.title || "Detalhe do ambiente"}
                      className="aspect-square w-full"
                      sizes="(max-width: 1024px) 50vw, 24vw"
                      zoom
                      placeholderLabel="Foto"
                      placeholderIcon={<Camera size={22} strokeWidth={1.2} />}
                    />
                  </button>
                </Reveal>
              ))}
              {rest.length === 0 && (
                <Reveal className="col-span-2 flex aspect-square flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/15 bg-charcoal/60 px-4 text-center">
                  <Camera size={26} strokeWidth={1.2} className="text-bronze" />
                  <span className="text-xs uppercase tracking-[0.16em] text-mist/70">
                    Espaço para mais fotos
                  </span>
                </Reveal>
              )}
            </div>
          </div>
        )}
      </div>

      {index !== null && list[index] && (
        <GalleryLightbox
          items={list}
          index={index}
          onClose={() => setIndex(null)}
          onNavigate={setIndex}
        />
      )}
    </section>
  );
}
