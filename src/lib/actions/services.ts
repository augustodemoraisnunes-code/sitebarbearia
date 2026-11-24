"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-guard";
import { actionError, actionOk } from "@/lib/feedback";
import { createService, deleteService, updateService } from "@/lib/queries";

export async function saveService(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id") || 0);
  const data = {
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    price: Number(formData.get("price") ?? 0),
    duration_minutes: Math.max(5, Number(formData.get("duration_minutes") ?? 30)),
    image_url: String(formData.get("image_url") ?? "").trim(),
    is_active: formData.get("is_active") === "on",
    sort_order: Number(formData.get("sort_order") ?? 0),
  };
  if (!data.name) actionError("/admin/servicos", "Informe o nome do serviço.");
  if (!(data.price >= 0)) actionError("/admin/servicos", "Preço inválido.");
  if (!(data.duration_minutes > 0)) actionError("/admin/servicos", "Duração inválida.");

  if (id > 0) updateService(id, data);
  else createService(data);

  revalidatePath("/admin/servicos");
  revalidatePath("/");
  actionOk("/admin/servicos", "Serviço salvo.");
}

export async function removeService(formData: FormData) {
  await requireAdmin();
  deleteService(Number(formData.get("id")));
  revalidatePath("/admin/servicos");
  revalidatePath("/");
  actionOk("/admin/servicos", "Serviço excluído.");
}
