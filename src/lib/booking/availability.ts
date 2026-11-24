// Motor de disponibilidade: calcula os horários reais considerando expediente,
// pausas, bloqueios, agendamentos existentes, intervalo entre atendimentos,
// antecedência mínima e limite de dias futuros.
import type {
  Appointment,
  BlockedSlot,
  BusinessBreak,
  BusinessHour,
} from "@/lib/types";

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function toHHMM(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function addMinutes(hhmm: string, minutes: number): string {
  return toHHMM(toMinutes(hhmm) + minutes);
}

export type Segment = { start: number; end: number };

export type AvailabilityParams = {
  date: string; // YYYY-MM-DD
  duration: number; // minutos do serviço
  hours: BusinessHour[];
  breaks: BusinessBreak[];
  blocks: BlockedSlot[];
  /** Apenas os agendamentos que ocupam horário (pendentes/confirmados). */
  appointments?: Appointment[];
  interval: number; // passo da grade de horários (min)
  buffer: number; // intervalo entre atendimentos (min)
  minNotice: number; // antecedência mínima (min)
  maxDays: number; // limite de dias futuros
  now?: Date;
};

export function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00`);
}

export function todayISO(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function shiftDate(date: string, days: number): string {
  const d = parseDate(date);
  d.setDate(d.getDate() + days);
  return todayISO(d);
}

export function hoursForDate(date: string, hours: BusinessHour[]): BusinessHour | null {
  const weekday = parseDate(date).getDay();
  return hours.find((h) => h.weekday === weekday) ?? null;
}

/** Janelas abertas do dia, já descontando pausas e bloqueios. */
export function daySegments(params: Pick<AvailabilityParams, "date" | "hours" | "breaks" | "blocks">): Segment[] {
  const { date, hours, breaks, blocks } = params;
  const hour = hoursForDate(date, hours);
  if (!hour || !hour.is_open) return [];

  const dayStart = toMinutes(hour.opening_time);
  const dayEnd = toMinutes(hour.closing_time);
  if (dayEnd <= dayStart) return [];

  let segments: Segment[] = [{ start: dayStart, end: dayEnd }];

  // Pausas do dia da semana
  breaks
    .filter((b) => b.weekday === parseDate(date).getDay())
    .forEach((b) => {
      segments = subtract(segments, {
        start: toMinutes(b.start_time),
        end: toMinutes(b.end_time),
      });
    });

  // Bloqueios manuais (podem cruzar a meia-noite)
  const weekday = parseDate(date).getDay();
  void weekday;
  blocks.forEach((blk) => {
    const [bsDate, bsTime] = blk.start_datetime.split("T");
    const [beDate, beTime] = blk.end_datetime.split("T");
    let start: number;
    let end: number;
    if (bsDate > date) return;
    if (beDate < date) return;
    start = bsDate < date ? 0 : toMinutes(bsTime || "00:00");
    end = beDate > date ? 1440 : toMinutes(beTime || "00:00");
    segments = subtract(segments, { start, end });
  });

  return segments.filter((s) => s.end > s.start);
}

function subtract(segments: Segment[], cut: Segment): Segment[] {
  const out: Segment[] = [];
  segments.forEach((s) => {
    if (cut.end <= s.start || cut.start >= s.end) {
      out.push(s);
      return;
    }
    if (cut.start > s.start) out.push({ start: s.start, end: cut.start });
    if (cut.end < s.end) out.push({ start: cut.end, end: s.end });
  });
  return out;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function isPastDate(date: string, now = new Date()): boolean {
  return date < todayISO(now);
}

/** Gera os horários disponíveis para uma data/serviço. */
export function getAvailableSlots(params: AvailabilityParams): string[] {
  const { date, duration, appointments, interval, buffer, minNotice, maxDays, now = new Date() } = params;

  if (isPastDate(date, now)) return [];
  const today = todayISO(now);
  if (maxDays > 0 && date > shiftDate(today, maxDays)) return [];

  const segments = daySegments(params);
  if (!segments.length || duration <= 0) return [];

  // Horário mais cedo permitido (data de hoje + antecedência mínima)
  let earliest = 0;
  if (date === today) {
    const nowMin = now.getHours() * 60 + now.getMinutes();
    earliest = nowMin + minNotice;
  }

  const busy = (appointments ?? [])
    .filter((a) => a.status === "pending" || a.status === "confirmed")
    .map((a) => ({
      start: toMinutes(a.start_time) - buffer,
      end: toMinutes(a.end_time) + buffer,
    }));

  const step = Math.max(5, interval || 15);
  const slots = new Set<string>();

  segments.forEach((seg) => {
    for (let start = seg.start; start + duration <= seg.end; start += step) {
      if (start < earliest) continue;
      const end = start + duration;
      const conflict = busy.some((b) => overlaps(start, end, b.start, b.end));
      if (!conflict) slots.add(toHHMM(start));
    }
  });

  return Array.from(slots).sort();
}

/** Indica se a data tem algum horário livre (usado no calendário). */
export function dayHasAvailability(params: AvailabilityParams): boolean {
  return getAvailableSlots(params).length > 0;
}

/** Mapa de disponibilidade de um mês inteiro: { 'YYYY-MM-DD': true/false }. */
export function monthAvailability(
  year: number,
  month: number, // 1-12
  base: Omit<AvailabilityParams, "date">,
  loadAppointments?: (date: string) => Appointment[]
): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  const lastDay = new Date(year, month, 0).getDate();
  for (let d = 1; d <= lastDay; d++) {
    const date = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    out[date] = dayHasAvailability({
      ...base,
      date,
      appointments: loadAppointments ? loadAppointments(date) : base.appointments,
    });
  }
  return out;
}

/** Valida se um horário específico pode ser reservado. */
export function isSlotAvailable(
  params: AvailabilityParams & { start_time: string }
): boolean {
  const slots = getAvailableSlots(params);
  return slots.includes(params.start_time);
}
