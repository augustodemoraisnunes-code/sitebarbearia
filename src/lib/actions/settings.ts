"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-guard";
import { actionError, actionOk } from "@/lib/feedback";
import { hashPassword } from "@/lib/auth";
import {
  getProfileByEmail,
  setSettings,
  updateProfileName,
  updateProfilePassword,
} from "@/lib/queries";
import { runMutation } from "@/lib/storage";
import { verifyPassword } from "@/lib/password";

const PATH = "/admin/configuracoes";

const EDITABLE_KEYS = [
  "business_name",
  "tagline",
  "hero_kicker",
  "hero_title",
  "hero_description",
  "hero_image",
  "barber_name",
  "barber_role",
  "barber_bio",
  "barber_years",
  "barber_specialties",
  "about_image",
  "environment_cover",
  "phone",
  "whatsapp",
  "instagram",
  "address",
  "map_url",
  "schedule_display",
  "slot_interval_minutes",
  "buffer_minutes",
  "min_notice_minutes",
  "max_days_ahead",
] as const;

export async function saveWebsiteSettings(formData: FormData) {
  const admin = await requireAdmin();

  const data: Record<string, string> = {};
  for (const key of EDITABLE_KEYS) {
    const value = formData.get(key);
    if (value !== null) data[key] = String(value).trim();
  }

  const interval = Number(data.slot_interval_minutes || 15);
  const buffer = Number(data.buffer_minutes || 0);
  const notice = Number(data.min_notice_minutes || 0);
  const maxDays = Number(data.max_days_ahead || 60);

  if (!(interval >= 5 && interval <= 120)) {
    actionError(PATH, "Intervalo entre horários deve estar entre 5 e 120 min.");
  }
  if (!(buffer >= 0 && buffer <= 120)) {
    actionError(PATH, "Margem entre atendimentos deve estar entre 0 e 120 min.");
  }
  if (!(notice >= 0 && notice <= 7 * 24 * 60)) {
    actionError(PATH, "Antecedência mínima inválida.");
  }
  if (!(maxDays >= 1 && maxDays <= 365)) {
    actionError(PATH, "Limite de dias futuros deve estar entre 1 e 365.");
  }

  const name = String(formData.get("admin_name") ?? "").trim();

  await runMutation(() => {
    if (name && name !== admin.name) updateProfileName(admin.id, name);
    setSettings(data);
  });

  revalidatePath(PATH);
  revalidatePath("/");
  actionOk(PATH, "Configurações salvas.");
}

export async function changePassword(formData: FormData) {
  const admin = await requireAdmin();
  const current = String(formData.get("current_password") ?? "");
  const next = String(formData.get("new_password") ?? "");

  if (next.length < 8) {
    actionError(PATH, "A nova senha precisa ter pelo menos 8 caracteres.");
  }

  const profile = getProfileByEmail(admin.email);
  if (!profile || !verifyPassword(current, profile.password_hash)) {
    actionError(PATH, "Senha atual incorreta.");
  }

  const hashed = hashPassword(next);
  await runMutation(() => updateProfilePassword(admin.id, hashed));
  revalidatePath(PATH);
  actionOk(PATH, "Senha alterada com sucesso.");
}
