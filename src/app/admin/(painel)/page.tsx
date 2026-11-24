import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Scissors,
  UserCheck,
  XCircle,
} from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import { FlashMessages, getFlash } from "@/components/admin/Flash";
import { availableSlotsFor } from "@/lib/booking";
import { todayISO } from "@/lib/booking/availability";
import {
  listAppointments,
  listAppointmentsByDate,
  listServices,
} from "@/lib/queries";
import { formatBRL, formatDateBR } from "@/lib/format";
import type { AppointmentStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string; ok?: string }>;
}) {
  const { err, ok } = getFlash(await searchParams);
  const today = todayISO();
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const allToday = listAppointments({ from: today, to: today });
  const activeToday = listAppointmentsByDate(today);
  const services = listServices();
  const minDuration =
    services.length > 0
      ? Math.min(...services.map((s) => s.duration_minutes))
      : 30;

  const freeSlots = availableSlotsFor(today, minDuration);
  const count = (status: AppointmentStatus) =>
    allToday.filter((a) => a.status === status).length;

  const nextAppointment =
    activeToday.find((a) => {
      const [h, m] = a.start_time.split(":").map(Number);
      return h * 60 + m >= nowMin;
    }) ?? null;

  const upcoming = listAppointments({ from: today, limit: 12 }).filter(
    (a) => a.status === "pending" || a.status === "confirmed"
  );

  const stats = [
    {
      label: "Agendamentos hoje",
      value: activeToday.length,
      icon: CalendarCheck,
      hint: formatDateBR(today),
    },
    {
      label: "Confirmados",
      value: count("confirmed"),
      icon: CheckCircle2,
      hint: "clientes confirmados",
    },
    {
      label: "Pendentes",
      value: count("pending"),
      icon: UserCheck,
      hint: "aguardando confirmação",
    },
    {
      label: "Horários livres",
      value: freeSlots.length,
      icon: Clock,
      hint: `com serviços de ${minDuration} min`,
    },
    {
      label: "Concluídos",
      value: count("completed"),
      icon: Scissors,
      hint: "realizados hoje",
    },
    {
      label: "Cancelados",
      value: count("cancelled") + count("no_show"),
      icon: XCircle,
      hint: "cancelados / faltas",
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Visão geral da sua operação de hoje."
        actions={
          <>
            <Link href="/admin/agendamentos" className="btn btn-bronze !py-3">
              Novo agendamento
            </Link>
            <Link href="/admin/agenda" className="btn btn-ghost-dark !py-3">
              Ver agenda
            </Link>
          </>
        }
      />

      <FlashMessages err={err} ok={ok} />

      {/* Próximo cliente */}
      <div className="mb-8 rounded-lg border border-bronze/40 bg-white p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-bronze-deep">
              Próximo cliente
            </p>
            {nextAppointment ? (
              <>
                <p className="display-title mt-2 text-3xl text-ink">
                  {nextAppointment.start_time} — {nextAppointment.end_time}
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {nextAppointment.client_name_snapshot}
                </p>
                <p className="mt-1 text-sm text-ink/60">
                  {nextAppointment.service_name_snapshot} ·{" "}
                  {formatBRL(nextAppointment.service_price_snapshot)} ·{" "}
                  {nextAppointment.service_duration_snapshot} min
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-ink/60">
                Nenhum cliente para os próximos horários de hoje.
              </p>
            )}
          </div>

          <div className="rounded-md bg-cream px-5 py-4 text-center">
            <p className="display-title text-4xl text-bronze-deep">
              {freeSlots.length}
            </p>
            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-ink/55">
              horários livres hoje
            </p>
            <p className="mt-2 text-[0.65rem] text-ink/45">
              {freeSlots.slice(0, 4).join(" · ") || "sem disponibilidade"}
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-ink/8 bg-white p-5">
            <s.icon size={18} className="text-bronze-deep" />
            <p className="display-title mt-3 text-3xl text-ink">{s.value}</p>
            <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-ink/70">
              {s.label}
            </p>
            <p className="mt-1 text-[0.68rem] text-ink/45">{s.hint}</p>
          </div>
        ))}
      </div>

      {/* Próximos agendamentos */}
      <div className="mt-8 rounded-lg border border-ink/8 bg-white">
        <div className="flex items-center justify-between border-b border-ink/8 px-6 py-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">
            Próximos agendamentos
          </h2>
          <Link
            href="/admin/agendamentos"
            className="flex items-center gap-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-bronze-deep hover:text-ink"
          >
            Ver todos <ArrowRight size={13} />
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-ink/55">
            Nenhum agendamento futuro.{" "}
            <Link href="/admin/agendamentos" className="text-bronze-deep underline">
              Criar agendamento
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-ink/6">
            {upcoming.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
              >
                <div className="flex items-center gap-4">
                  <span className="display-title w-24 text-lg text-bronze-deep">
                    {a.appointment_date === today ? "Hoje" : a.appointment_date.split("-").reverse().slice(0, 2).join("/")}{" "}
                    {a.start_time}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">
                      {a.client_name_snapshot}
                    </span>
                    <span className="block text-xs text-ink/55">
                      {a.service_name_snapshot} · {a.service_duration_snapshot} min
                    </span>
                  </span>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.12em] ${
                    a.status === "confirmed"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {STATUS_LABEL[a.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="mt-6 flex items-center gap-2 text-xs text-ink/50">
        <CalendarDays size={14} /> Dados atualizados em tempo real a partir do
        banco local.
      </p>
    </>
  );
}
