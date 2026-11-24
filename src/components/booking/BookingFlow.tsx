"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Loader2,
  MapPin,
  MessageCircle,
  Scissors,
} from "lucide-react";
import BookingCalendar from "@/components/booking/BookingCalendar";
import TimeSlotSelector from "@/components/booking/TimeSlotSelector";
import { formatBRL, formatDateBR, whatsappLink } from "@/lib/format";
import type { Service } from "@/lib/types";

type Step = "service" | "schedule" | "data" | "review" | "done";

type Confirmation = {
  id: number;
  service: string;
  price: number;
  duration: number;
  date: string;
  start_time: string;
  end_time: string;
  client_name: string;
  client_phone: string;
};

type Props = {
  services: Service[];
  initialServiceId?: number;
  settings: {
    whatsapp: string;
    address: string;
    businessName: string;
    schedule: string;
  };
};

const STEP_LABELS: Record<Exclude<Step, "done">, string> = {
  service: "Serviço",
  schedule: "Data e horário",
  data: "Seus dados",
  review: "Confirmação",
};

function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function todayISO(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(
    n.getDate()
  ).padStart(2, "0")}`;
}

function maxDateISO(daysAhead: number): string {
  const n = new Date();
  n.setDate(n.getDate() + daysAhead);
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(
    n.getDate()
  ).padStart(2, "0")}`;
}

