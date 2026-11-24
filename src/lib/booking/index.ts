// Funções de alto nível do sistema de agendamento.
import { getDb } from "@/lib/db";
import {
  insertAppointment,
  listBlockingAppointments,
  listBusinessHours,
  listBreaks,
  listBlocks,
  numberSetting,
  getService,
  upsertClient,
} from "@/lib/queries";
import {
  getAvailableSlots,
  isSlotAvailable,
  type AvailabilityParams,
} from "@/lib/booking/availability";
import type { Appointment } from "@/lib/types";

export type BookingConfig = {
  interval: number;
  buffer: number;
  minNotice: number;
  maxDays: number;
};

export function getBookingConfig(): BookingConfig {
  return {
    interval: numberSetting("slot_interval_minutes", 15),
    buffer: numberSetting("buffer_minutes", 5),
    minNotice: numberSetting("min_notice_minutes", 60),
    maxDays: numberSetting("max_days_ahead", 60),
  };
}

/** Monta todos os parâmetros necessários para calcular a disponibilidade. */
export function buildAvailabilityParams(
  date: string,
  duration: number
): AvailabilityParams {
  const cfg = getBookingConfig();
  return {
    date,
    duration,
    hours: listBusinessHours(),
    breaks: listBreaks(),
    blocks: listBlocks(),
    appointments: listBlockingAppointments(date),
    interval: cfg.interval,
    buffer: cfg.buffer,
    minNotice: cfg.minNotice,
    maxDays: cfg.maxDays,
  };
}

export function availableSlotsFor(date: string, duration: number): string[] {
  return getAvailableSlots(buildAvailabilityParams(date, duration));
}

export class BookingError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export type CreateBookingInput = {
  service_id: number;
  client_name: string;
  client_phone: string;
  date: string;
  start_time: string;
  notes?: string;
};

/**
 * Cria um agendamento validando disponibilidade no backend, dentro de uma
 * transação, para impedir reservas duplicadas/sobrepostas mesmo com requisições
 * simultâneas.
 */
export function createBooking(input: CreateBookingInput): Appointment {
  const db = getDb();

  const service = getService(input.service_id);
  if (!service || !service.is_active) {
    throw new BookingError("Serviço inválido ou indisponível.");
  }

  const name = input.client_name.trim();
  const phone = input.client_phone.trim();
  if (name.length < 2) throw new BookingError("Informe seu nome completo.");
  if (phone.replace(/\D/g, "").length < 10) {
    throw new BookingError("Informe um telefone válido com DDD.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    throw new BookingError("Data inválida.");
  }
  if (!/^\d{2}:\d{2}$/.test(input.start_time)) {
    throw new BookingError("Horário inválido.");
  }

  const params = buildAvailabilityParams(input.date, service.duration_minutes);
  const ok = isSlotAvailable({ ...params, start_time: input.start_time });
  if (!ok) {
    throw new BookingError(
      "Este horário não está mais disponível. Escolha outro horário.",
      409
    );
  }

  db.exec("BEGIN IMMEDIATE");
  try {
    // Recalcula dentro da transação: se outro cliente reservou o mesmo
    // horário entre a consulta e a confirmação, a validação falha aqui.
    const fresh = buildAvailabilityParams(input.date, service.duration_minutes);
    const stillOk = isSlotAvailable({ ...fresh, start_time: input.start_time });
    if (!stillOk) {
      db.exec("ROLLBACK");
      throw new BookingError(
        "Este horário acabou de ser reservado. Escolha outro horário.",
        409
      );
    }

    const client = upsertClient(name, phone);
    const end_time = `${input.start_time}`; // calculado abaixo
    const [h, m] = input.start_time.split(":").map(Number);
    const endMin = h * 60 + m + service.duration_minutes;
    const end = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(
      endMin % 60
    ).padStart(2, "0")}`;
    void end_time;

    const appointment = insertAppointment({
      client_id: client.id,
      service_id: service.id,
      client_name: name,
      client_phone: phone,
      service_name: service.name,
      service_price: service.price,
      service_duration: service.duration_minutes,
      date: input.date,
      start_time: input.start_time,
      end_time: end,
      status: "pending",
      notes: (input.notes ?? "").trim(),
      source: "site",
    });

    db.exec("COMMIT");
    return appointment;
  } catch (err) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* já revertido */
    }
    if (err instanceof BookingError) throw err;
    throw new BookingError("Não foi possível concluir o agendamento.", 500);
  }
}
