"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-guard";
import { buildAvailabilityParams } from "@/lib/booking";
import { getAvailableSlots } from "@/lib/booking/availability";
import { actionError, actionOk } from "@/lib/feedback";
import {
  deleteAppointment,
  getAppointment,
  getService,
  insertAppointment,
  listAppointments,
  updateAppointment,
  updateAppointmentStatus,
  upsertClient,
} from "@/lib/queries";
import type { AppointmentStatus } from "@/lib/types";
import { getDb } from "@/lib/db";

function refresh() {
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function createManualAppointment(formData: FormData) {
  await requireAdmin();

  const serviceId = Number(formData.get("service_id"));
  const date = String(formData.get("date") ?? "");
  const start = String(formData.get("start_time") ?? "");
  const name = String(formData.get("client_name") ?? "").trim();
  const phone = String(formData.get("client_phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "");
  const status = String(formData.get("status") ?? "confirmed") as AppointmentStatus;

  const service = getService(serviceId);
  if (!service) actionError("/admin/agendamentos", "Serviço inválido.");

  const [h, m] = start.split(":").map(Number);
  const endMin = h * 60 + m + service.duration_minutes;
  const end = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(
    endMin % 60
  ).padStart(2, "0")}`;

  const params = buildAvailabilityParams(date, service.duration_minutes);
  const slots = getAvailableSlots(params);
  if (!slots.includes(start)) {
    actionError("/admin/agendamentos", "Horário indisponível para este serviço.");
  }

  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const client = upsertClient(name, phone);
    insertAppointment({
      client_id: client.id,
      service_id: service.id,
      client_name: name,
      client_phone: phone,
      service_name: service.name,
      service_price: service.price,
      service_duration: service.duration_minutes,
      date,
      start_time: start,
      end_time: end,
      status: status === "pending" ? "pending" : "confirmed",
      notes,
      source: "painel",
    });
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  refresh();
  actionOk("/admin/agendamentos", "Agendamento criado com sucesso.");
}

export async function changeAppointmentStatus(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as AppointmentStatus;
  const allowed: AppointmentStatus[] = [
    "pending",
    "confirmed",
    "completed",
    "cancelled",
    "no_show",
  ];
  if (!allowed.includes(status)) actionError("/admin/agendamentos", "Status inválido.");
  updateAppointmentStatus(id, status);
  refresh();
}

export async function editAppointment(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const current = getAppointment(id);
  if (!current) actionError("/admin/agendamentos", "Agendamento não encontrado.");

  const date = String(formData.get("date") ?? current.appointment_date);
  const start = String(formData.get("start_time") ?? current.start_time);
  const name = String(formData.get("client_name") ?? current.client_name_snapshot).trim();
  const phone = String(formData.get("client_phone") ?? current.client_phone_snapshot).trim();
  const notes = String(formData.get("notes") ?? current.notes);
  const serviceId = Number(formData.get("service_id") || current.service_id || 0);

  const service = getService(serviceId);
  const duration = service?.duration_minutes ?? current.service_duration_snapshot;

  const [h, m] = start.split(":").map(Number);
  const endMin = h * 60 + m + duration;
  const end = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(
    endMin % 60
  ).padStart(2, "0")}`;

  // Valida disponibilidade ignorando o próprio agendamento
  const params = buildAvailabilityParams(date, duration);
  const others = (params.appointments ?? []).filter((a) => a.id !== id);
  const slots = getAvailableSlots({
    ...params,
    appointments: others,
  });
  if (!slots.includes(start)) {
    actionError("/admin/agendamentos", "Horário indisponível.");
  }

  updateAppointment(id, {
    client_name: name,
    client_phone: phone,
    date,
    start_time: start,
    end_time: end,
    notes,
    service_name: service?.name ?? current.service_name_snapshot,
    service_price: service?.price ?? current.service_price_snapshot,
    service_duration: duration,
  });

  refresh();
  actionOk("/admin/agendamentos", "Agendamento atualizado.");
}

export async function removeAppointment(formData: FormData) {
  await requireAdmin();
  deleteAppointment(Number(formData.get("id")));
  refresh();
  actionOk("/admin/agendamentos", "Agendamento removido.");
}

export async function listAppointmentsBetween(from: string, to: string) {
  await requireAdmin();
  return listAppointments({ from, to });
}
