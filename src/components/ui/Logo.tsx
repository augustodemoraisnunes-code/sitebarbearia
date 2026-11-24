import Link from "next/link";

type Props = {
  href?: string;
  className?: string;
  compact?: boolean;
};

export default function Logo({ href = "/", className = "", compact = false }: Props) {
  const content = (
    <span className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center border border-bronze/60 rounded-sm">
        <span className="display-title text-lg leading-none text-bronze">C</span>
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={`display-title text-white ${compact ? "text-xl" : "text-2xl"}`}
        >
          Casa Navalha
        </span>
        <span className="mt-1 text-[0.55rem] font-semibold uppercase tracking-[0.34em] text-bronze">
          Barber Shop
        </span>
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return <span className={className}>{content}</span>;
}
