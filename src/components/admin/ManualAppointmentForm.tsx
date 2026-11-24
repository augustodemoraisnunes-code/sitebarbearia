"use client";

import { useEffect, useState } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { createManualAppointment } from "@/lib/actions/appointments";
import type { Service } from "@/lib/types";

type Props = { services: Service[] };

function todayISO() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(
    n.getDate()
  ).padStart(2, "0")}`;
}

export default function ManualAppointmentForm({ services }: Props) {
  const [serviceId, setServiceId] = useState<number>(services[0]?.id ?? 0);
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!serviceId || !date) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/availability?date=${date}&service_id=${serviceId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSlots(Array.isArray(data.slots) ? data.slots : []);
      })
      .catch(() => !cancelled && setSlots([]))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [serviceId, date]);

  return (
    <form
      action={async (fd) => {
        setPending(true);
        try {
          await createManualAppointment(fd);
        } finally {
          setPending(false);
        }
      }}
      className="rounded-lg border border-ink/8 bg-white p-6"
    >
      <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-ink">
        Criar agendamento manual
      </h2>
      <p className="mt-1 text-xs text-ink/55">
        Para clientes que preferem telefone ou chegada sem reserva prévia.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="label !text-ink/60" htmlFor="m-service">
            Serviço
          </label>
          <select
            id="m-service"
            name="service_id"
            value={serviceId}
            onChange={(e) => setServiceId(Number(e.target.value))}
            className="field field-light !py-2.5 text-sm"
            required
          >
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} · {s.duration_minutes} min · R$ {s.price}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label !text-ink/60" htmlFor="m-date">
            Data
          </label>
          <input
            id="m-date"
            type="date"
            name="date"
            value={date}
            min={todayISO()}
            onChange={(e) => setDate(e.target.value)}
            className="field field-light !py-2.5 text-sm"
            required
          />
        </div>

        <div>
          <label className="label !text-ink/60" htmlFor="m-time">
            Horário
          </label>
          <select
            id="m-time"
            name="start_time"
            className="field field-light !py-2.5 text-sm"
            required
            defaultValue=""
          >
            <option value="" disabled>
              {loading ? "Carregando…" : "Selecione"}
            </option>
            {slots.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {!loading && slots.length === 0 && (
            <p className="mt-1 text-xs text-ink/50">
              Nenhum horário livre nesta data.
            </p>
          )}
        </div>

        <div>
          <label className="label !text-ink/60" htmlFor="m-name">
            Nome do cliente
          </label>
          <input
            id="m-name"
            name="client_name"
            className="field field-light !py-2.5 text-sm"
            placeholder="Nome completo"
            required
          />
        </div>

        <div>
          <label className="label !text-ink/60" htmlFor="m-phone">
            Telefone
          </label>
          <input
            id="m-phone"
            name="client_phone"
            className="field field-light !py-2.5 text-sm"
            placeholder="(11) 99999-9999"
            inputMode="tel"
            required
          />
        </div>

        <div>
          <label className="label !text-ink/60" htmlFor="m-notes">
            Observações
          </label>
          <input
            id="m-notes"
            name="notes"
            className="field field-light !py-2.5 text-sm"
            placeholder="Opcional"
          />
        </div>
      </div>

      <input type="hidden" name="status" value="confirmed" />

      <button
        type="submit"
        disabled={pending || slots.length === 0}
        className="btn btn-bronze mt-5 !py-3"
      >
        {pending ? (
          <>
            <Loader2 size={15} className="spin" /> Salvando…
          </>
        ) : (
          <>
            <CalendarPlus size={15} /> Criar agendamento
          </>
        )}
      </button>
    </form>
  );
}
