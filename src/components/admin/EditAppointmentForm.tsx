"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import { editAppointment } from "@/lib/actions/appointments";
import { APPOINTMENT_STATUS_LABEL, type Appointment, type Service } from "@/lib/types";

type Props = { appointment: Appointment; services: Service[] };

export default function EditAppointmentForm({ appointment, services }: Props) {
  const [date, setDate] = useState(appointment.appointment_date);
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(
      `/api/availability?date=${date}&service_id=${appointment.service_id}&exclude_id=${appointment.id}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          const list: string[] = Array.isArray(data.slots) ? data.slots : [];
          // mantém o horário atual mesmo que a API o devolva
          if (!list.includes(appointment.start_time)) list.push(appointment.start_time);
          setSlots(list.sort());
        }
      })
      .catch(() => !cancelled && setSlots([appointment.start_time]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [date, appointment.service_id, appointment.id, appointment.start_time]);

  return (
    <form
      action={async (fd) => {
        setPending(true);
        try {
          await editAppointment(fd);
        } finally {
          setPending(false);
        }
      }}
      className="rounded-lg border border-bronze/40 bg-white p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">
          Editar agendamento #{appointment.id}
        </h2>
        <a
          href="/admin/agendamentos"
          className="flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-[0.1em] text-ink/50 hover:text-ink"
        >
          <X size={13} /> Fechar
        </a>
      </div>

      <input type="hidden" name="id" value={appointment.id} />

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label !text-ink/60" htmlFor="e-service">
            Serviço
          </label>
          <select
            id="e-service"
            name="service_id"
            defaultValue={appointment.service_id ?? ""}
            className="field field-light !py-2.5 text-sm"
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.duration_minutes} min
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label !text-ink/60" htmlFor="e-date">
            Data
          </label>
          <input
            id="e-date"
            type="date"
            name="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="field field-light !py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="label !text-ink/60" htmlFor="e-time">
            Horário
          </label>
          <select
            id="e-time"
            name="start_time"
            defaultValue={appointment.start_time}
            className="field field-light !py-2.5 text-sm"
          >
            {loading && <option>Carregando…</option>}
            {slots.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label !text-ink/60" htmlFor="e-name">
            Cliente
          </label>
          <input
            id="e-name"
            name="client_name"
            defaultValue={appointment.client_name_snapshot}
            className="field field-light !py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="label !text-ink/60" htmlFor="e-phone">
            Telefone
          </label>
          <input
            id="e-phone"
            name="client_phone"
            defaultValue={appointment.client_phone_snapshot}
            className="field field-light !py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="label !text-ink/60" htmlFor="e-status">
            Status
          </label>
          <select
            id="e-status"
            name="status"
            defaultValue={appointment.status}
            className="field field-light !py-2.5 text-sm"
          >
            {Object.entries(APPOINTMENT_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label className="label !text-ink/60" htmlFor="e-notes">
            Observações
          </label>
          <textarea
            id="e-notes"
            name="notes"
            defaultValue={appointment.notes}
            className="field field-light min-h-20 resize-y text-sm"
            placeholder="Opcional"
          />
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn btn-bronze mt-5 !py-3">
        {pending ? (
          <>
            <Loader2 size={15} className="spin" /> Salvando…
          </>
        ) : (
          <>
            <Save size={15} /> Salvar alterações
          </>
        )}
      </button>
    </form>
  );
}