export default function BookingFlow({ services, initialServiceId, settings }: Props) {
  const [step, setStep] = useState<Step>(
    initialServiceId && services.some((s) => s.id === initialServiceId)
      ? "schedule"
      : "service"
  );
  const [serviceId, setServiceId] = useState<number | null>(
    initialServiceId && services.some((s) => s.id === initialServiceId)
      ? initialServiceId
      : null
  );
  const [month, setMonth] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() + 1 };
  });
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [loadingDays, setLoadingDays] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const service = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId]
  );

  const minDate = todayISO();
  const maxDate = maxDateISO(60);

  // Disponibilidade do mês (calendário)
  useEffect(() => {
    if (!service) {
      setAvailability({});
      return;
    }
    let cancelled = false;
    setLoadingDays(true);
    const m = `${month.year}-${String(month.month).padStart(2, "0")}`;
    fetch(`/api/availability?month=${m}&service_id=${service.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.days) setAvailability(data.days);
      })
      .catch(() => {
        if (!cancelled) setAvailability({});
      })
      .finally(() => {
        if (!cancelled) setLoadingDays(false);
      });
    return () => {
      cancelled = true;
    };
  }, [service, month]);

  // Horários da data escolhida
  useEffect(() => {
    if (!service || !date) {
      setSlots([]);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    fetch(`/api/availability?date=${date}&service_id=${service.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setSlots(Array.isArray(data.slots) ? data.slots : []);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [service, date]);

  const selectService = useCallback((id: number) => {
    setServiceId(id);
    setSlot(null);
    setStep("schedule");
  }, []);

  const selectDate = useCallback((iso: string) => {
    setDate(iso);
    setSlot(null);
  }, []);

  const phoneDigits = phone.replace(/\D/g, "");
  const canSubmitData = name.trim().length >= 2 && phoneDigits.length >= 10;

  async function submit() {
    if (!service || !date || !slot) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: service.id,
          client_name: name.trim(),
          client_phone: phone,
          date,
          start_time: slot,
          notes: notes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível concluir o agendamento.");
        if (res.status === 409) {
          setStep("schedule");
          setSlot(null);
        }
        return;
      }
      setConfirmation(data.appointment);
      setStep("done");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Falha de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setStep("service");
    setServiceId(null);
    setDate(null);
    setSlot(null);
    setSlots([]);
    setName("");
    setPhone("");
    setNotes("");
    setConfirmation(null);
    setError(null);
  }

  /* ------------------------- Confirmação ------------------------- */
  if (step === "done" && confirmation) {
    const message = `Olá! Acabei de agendar: ${confirmation.service} em ${formatDateBR(
      confirmation.date
    )} às ${confirmation.start_time}. Nome: ${confirmation.client_name}.`;

    return (
      <div className="rounded-lg border border-bronze/40 bg-charcoal p-6 sm:p-10">
        <div className="mx-auto max-w-xl text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-bronze/50 bg-bronze/10">
            <CheckCircle2 size={32} className="text-bronze" />
          </span>
          <h3 className="serif-title mt-6 text-2xl text-white md:text-3xl">
            Agendamento confirmado!
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-mist/85">
            Sua reserva foi registrada. Guarde os dados abaixo — você também
            pode reagendar ou cancelar pelo WhatsApp.
          </p>

          <dl className="mt-8 divide-y divide-white/8 rounded-lg border border-white/10 bg-ink/60 text-left">
            {[
              ["Cliente", confirmation.client_name],
              ["Serviço", confirmation.service],
              ["Data", formatDateBR(confirmation.date)],
              ["Horário", `${confirmation.start_time} — ${confirmation.end_time}`],
              ["Duração", `${confirmation.duration} min`],
              ["Preço", formatBRL(confirmation.price)],
              ["Telefone", confirmation.client_phone],
              ["Endereço", settings.address],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start justify-between gap-4 px-5 py-3.5">
                <dt className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-mist/60">
                  {label}
                </dt>
                <dd className="text-right text-sm text-white">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href={whatsappLink(settings.whatsapp, message)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-bronze flex-1"
            >
              <MessageCircle size={16} />
              Confirmar no WhatsApp
            </a>
            <button type="button" onClick={reset} className="btn btn-outline flex-1">
              Agendar outro horário
            </button>
          </div>

          <Link
            href="/"
            className="mt-6 inline-block text-xs uppercase tracking-[0.18em] text-mist/60 transition-colors hover:text-bronze"
          >
            ← Voltar ao site
          </Link>
        </div>
      </div>
    );
  }

  /* --------------------------- Fluxo --------------------------- */
  const progressSteps: Array<Exclude<Step, "done">> = [
    "service",
    "schedule",
    "data",
    "review",
  ];
  const currentIdx = progressSteps.indexOf(step as Exclude<Step, "done">);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="lg:col-span-7 xl:col-span-8">
        {/* Progresso */}
        <ol className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-2">
          {progressSteps.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${
                  i <= currentIdx
                    ? "border-bronze bg-bronze text-ink"
                    : "border-white/20 text-mist/60"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`text-[0.65rem] font-semibold uppercase tracking-[0.14em] ${
                  i <= currentIdx ? "text-white" : "text-mist/75"
                }`}
              >
                {STEP_LABELS[s]}
              </span>
              {i < progressSteps.length - 1 && (
                <span className="hidden h-px w-6 bg-white/15 sm:block" />
              )}
            </li>
          ))}
        </ol>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-md border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-200"
          >
            {error}
          </div>
        )}

        {/* Etapa 1 — serviço */}
        {step === "service" && (
          <div className="flex flex-col gap-3">
            <h2 className="serif-title text-2xl text-white">Escolha o serviço</h2>
            <p className="text-sm text-mist/75">
              Selecione o serviço desejado para ver preço e duração.
            </p>
            {services.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => selectService(s.id)}
                className={`group flex items-center justify-between gap-4 rounded-lg border p-5 text-left transition-all duration-200 ${
                  serviceId === s.id
                    ? "border-bronze bg-bronze/10"
                    : "border-white/10 bg-white/4 hover:border-bronze/70"
                }`}
              >
                <span className="flex items-start gap-4">
                  <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-bronze/40 text-bronze">
                    <Scissors size={18} strokeWidth={1.6} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-white">
                      {s.name}
                    </span>
                    <span className="mt-1 block text-xs text-mist/70">
                      {s.description}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="display-title block text-xl text-bronze">
                    {formatBRL(s.price)}
                  </span>
                  <span className="mt-1 flex items-center justify-end gap-1 text-[0.65rem] uppercase tracking-[0.1em] text-mist/70">
                    <Clock size={11} /> {s.duration_minutes} min
                  </span>
                </span>
              </button>
            ))}
            {services.length === 0 && (
              <p className="rounded-lg border border-dashed border-white/15 p-6 text-sm text-mist/70">
                Nenhum serviço disponível no momento.
              </p>
            )}
          </div>
        )}

        {/* Etapa 2 — data e horário */}
        {step === "schedule" && service && (
          <div>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="serif-title text-2xl text-white">
                  Escolha data e horário
                </h2>
                <p className="mt-1 text-sm text-mist/75">
                  {service.name} · {service.duration_minutes} min ·{" "}
                  {formatBRL(service.price)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep("service")}
                className="flex items-center gap-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-mist transition-colors hover:text-bronze"
              >
                <ChevronLeft size={14} /> Trocar serviço
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <BookingCalendar
                month={month}
                onMonthChange={setMonth}
                selected={date}
                onSelect={selectDate}
                availability={availability}
                minDate={minDate}
                maxDate={maxDate}
                loading={loadingDays}
              />
              <TimeSlotSelector
                slots={slots}
                selected={slot}
                onSelect={setSlot}
                loading={loadingSlots}
                dateLabel={date ? formatDateBR(date) : undefined}
              />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStep("service")}
                className="btn btn-outline self-start"
              >
                <ChevronLeft size={15} /> Voltar
              </button>
              <button
                type="button"
                disabled={!date || !slot}
                onClick={() => setStep("data")}
                className="btn btn-bronze"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Etapa 3 — dados */}
        {step === "data" && service && date && slot && (
          <div>
            <h2 className="serif-title text-2xl text-white">Seus dados</h2>
            <p className="mt-1 text-sm text-mist/75">
              Sem cadastro, sem senha. Apenas o essencial para confirmar sua
              reserva.
            </p>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className="label" htmlFor="bk-name">
                  Nome completo *
                </label>
                <input
                  id="bk-name"
                  className="field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  autoComplete="name"
                  required
                />
              </div>
              <div className="sm:col-span-1">
                <label className="label" htmlFor="bk-phone">
                  Telefone (WhatsApp) *
                </label>
                <input
                  id="bk-phone"
                  className="field"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  inputMode="tel"
                  autoComplete="tel"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="label" htmlFor="bk-notes">
                  Observações (opcional)
                </label>
                <textarea
                  id="bk-notes"
                  className="field min-h-28 resize-y"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Alguma preferência ou referência de corte?"
                  maxLength={400}
                />
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStep("schedule")}
                className="btn btn-outline self-start"
              >
                <ChevronLeft size={15} /> Voltar
              </button>
              <button
                type="button"
                disabled={!canSubmitData}
                onClick={() => setStep("review")}
                className="btn btn-bronze"
              >
                Revisar agendamento
              </button>
            </div>
          </div>
        )}

        {/* Etapa 4 — revisão */}
        {step === "review" && service && date && slot && (
          <div>
            <h2 className="serif-title text-2xl text-white">
              Revise seu agendamento
            </h2>
            <p className="mt-1 text-sm text-mist/75">
              Confira os dados antes de confirmar.
            </p>

            <dl className="mt-6 divide-y divide-white/8 rounded-lg border border-white/10 bg-white/4">
              {[
                ["Cliente", name.trim()],
                ["Telefone", phone],
                ["Serviço", service.name],
                ["Preço", formatBRL(service.price)],
                ["Duração", `${service.duration_minutes} min`],
                ["Data", formatDateBR(date)],
                ["Horário", `${slot} — ${addMinutes(slot, service.duration_minutes)}`],
                ["Observações", notes.trim() || "—"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-4 px-5 py-4"
                >
                  <dt className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-mist/60">
                    {label}
                  </dt>
                  <dd className="text-right text-sm text-white">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setStep("data")}
                className="btn btn-outline self-start"
              >
                <ChevronLeft size={15} /> Editar dados
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="btn btn-bronze"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="spin" /> Confirmando…
                  </>
                ) : (
                  <>
                    <CalendarCheck size={16} /> Confirmar agendamento
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Resumo lateral */}
      <aside className="lg:col-span-5 xl:col-span-4">
        <div className="sticky top-28 rounded-lg border border-white/10 bg-charcoal p-6">
          <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-bronze">
            Resumo
          </h3>

          <div className="mt-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs uppercase tracking-[0.12em] text-mist/60">
                Serviço
              </span>
              <span className="text-right text-sm text-white">
                {service ? service.name : "—"}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs uppercase tracking-[0.12em] text-mist/60">
                Data
              </span>
              <span className="text-right text-sm text-white">
                {date ? formatDateBR(date) : "—"}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs uppercase tracking-[0.12em] text-mist/60">
                Horário
              </span>
              <span className="text-right text-sm text-white">
                {slot
                  ? `${slot} — ${addMinutes(slot, service?.duration_minutes ?? 0)}`
                  : "—"}
              </span>
            </div>
            <div className="hairline h-px w-full" />
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.12em] text-mist/60">
                Total
              </span>
              <span className="display-title text-3xl text-bronze">
                {service ? formatBRL(service.price) : "—"}
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-md border border-white/8 bg-ink/60 p-4">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-mist/75">
              <MapPin size={14} className="mt-0.5 shrink-0 text-bronze" />
              {settings.address}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-mist/75">
              {settings.schedule}
            </p>
          </div>

          <p className="mt-4 text-[0.68rem] leading-relaxed text-mist/75">
            Precisa reagendar ou cancelar? Fale conosco pelo WhatsApp.
          </p>
        </div>
      </aside>
    </div>
  );
}

function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = (h || 0) * 60 + (m || 0) + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(
    total % 60
  ).padStart(2, "0")}`;
}
