"use client";

import { CalendarClock, Loader2 } from "lucide-react";

type Props = {
  slots: string[];
  selected: string | null;
  onSelect: (slot: string) => void;
  loading?: boolean;
  dateLabel?: string;
};

export default function TimeSlotSelector({
  slots,
  selected,
  onSelect,
  loading = false,
  dateLabel,
}: Props) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-lg border border-white/10 bg-ink/60 px-4 py-10 text-sm text-mist">
        <Loader2 size={18} className="spin text-bronze" />
        Carregando horários disponíveis…
      </div>
    );
  }

  if (!dateLabel) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-white/15 bg-ink/60 px-4 py-10 text-center">
        <CalendarClock size={26} strokeWidth={1.4} className="text-bronze" />
        <p className="text-sm text-mist/75">
          Selecione uma data para ver os horários disponíveis.
        </p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-white/15 bg-ink/60 px-4 py-10 text-center">
        <CalendarClock size={26} strokeWidth={1.4} className="text-mist/60" />
        <p className="text-sm text-mist/75">
          Nenhum horário livre em {dateLabel}. Tente outra data.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="label">Horários disponíveis em {dateLabel}</p>
      <div
        role="listbox"
        aria-label="Horários disponíveis"
        className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5"
      >
        {slots.map((slot) => {
          const isSelected = selected === slot;
          return (
            <button
              key={slot}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect(slot)}
              className={`rounded-md border px-2 py-3 text-sm font-semibold tracking-wide transition-all duration-200 ${
                isSelected
                  ? "border-bronze bg-bronze text-ink"
                  : "border-white/12 bg-white/4 text-mist hover:border-bronze hover:text-bronze"
              }`}
            >
              {slot}
            </button>
          );
        })}
      </div>
    </div>
  );
}
