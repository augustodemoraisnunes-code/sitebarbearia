import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import type { Profile } from "@/lib/types";

/** Protege todas as rotas do painel administrativo. */
export async function requireAdmin(): Promise<Profile> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}
