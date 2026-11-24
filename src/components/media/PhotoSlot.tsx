import Image from "next/image";
import type { ReactNode } from "react";

type Props = {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  zoom?: boolean;
  /** Conteúdo exibido quando ainda não há foto cadastrada. */
  placeholderLabel?: string;
  placeholderIcon?: ReactNode;
};

/**
 * Exibe a imagem cadastrada ou, quando não há nenhuma, um espaço reservado
 * pronto para receber a foto real depois do desenvolvimento.
 */
export default function PhotoSlot({
  src,
  alt,
  className = "",
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  zoom = false,
  placeholderLabel = "Espaço para foto",
  placeholderIcon,
}: Props) {
  return (
    <div className={`relative overflow-hidden bg-charcoal ${className}`}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={`object-cover ${zoom ? "transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]" : ""}`}
        />
      ) : (
        <div
          aria-label={`${alt} — ${placeholderLabel}`}
          role="img"
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_30%_20%,rgba(198,161,100,0.12),transparent_60%),linear-gradient(160deg,#171719_0%,#0a0a0b_100%)]"
        >
          <span className="text-bronze/70">{placeholderIcon}</span>
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-mist/60">
            {placeholderLabel}
          </span>
          <span className="h-px w-10 bg-bronze/40" />
        </div>
      )}
    </div>
  );
}
