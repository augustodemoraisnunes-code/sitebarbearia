import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireAdmin } from "@/lib/admin-guard";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function PainelLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-cream text-ink">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-ink/8 bg-cream/95 px-4 backdrop-blur lg:px-8 lg:pl-6">
            <div className="pl-14 lg:pl-0">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-bronze-deep">
                Painel administrativo
              </p>
              <p className="truncate text-sm font-semibold text-ink">
                Olá, {admin.name}
              </p>
            </div>
            <Link
              href="/"
              className="btn btn-ghost-dark !px-4 !py-2.5 text-[0.65rem]"
            >
              <ExternalLink size={14} />
              Ver site
            </Link>
          </header>

          <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
