import Link from "next/link";
import { Pencil, Phone, Search, Trash2 } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { FlashMessages, getFlash } from "@/components/admin/Flash";
import DangerForm from "@/components/admin/DangerForm";
import ManualAppointmentForm from "@/components/admin/ManualAppointmentForm";
import EditAppointmentForm from "@/components/admin/EditAppointmentForm";
import {
  changeAppointmentStatus,
  removeAppointment,
} from "@/lib/actions/appointments";
import { getAppointment, listAppointments, listServices } from "@/lib/queries";
import { formatBRL, formatDateBR, formatPhoneBR } from "@/lib/format";
import { todayISO } from "@/lib/booking/availability";
import { APPOINTMENT_STATUS_LABEL, type AppointmentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  completed: "bg-sky-100 text-sky-700",
  cancelled: "bg-neutral-200 text-neutral-600",
  no_show: "bg-red-100 text-red-700",
};

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    status?: string;
    q?: string;
    editar?: string;
    err?: string;
    ok?: string;
  }>;
}) {
  const p = await searchParams;
  const { err, ok } = getFlash(p);
  const services = listServices(true);

  const from = p.from && /^\d{4}-\d{2}-\d{2}$/.test(p.from) ? p.from : todayISO();
  const to = p.to && /^\d{4}-\d{2}-\d{2}$/.test(p.to) ? p.to : undefined;
  const status = p.status && p.status in APPOINTMENT_STATUS_LABEL ? p.status : "";
  const q = (p.q ?? "").trim().toLowerCase();

  let appointments = listAppointments({
    from,
    to: to ?? from,
    status: (status || undefined) as AppointmentStatus | undefined,
    limit: 300,
  });
  if (q) {
    appointments = appointments.filter(
      (a) =>
        a.client_name_snapshot.toLowerCase().includes(q) ||
        a.client_phone_snapshot.includes(q) ||
        a.service_name_snapshot.toLowerCase().includes(q)
    );
  }

  const editing = p.editar ? getAppointment(Number(p.editar)) : null;

  return (
    <>
      <PageHeader
        title="Gestão de agendamentos"
        description="Consulte, crie, edite e altere o status das reservas."
      />

      <FlashMessages err={err} ok={ok} />

      {editing ? (
        <div className="mb-8">
          <EditAppointmentForm appointment={editing} services={services.filter((s) => s.is_active || s.id === editing.service_id)} />
        </div>
      ) : (
        <div className="mb-8">
          <ManualAppointmentForm services={services.filter((s) => s.is_active)} />
        </div>
      )}

      {/* Filtros */}
      <form
        method="get"
        className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-ink/8 bg-white p-4"
      >
        <div>
          <label className="label !text-ink/60" htmlFor="f-from">
            De
          </label>
          <input
            id="f-from"
            type="date"
            name="from"
            defaultValue={from}
            className="field field-light w-auto !py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="label !text-ink/60" htmlFor="f-to">
            Até
          </label>
          <input
            id="f-to"
            type="date"
            name="to"
            defaultValue={to ?? ""}
            className="field field-light w-auto !py-2.5 text-sm"
          />
        </div>
        <div>
          <label className="label !text-ink/60" htmlFor="f-status">
            Status
          </label>
          <select
            id="f-status"
            name="status"
            defaultValue={status}
            className="field field-light w-auto !py-2.5 text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(APPOINTMENT_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-52 flex-1">
          <label className="label !text-ink/60" htmlFor="f-q">
            Buscar cliente / telefone
          </label>
          <input
            id="f-q"
            name="q"
            defaultValue={p.q ?? ""}
            placeholder="Nome ou telefone"
            className="field field-light !py-2.5 text-sm"
          />
        </div>
        <button type="submit" className="btn btn-ghost-dark !py-3">
          <Search size={14} /> Filtrar
        </button>
      </form>

      {/* Lista */}
      <div className="overflow-hidden rounded-lg border border-ink/8 bg-white">
        {appointments.length === 0 ? (
          <p className="px-6 py-14 text-center text-sm text-ink/55">
            Nenhum agendamento encontrado para os filtros selecionados.
          </p>
        ) : (
          <ul className="divide-y divide-ink/6">
            {appointments.map((a) => (
              <li key={a.id} className="px-5 py-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="display-title w-28 text-lg text-bronze-deep">
                      {a.appointment_date.split("-").reverse().slice(0, 2).join("/")}{" "}
                      {a.start_time}
                    </span>
                    <span>
                      <span className="flex items-center gap-2 text-sm font-bold text-ink">
                        {a.client_name_snapshot}
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[0.56rem] font-bold uppercase tracking-[0.1em] ${STATUS_BADGE[a.status]}`}
                        >
                          {APPOINTMENT_STATUS_LABEL[a.status]}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs text-ink/60">
                        {a.service_name_snapshot} · {a.service_duration_snapshot} min ·{" "}
                        {formatBRL(a.service_price_snapshot)}
                      </span>
                      <a
                        href={`tel:${a.client_phone_snapshot.replace(/\D/g, "")}`}
                        className="mt-1 flex items-center gap-1.5 text-xs text-ink/55 hover:text-bronze-deep"
                      >
                        <Phone size={12} /> {formatPhoneBR(a.client_phone_snapshot)}
                      </a>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {a.status === "pending" && (
                      <DangerForm
                        action={changeAppointmentStatus}
                        confirmMessage="Confirmar este agendamento?"
                      >
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="status" value="confirmed" />
                        <button className="rounded-md bg-emerald-600 px-3 py-2 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-white hover:bg-emerald-700">
                          Confirmar
                        </button>
                      </DangerForm>
                    )}
                    {(a.status === "pending" || a.status === "confirmed") && (
                      <DangerForm
                        action={changeAppointmentStatus}
                        confirmMessage="Marcar como concluído?"
                      >
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="status" value="completed" />
                        <button className="rounded-md bg-sky-600 px-3 py-2 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-white hover:bg-sky-700">
                          Concluir
                        </button>
                      </DangerForm>
                    )}
                    <Link
                      href={`/admin/agendamentos?editar=${a.id}&from=${from}${to ? `&to=${to}` : ""}`}
                      className="flex items-center gap-1.5 rounded-md border border-ink/15 px-3 py-2 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink/70 hover:border-bronze-deep hover:text-bronze-deep"
                    >
                      <Pencil size={12} /> Editar
                    </Link>
                    <DangerForm
                      action={removeAppointment}
                      confirmMessage={`Excluir definitivamente o agendamento de ${a.client_name_snapshot}?`}
                    >
                      <input type="hidden" name="id" value={a.id} />
                      <button
                        aria-label="Excluir agendamento"
                        className="flex items-center gap-1.5 rounded-md border border-ink/15 px-3 py-2 text-[0.6rem] font-bold uppercase tracking-[0.1em] text-ink/55 hover:border-red-400 hover:text-red-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    </DangerForm>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-4 text-xs text-ink/50">
        Agendamentos cancelados liberam o horário automaticamente. Mostrando{" "}
        {appointments.length} registro(s) entre {formatDateBR(from)}{" "}
        {to ? `e ${formatDateBR(to)}` : ""}.
      </p>
    </>
  );
}
