import Reveal from "@/components/ui/Reveal";

type Props = {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  light?: boolean;
  id?: string;
};

export default function SectionHeading({
  kicker,
  title,
  subtitle,
  align = "center",
  light = false,
  id,
}: Props) {
  const alignment =
    align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <Reveal className={`flex flex-col gap-4 ${alignment}`}>
      <div className={`flex flex-col gap-4 ${alignment}`} id={id}>
        {kicker && <p className="kicker">{kicker}</p>}
        <h2
          className={`serif-title text-3xl md:text-4xl lg:text-[2.75rem] ${
            light ? "text-ink" : "text-white"
          }`}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className={`max-w-2xl text-sm leading-relaxed md:text-base ${
              light ? "text-ink/65" : "text-mist/80"
            }`}
          >
            {subtitle}
          </p>
        )}
        <span className="hairline mt-1 h-px w-24" />
      </div>
    </Reveal>
  );
}
