import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { FlashMessages, getFlash } from "@/components/admin/Flash";
import { listAppointments, listBusinessHours } from "@/lib/queries";
import { hoursForDate, todayISO } from "@/lib/booking/availability";
import { formatDateBR } from "@/lib/format";

export const dynamic = "force-dynamic";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; err?: string; ok?: string }>;
}) {
  const params = await searchParams;
  const { err, ok } = getFlash(params);

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  if (params.mes && /^\d{4}-\d{2}$/.test(params.mes)) {
    year = Number(params.mes.slice(0, 4));
    month = Number(params.mes.slice(5, 7));
  }

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const rangeStart = iso(year, month, 1);
  const rangeEnd = iso(year, month, daysInMonth);
  const appointments = listAppointments({ from: rangeStart, to: rangeEnd }).filter(
    (a) => a.status !== "cancelled"
  );
  const hours = listBusinessHours();
  const today = todayISO();

  const prevDate = new Date(year, month - 2, 1);
  const nextDate = new Date(year, month, 1);
  const prev = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
  const next = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;

  const cells: Array<number | null> = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const totalMonth = appointments.length;

  return (
    <>
      <PageHeader
        title="Calendário"
        description={`${MONTHS[month - 1]} de ${year} · ${totalMonth} agendamento(s) no mês`}
        actions={
          <>
            <Link href="/admin/agenda" className="btn btn-ghost-dark !py-3">
              Agenda do dia
            </Link>
            <Link href="/admin/agendamentos" className="btn btn-bronze !py-3">
              Novo agendamento
            </Link>
          </>
        }
      />

      <FlashMessages err={err} ok={ok} />

      <div className="rounded-lg border border-ink/8 bg-white p-4 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <Link
            href={`/admin/calendario?mes=${prev}`}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-ink/15 text-ink/70 hover:border-bronze-deep hover:text-bronze-deep"
            aria-label="Mês anterior"
          >
            <ChevronLeft size={18} />
          </Link>
          <h2 className="serif-title text-xl text-ink">
            {MONTHS[month - 1]} <span className="text-bronze-deep">{year}</span>
          </h2>
          <Link
            href={`/admin/calendario?mes=${next}`}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-ink/15 text-ink/70 hover:border-bronze-deep hover:text-bronze-deep"
            aria-label="Próximo mês"
          >
            <ChevronRight size={18} />
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {WEEKDAYS.map((w) => (
            <span
              key={w}
              className="pb-1 text-center text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink/45"
            >
              {w}
            </span>
          ))}

          {cells.map((day, i) => {
            if (day === null) return <span key={`e-${i}`} className="min-h-20" />;
            const dISO = iso(year, month, day);
            const dayAppts = appointments.filter((a) => a.appointment_date === dISO);
            const dayHours = hoursForDate(dISO, hours);
            const closed = !dayHours || !dayHours.is_open;
            const isPast = dISO < today;
            const isToday = dISO === today;
            const busy = dayAppts.length;

            const tone = closed
              ? "bg-cream/60 text-ink/35"
              : busy === 0
                ? "bg-white text-ink/70"
                : busy <= 2
                  ? "bg-bronze/15 text-ink"
                  : busy <= 5
                    ? "bg-bronze/35 text-ink"
                    : "bg-bronze/60 text-ink";

            return (
              <Link
                key={dISO}
                href={`/admin/agenda?date=${dISO}`}
                className={`group flex min-h-20 flex-col rounded-md border p-2 transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  isToday ? "border-bronze ring-1 ring-bronze" : "border-ink/10"
                } ${tone}`}
                title={formatDateBR(dISO)}
              >
                <span className="flex items-center justify-between">
                  <span
                    className={`text-sm font-bold ${isPast && !isToday ? "opacity-50" : ""}`}
                  >
                    {day}
                  </span>
                  {isToday && (
                    <span className="rounded-sm bg-ink px-1.5 py-0.5 text-[0.5rem] font-bold uppercase tracking-wide text-bronze">
                      Hoje
                    </span>
                  )}
                </span>
                <span className="mt-auto text-[0.62rem] font-semibold">
                  {closed ? (
                    <span className="uppercase tracking-wide text-ink/35">Fechado</span>
                  ) : busy > 0 ? (
                    <>
                      {busy} agend.
                      <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-ink/10">
                        <span
                          className="block h-full rounded-full bg-bronze-deep"
                          style={{ width: `${Math.min(100, busy * 20)}%` }}
                        />
                      </span>
                    </>
                  ) : (
                    <span className="text-ink/40">livre</span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-ink/8 pt-4 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-ink/50">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm border border-ink/10 bg-white" /> Livre
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-bronze/25" /> Poucos horários
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-bronze/60" /> Agenda cheia
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-cream" /> Fechado
          </span>
        </div>
      </div>
    </>
  );
}
