"use client";

import { useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { GalleryItem } from "@/lib/types";

type Props = {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export default function GalleryLightbox({ items, index, onClose, onNavigate }: Props) {
  const item = items[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate((index + 1) % items.length);
      if (e.key === "ArrowLeft") onNavigate((index - 1 + items.length) % items.length);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [index, items.length, onClose, onNavigate]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title || "Imagem ampliada"}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-bronze hover:text-bronze"
      >
        <X size={22} />
      </button>

      {items.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Imagem anterior"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index - 1 + items.length) % items.length);
            }}
            className="absolute left-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-bronze hover:text-bronze md:left-6"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            aria-label="Próxima imagem"
            onClick={(e) => {
              e.stopPropagation();
              onNavigate((index + 1) % items.length);
            }}
            className="absolute right-3 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-bronze hover:text-bronze md:right-6"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <figure
        className="relative max-h-[82vh] w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-white/10 bg-charcoal md:aspect-[16/10]">
          <Image
            src={item.image_url}
            alt={item.title || "Trabalho realizado"}
            fill
            sizes="(max-width: 1024px) 100vw, 896px"
            className="object-contain"
            unoptimized={!item.image_url.startsWith("/uploads")}
          />
        </div>
        <figcaption className="mt-4 flex items-center justify-between gap-4 text-center">
          <div>
            <p className="serif-title text-lg text-white">
              {item.title || "Trabalho realizado"}
            </p>
            {item.description && (
              <p className="mt-1 text-sm text-mist/80">{item.description}</p>
            )}
          </div>
          <span className="shrink-0 text-xs uppercase tracking-[0.2em] text-bronze">
            {index + 1} / {items.length}
          </span>
        </figcaption>
      </figure>
    </div>
  );
}
