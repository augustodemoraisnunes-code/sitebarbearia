import Link from "next/link";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Phone,
  Plus,
} from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { FlashMessages, getFlash } from "@/components/admin/Flash";
import { changeAppointmentStatus } from "@/lib/actions/appointments";
import DangerForm from "@/components/admin/DangerForm";
import { shiftDate, todayISO } from "@/lib/booking/availability";
import { listAppointmentsByDate, listBusinessHours } from "@/lib/queries";
import { formatBRL, formatDateBR, formatPhoneBR } from "@/lib/format";
import { hoursForDate } from "@/lib/booking/availability";
import type { Appointment, AppointmentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  completed: "bg-sky-100 text-sky-700",
  cancelled: "bg-neutral-200 text-neutral-600",
  no_show: "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

function StatusActions({ a }: { a: Appointment }) {
  const actions: Array<{ status: AppointmentStatus; label: string }> = [];
  if (a.status === "pending") actions.push({ status: "confirmed", label: "Confirmar" });
  if (a.status === "pending" || a.status === "confirmed")
    actions.push({ status: "completed", label: "Concluir" });
  if (a.status === "pending" || a.status === "confirmed")
    actions.push({ status: "no_show", label: "Falta" });
  if (a.status !== "cancelled" && a.status !== "completed")
    actions.push({ status: "cancelled", label: "Cancelar" });
  if (a.status === "cancelled" || a.status === "completed")
    actions.push({ status: "confirmed", label: "Reabrir" });

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((act) => (
        <DangerForm
          key={act.status}
          action={changeAppointmentStatus}
          confirmMessage={`Marcar "${a.client_name_snapshot}" como ${STATUS_LABEL[act.status].toLowerCase()}?`}
        >
          <input type="hidden" name="id" value={a.id} />
          <input type="hidden" name="status" value={act.status} />
          <button
            type="submit"
            className="rounded-md border border-ink/15 px-3 py-1.5 text-[0.62rem] font-bold uppercase tracking-[0.1em] text-ink/70 transition-colors hover:border-bronze-deep hover:text-bronze-deep"
          >
            {act.label}
          </button>
        </DangerForm>
      ))}
    </div>
  );
}

export default async function DailyAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; err?: string; ok?: string }>;
}) {
  const params = await searchParams;
  const { err, ok } = getFlash(params);
  const today = todayISO();
  const date =
    params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : today;

  const appointments = listAppointmentsByDate(date);
  const hours = listBusinessHours();
  const dayHours = hoursForDate(date, hours);

  return (
    <>
      <PageHeader
        title="Agenda do dia"
        description={formatDateBR(date)}
        actions={
          <Link href="/admin/agendamentos" className="btn btn-bronze !py-3">
            <Plus size={15} /> Novo agendamento
          </Link>
        }
      />

      <FlashMessages err={err} ok={ok} />

      {/* Navegação de data */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-ink/8 bg-white p-4">
        <Link
          href={`/admin/agenda?date=${shiftDate(date, -1)}`}
          aria-label="Dia anterior"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-ink/15 text-ink/70 hover:border-bronze-deep hover:text-bronze-deep"
        >
          <ChevronLeft size={18} />
        </Link>
        <form method="get" className="flex items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={date}
            className="field field-light w-auto !py-2.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-md border border-ink/15 px-4 py-2.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-ink/70 hover:border-bronze-deep hover:text-bronze-deep"
          >
            Ir
          </button>
        </form>
        <Link
          href={`/admin/agenda?date=${shiftDate(date, 1)}`}
          aria-label="Próximo dia"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-ink/15 text-ink/70 hover:border-bronze-deep hover:text-bronze-deep"
        >
          <ChevronRight size={18} />
        </Link>

        {date !== today && (
          <Link
            href="/admin/agenda"
            className="text-[0.68rem] font-bold uppercase tracking-[0.12em] text-bronze-deep"
          >
            Voltar para hoje
          </Link>
        )}

        <span className="ml-auto flex items-center gap-2 text-xs text-ink/55">
          <CalendarClock size={14} className="text-bronze-deep" />
          {dayHours && dayHours.is_open
            ? `Expediente ${dayHours.opening_time}–${dayHours.closing_time}`
            : "Fechado nesta data"}
        </span>
      </div>

      {appointments.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink/15 bg-white px-6 py-16 text-center">
          <p className="serif-title text-lg text-ink">
            Nenhum agendamento para este dia
          </p>
          <p className="mt-2 text-sm text-ink/55">
            Aproveite para cadastrar um atendimento manual.
          </p>
          <Link href="/admin/agendamentos" className="btn btn-bronze mt-5 !py-3">
            <Plus size={15} /> Criar agendamento
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {appointments.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-ink/8 bg-white p-5 transition-shadow hover:shadow-[0_10px_30px_-24px_rgba(10,10,11,0.6)]"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-5">
                  <div className="text-center">
                    <p className="display-title text-2xl text-ink">
                      {a.start_time}
                    </p>
                    <p className="text-[0.62rem] uppercase tracking-[0.14em] text-ink/45">
                      {a.end_time}
                    </p>
                  </div>
                  <div className="h-14 w-px bg-ink/10" />
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-sm font-bold text-ink">
                        {a.client_name_snapshot}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.1em] ${STATUS_STYLE[a.status]}`}
                      >
                        {STATUS_LABEL[a.status]}
                      </span>
                      {a.source === "painel" && (
                        <span className="rounded-full bg-ink/5 px-2.5 py-1 text-[0.58rem] font-bold uppercase tracking-[0.1em] text-ink/50">
                          Manual
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm text-ink/70">
                      {a.service_name_snapshot} · {a.service_duration_snapshot}{" "}
                      min · {formatBRL(a.service_price_snapshot)}
                    </p>
                    <a
                      href={`tel:${a.client_phone_snapshot.replace(/\D/g, "")}`}
                      className="mt-1 flex items-center gap-1.5 text-sm text-ink/60 hover:text-bronze-deep"
                    >
                      <Phone size={13} /> {formatPhoneBR(a.client_phone_snapshot)}
                    </a>
                    {a.notes && (
                      <p className="mt-2 rounded-md bg-cream px-3 py-2 text-xs text-ink/65">
                        Obs.: {a.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <StatusActions a={a} />
                  <Link
                    href={`/admin/agendamentos?editar=${a.id}`}
                    className="flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-bronze-deep hover:text-ink"
                  >
                    <Pencil size={13} /> Editar
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
