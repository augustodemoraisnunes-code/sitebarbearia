"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-guard";
import { actionError, actionOk } from "@/lib/feedback";
import { deleteClient, updateClient } from "@/lib/queries";
import { runMutation } from "@/lib/storage";

export async function saveClient(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name) actionError("/admin/clientes", "Informe o nome do cliente.");
  if (phone.replace(/\D/g, "").length < 10) {
    actionError("/admin/clientes", "Informe um telefone válido com DDD.");
  }

  await runMutation(() => updateClient(id, { name, phone, notes }));
  revalidatePath("/admin/clientes");
  actionOk("/admin/clientes", "Cliente atualizado.");
}

export async function removeClient(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await runMutation(() => deleteClient(id));
  revalidatePath("/admin/clientes");
  actionOk("/admin/clientes", "Cliente excluído.");
}
