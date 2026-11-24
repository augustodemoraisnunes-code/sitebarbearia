"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-guard";
import { actionError, actionOk } from "@/lib/feedback";
import {
  addGallery,
  addTestimonial,
  deleteGallery,
  deleteTestimonial,
  updateGallery,
  updateTestimonial,
} from "@/lib/queries";

const GALLERY_PATH = "/admin/galeria";

export async function saveGalleryItem(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id") || 0);
  const image_url = String(formData.get("image_url") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "corte").trim();
  const description = String(formData.get("description") ?? "").trim();
  const is_featured = formData.get("is_featured") === "on";

  if (!image_url) actionError(GALLERY_PATH, "Envie ou informe a imagem.");
  if (!["corte", "ambiente", "barbeiro"].includes(category)) {
    actionError(GALLERY_PATH, "Categoria inválida.");
  }

  if (id > 0) updateGallery(id, { image_url, title, category, description, is_featured });
  else addGallery({ image_url, title, category, description, is_featured });

  revalidatePath(GALLERY_PATH);
  revalidatePath("/");
  actionOk(GALLERY_PATH, "Imagem salva.");
}

export async function removeGalleryItem(formData: FormData) {
  await requireAdmin();
  deleteGallery(Number(formData.get("id")));
  revalidatePath(GALLERY_PATH);
  revalidatePath("/");
  actionOk(GALLERY_PATH, "Imagem removida.");
}

export async function saveTestimonial(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id") || 0);
  const client_name = String(formData.get("client_name") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const rating = Math.min(5, Math.max(1, Number(formData.get("rating") ?? 5)));
  const image_url = String(formData.get("image_url") ?? "").trim();
  const is_active = formData.get("is_active") === "on";

  if (!client_name) actionError(GALLERY_PATH, "Informe o nome do cliente.");
  if (!content) actionError(GALLERY_PATH, "Escreva o comentário.");

  if (id > 0)
    updateTestimonial(id, { client_name, content, rating, image_url, is_active });
  else addTestimonial({ client_name, content, rating, image_url, is_active });

  revalidatePath(GALLERY_PATH);
  revalidatePath("/");
  actionOk(GALLERY_PATH, "Depoimento salvo.");
}

export async function removeTestimonial(formData: FormData) {
  await requireAdmin();
  deleteTestimonial(Number(formData.get("id")));
  revalidatePath(GALLERY_PATH);
  revalidatePath("/");
  actionOk(GALLERY_PATH, "Depoimento removido.");
}
