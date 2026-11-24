"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  Clock,
  Image as ImageIcon,
  LayoutGrid,
  ListChecks,
  LogOut,
  Scissors,
  Settings,
  Users,
  X,
} from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/agenda", label: "Agenda do dia", icon: CalendarDays },
  { href: "/admin/agenda/semana", label: "Agenda semanal", icon: CalendarRange },
  { href: "/admin/calendario", label: "Calendário", icon: LayoutGrid },
  { href: "/admin/agendamentos", label: "Agendamentos", icon: ListChecks },
  { href: "/admin/servicos", label: "Serviços", icon: Scissors },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/horarios", label: "Horários e bloqueios", icon: Clock },
  { href: "/admin/galeria", label: "Galeria e depoimentos", icon: ImageIcon },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav aria-label="Menu do painel" className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 px-6 py-6">
        <Link href="/" className="group">
          <span className="display-title block text-xl text-white">
            Casa Navalha
          </span>
          <span className="mt-1 block text-[0.55rem] font-semibold uppercase tracking-[0.3em] text-bronze">
            Painel administrativo
          </span>
        </Link>
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-white/15 text-mist lg:hidden"
        >
          <X size={18} />
        </button>
      </div>

      <ul className="flex-1 overflow-y-auto px-3 pb-4">
        {ITEMS.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className={`mb-1 flex items-center gap-3 rounded-md px-4 py-3 text-[0.78rem] font-medium tracking-wide transition-colors ${
                  active
                    ? "bg-bronze/15 text-bronze"
                    : "text-mist/85 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon size={17} strokeWidth={1.7} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-white/8 p-3">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-[0.78rem] font-medium text-mist/85 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut size={17} strokeWidth={1.7} />
            Sair do painel
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu do painel"
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-md bg-ink text-bronze shadow-md lg:hidden"
      >
        <ChevronLeft size={20} className="rotate-180" />
      </button>

      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 bg-ink lg:block">
        {nav}
      </aside>

      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          open ? "" : "pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        <div
          onClick={() => setOpen(false)}
          className={`absolute inset-0 bg-ink/70 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-72 bg-ink shadow-2xl transition-transform duration-300 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {nav}
        </aside>
      </div>
    </>
  );
}
