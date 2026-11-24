"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  month: { year: number; month: number }; // month: 1-12
  onMonthChange: (m: { year: number; month: number }) => void;
  selected: string | null;
  onSelect: (date: string) => void;
  availability: Record<string, boolean>;
  minDate: string;
  maxDate: string;
  loading?: boolean;
};

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default function BookingCalendar({
  month,
  onMonthChange,
  selected,
  onSelect,
  availability,
  minDate,
  maxDate,
  loading = false,
}: Props) {
  const { year, month: m } = month;
  const firstDay = new Date(year, m - 1, 1).getDay();
  const daysInMonth = new Date(year, m, 0).getDate();
  const today = toISO(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    new Date().getDate()
  );

  const cells: Array<number | null> = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const prevDisabled = `${year}-${String(m).padStart(2, "0")}-01` <= minDate.slice(0, 7) + "-01";
  const nextDisabled = `${year}-${String(m).padStart(2, "0")}-01` >= maxDate.slice(0, 7) + "-01";

  const goPrev = () => {
    const d = new Date(year, m - 2, 1);
    onMonthChange({ year: d.getFullYear(), month: d.getMonth() + 1 });
  };
  const goNext = () => {
    const d = new Date(year, m, 1);
    onMonthChange({ year: d.getFullYear(), month: d.getMonth() + 1 });
  };

  return (
    <div className="rounded-lg border border-white/10 bg-ink/60 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          disabled={prevDisabled}
          aria-label="Mês anterior"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-white/15 text-mist transition-colors hover:border-bronze hover:text-bronze disabled:opacity-30 disabled:hover:border-white/15 disabled:hover:text-mist"
        >
          <ChevronLeft size={18} />
        </button>
        <h3 className="serif-title text-lg text-white">
          {MONTHS[m - 1]} <span className="text-bronze">{year}</span>
        </h3>
        <button
          type="button"
          onClick={goNext}
          disabled={nextDisabled}
          aria-label="Próximo mês"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-white/15 text-mist transition-colors hover:border-bronze hover:text-bronze disabled:opacity-30 disabled:hover:border-white/15 disabled:hover:text-mist"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <span
            key={w}
            className="pb-2 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-mist/60"
          >
            {w}
          </span>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <span key={`e-${i}`} className="h-11" />;
          const iso = toISO(year, m, day);
          const isPast = iso < minDate;
          const isBeyond = iso > maxDate;
          const hasSlot = availability[iso] === true;
          const disabled = isPast || isBeyond || !hasSlot;
          const isSelected = selected === iso;
          const isToday = iso === today;

          return (
            <button
              key={iso}
              type="button"
              disabled={disabled || loading}
              onClick={() => onSelect(iso)}
              aria-label={`${day} de ${MONTHS[m - 1]}${disabled ? " — indisponível" : " — disponível"}`}
              aria-pressed={isSelected}
              className={`relative flex h-11 flex-col items-center justify-center rounded-md border text-sm transition-all duration-200 ${
                isSelected
                  ? "border-bronze bg-bronze font-bold text-ink"
                  : disabled
                    ? "cursor-not-allowed border-transparent text-mist/30"
                    : "border-white/10 text-mist hover:border-bronze hover:text-bronze"
              } ${isToday && !isSelected ? "ring-1 ring-bronze/60" : ""}`}
            >
              <span>{day}</span>
              {!disabled && !isSelected && (
                <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-bronze" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/8 pt-4 text-[0.65rem] uppercase tracking-[0.12em] text-mist/60">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-bronze" /> Disponível
        </span>
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-mist/30" /> Indisponível
        </span>
        {loading && <span className="text-bronze">Carregando…</span>}
      </div>
    </div>
  );
}
