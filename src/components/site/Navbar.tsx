"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarCheck, Menu, X } from "lucide-react";
import Logo from "@/components/ui/Logo";

const LINKS = [
  { label: "Início", hash: "#inicio" },
  { label: "Serviços", hash: "#servicos" },
  { label: "Cortes", hash: "#galeria" },
  { label: "Barbeiro", hash: "#barbeiro" },
  { label: "Agendamento", hash: "#agendamento" },
  { label: "Contato", hash: "#contato" },
];

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const hrefFor = (hash: string) => (isHome ? hash : `/${hash}`);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open
          ? "border-b border-white/8 bg-ink/95 backdrop-blur-md"
          : "border-b border-transparent bg-gradient-to-b from-ink/90 to-transparent"
      }`}
    >
      <nav
        aria-label="Navegação principal"
        className="container-site flex h-20 items-center justify-between gap-6"
      >
        <Logo />

        {/* Desktop */}
        <ul className="hidden items-center gap-8 lg:flex">
          {LINKS.map((l) => (
            <li key={l.hash}>
              <a
                href={hrefFor(l.hash)}
                className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-mist transition-colors duration-200 hover:text-bronze"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <Link
            href="/agendamento"
            className="btn btn-bronze hidden !px-5 !py-3 text-[0.68rem] lg:inline-flex"
          >
            <CalendarCheck size={15} strokeWidth={2.2} />
            Agendar horário
          </Link>

          <button
            type="button"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-md border border-white/15 text-white transition-colors hover:border-bronze hover:text-bronze lg:hidden"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile */}
      <div
        className={`overflow-hidden border-t border-white/8 bg-ink transition-[max-height,opacity] duration-300 lg:hidden ${
          open ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="container-site flex flex-col py-4">
          {LINKS.map((l) => (
            <li key={l.hash} className="border-b border-white/6 last:border-0">
              <a
                href={hrefFor(l.hash)}
                onClick={() => setOpen(false)}
                className="block py-4 text-sm font-medium uppercase tracking-[0.16em] text-mist transition-colors hover:text-bronze"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li className="pt-5">
            <Link
              href="/agendamento"
              onClick={() => setOpen(false)}
              className="btn btn-bronze w-full"
            >
              <CalendarCheck size={16} />
              Agendar horário
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}
