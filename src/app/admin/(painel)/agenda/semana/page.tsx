import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { FlashMessages, getFlash } from "@/components/admin/Flash";
import { listAppointments, listBusinessHours } from "@/lib/queries";
import { formatDateBR, formatBRL } from "@/lib/format";
import { toMinutes } from "@/lib/booking/availability";

export const dynamic = "force-dynamic";

const DAY_LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function mondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // segunda como início
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

const BLOCK_COLORS: Record<string, string> = {
  pending: "bg-amber-100 border-amber-400 text-amber-800",
  confirmed: "bg-emerald-100 border-emerald-400 text-emerald-800",
  completed: "bg-sky-100 border-sky-400 text-sky-800",
};

export default async function WeeklyAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ inicio?: string; err?: string; ok?: string }>;
}) {
  const params = await searchParams;
  const { err, ok } = getFlash(params);

  const today = new Date();
  const startInput =
    params.inicio && /^\d{4}-\d{2}-\d{2}$/.test(params.inicio)
      ? new Date(`${params.inicio}T00:00:00`)
      : today;
  const monday = mondayOf(startInput);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
  const sunday = days[6];
  const prev = new Date(monday);
  prev.setDate(prev.getDate() - 7);
  const next = new Date(monday);
  next.setDate(next.getDate() + 7);

  const hours = listBusinessHours();
  const appointments = listAppointments({ from: iso(monday), to: iso(sunday) }).filter(
    (a) => a.status !== "cancelled"
  );

  const opens = hours.filter((h) => h.is_open).map((h) => toMinutes(h.opening_time));
  const closes = hours.filter((h) => h.is_open).map((h) => toMinutes(h.closing_time));
  const dayStart = opens.length ? Math.min(...opens) : 9 * 60;
  const dayEnd = closes.length ? Math.max(...closes) : 19 * 60;
  const HOUR_H = 64;
  const totalHours = Math.max(1, Math.ceil((dayEnd - dayStart) / 60));
  const hourRows = Array.from({ length: totalHours + 1 }, (_, i) => dayStart + i * 60);

  const todayISOStr = iso(today);

  return (
    <>
      <PageHeader
        title="Agenda semanal"
        description={`${formatDateBR(iso(monday))} — ${formatDateBR(iso(sunday))}`}
        actions={
          <Link href="/admin/agendamentos" className="btn btn-bronze !py-3">
            Novo agendamento
          </Link>
        }
      />

      <FlashMessages err={err} ok={ok} />

      <div className="mb-5 flex items-center gap-3">
        <Link
          href={`/admin/agenda/semana?inicio=${iso(prev)}`}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-ink/15 bg-white text-ink/70 hover:border-bronze-deep hover:text-bronze-deep"
          aria-label="Semana anterior"
        >
          <ChevronLeft size={18} />
        </Link>
        <Link
          href={`/admin/agenda/semana?inicio=${iso(next)}`}
          className="flex h-10 w-10 items-center justify-center rounded-md border border-ink/15 bg-white text-ink/70 hover:border-bronze-deep hover:text-bronze-deep"
          aria-label="Próxima semana"
        >
          <ChevronRight size={18} />
        </Link>
        <Link
          href="/admin/agenda/semana"
          className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-bronze-deep"
        >
          Esta semana
        </Link>
        <div className="ml-auto flex flex-wrap gap-3 text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-ink/55">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-amber-300" /> Pendente
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-emerald-400" /> Confirmado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm bg-sky-400" /> Concluído
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-ink/8 bg-white">
        <div className="min-w-[900px]">
          {/* Cabeçalho dos dias */}
          <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b border-ink/8">
            <div className="px-2 py-3 text-center text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink/40">
              Hora
            </div>
            {days.map((d) => {
              const dISO = iso(d);
              const isToday = dISO === todayISOStr;
              const open = hours.find((h) => h.weekday === d.getDay());
              return (
                <Link
                  key={dISO}
                  href={`/admin/agenda?date=${dISO}`}
                  className={`border-l border-ink/6 px-2 py-3 text-center transition-colors hover:bg-cream ${
                    isToday ? "bg-bronze/10" : ""
                  }`}
                >
                  <span className="block text-[0.6rem] font-bold uppercase tracking-[0.12em] text-ink/50">
                    {DAY_LABELS[d.getDay()]}
                  </span>
                  <span
                    className={`display-title block text-lg ${isToday ? "text-bronze-deep" : "text-ink"}`}
                  >
                    {String(d.getDate()).padStart(2, "0")}/
                    {String(d.getMonth() + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[0.55rem] uppercase tracking-wide text-ink/40">
                    {open?.is_open
                      ? `${open.opening_time}–${open.closing_time}`
                      : "Fechado"}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Corpo */}
          <div className="relative grid grid-cols-[70px_repeat(7,1fr)]">
            {/* Linhas de hora */}
            <div>
              {hourRows.map((h) => (
                <div
                  key={h}
                  style={{ height: HOUR_H }}
                  className="border-b border-ink/6 pr-2 text-right text-[0.62rem] font-semibold text-ink/45"
                >
                  <span className="relative -top-2">
                    {String(Math.floor(h / 60)).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {days.map((d) => {
              const dISO = iso(d);
              const dayAppts = appointments.filter((a) => a.appointment_date === dISO);
              const open = hours.find((h) => h.weekday === d.getDay());
              return (
                <div key={dISO} className="relative border-l border-ink/6">
                  {hourRows.map((h) => (
                    <div key={h} style={{ height: HOUR_H }} className="border-b border-ink/6" />
                  ))}

                  {!open?.is_open && (
                    <div className="absolute inset-0 flex items-center justify-center bg-cream/70">
                      <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ink/35">
                        Fechado
                      </span>
                    </div>
                  )}

                  {dayAppts.map((a) => {
                    const start = toMinutes(a.start_time);
                    const end = toMinutes(a.end_time);
                    const top = ((start - dayStart) / 60) * HOUR_H;
                    const height = Math.max(28, ((end - start) / 60) * HOUR_H - 4);
                    return (
                      <Link
                        key={a.id}
                        href={`/admin/agendamentos?editar=${a.id}`}
                        style={{ top: top + 2, height }}
                        className={`absolute left-1 right-1 overflow-hidden rounded-md border-l-4 px-2 py-1 text-[0.66rem] leading-tight shadow-sm transition-transform hover:z-10 hover:scale-[1.02] ${
                          BLOCK_COLORS[a.status] ?? "bg-neutral-100 border-neutral-400 text-neutral-700"
                        }`}
                        title={`${a.start_time} ${a.client_name_snapshot}`}
                      >
                        <span className="block font-bold">
                          {a.start_time} {a.client_name_snapshot}
                        </span>
                        <span className="block opacity-80">
                          {a.service_name_snapshot} · {formatBRL(a.service_price_snapshot)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-ink/50">
        Dica: em telas pequenas, arraste a agenda para o lado. Clique em um
        agendamento para editá-lo.
      </p>
    </>
  );
}
