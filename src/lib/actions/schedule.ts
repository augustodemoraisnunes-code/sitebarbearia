"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-guard";
import { actionError, actionOk } from "@/lib/feedback";
import {
  addBlock,
  addBreak,
  deleteBlock,
  deleteBreak,
  updateBusinessHour,
} from "@/lib/queries";

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

export async function saveWorkingHours(formData: FormData) {
  await requireAdmin();

  for (const weekday of WEEKDAYS) {
    const open = formData.get(`open_${weekday}`) === "on";
    const opening = String(formData.get(`opening_${weekday}`) ?? "09:00");
    const closing = String(formData.get(`closing_${weekday}`) ?? "19:00");
    if (open && closing <= opening) {
      actionError(
        "/admin/horarios",
        "O horário de fechamento deve ser depois da abertura."
      );
    }
    updateBusinessHour(weekday, {
      is_open: open,
      opening_time: opening,
      closing_time: closing,
    });
  }

  revalidatePath("/admin/horarios");
  revalidatePath("/");
  actionOk("/admin/horarios", "Horários de funcionamento salvos.");
}

export async function addBreakAction(formData: FormData) {
  await requireAdmin();
  const weekday = Number(formData.get("weekday"));
  const start = String(formData.get("start_time") ?? "");
  const end = String(formData.get("end_time") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  if (!start || !end || end <= start) {
    actionError("/admin/horarios", "Intervalo de pausa inválido.");
  }
  if (!WEEKDAYS.includes(weekday)) actionError("/admin/horarios", "Dia inválido.");
  addBreak({ weekday, start_time: start, end_time: end, description });
  revalidatePath("/admin/horarios");
  revalidatePath("/");
  actionOk("/admin/horarios", "Pausa adicionada.");
}

export async function removeBreak(formData: FormData) {
  await requireAdmin();
  deleteBreak(Number(formData.get("id")));
  revalidatePath("/admin/horarios");
  revalidatePath("/");
  actionOk("/admin/horarios", "Pausa removida.");
}

export async function addBlockAction(formData: FormData) {
  await requireAdmin();
  const date = String(formData.get("date") ?? "");
  const start = String(formData.get("start_time") ?? "00:00");
  const end = String(formData.get("end_time") ?? "23:59");
  const allDay = formData.get("all_day") === "on";
  const reason = String(formData.get("reason") ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) actionError("/admin/horarios", "Data inválida.");

  const start_datetime = allDay ? `${date}T00:00` : `${date}T${start}`;
  const end_datetime = allDay ? `${date}T23:59` : `${date}T${end}`;
  if (end_datetime <= start_datetime) {
    actionError("/admin/horarios", "O fim do bloqueio deve ser depois do início.");
  }

  addBlock({ start_datetime, end_datetime, reason });
  revalidatePath("/admin/horarios");
  revalidatePath("/");
  actionOk("/admin/horarios", "Horário bloqueado.");
}

export async function removeBlock(formData: FormData) {
  await requireAdmin();
  deleteBlock(Number(formData.get("id")));
  revalidatePath("/admin/horarios");
  revalidatePath("/");
  actionOk("/admin/horarios", "Bloqueio removido.");
}
