import Link from "next/link";
import { AtSign, MapPin, MessageCircle, Clock } from "lucide-react";
import Logo from "@/components/ui/Logo";
import { whatsappLink } from "@/lib/format";
import type { Service } from "@/lib/types";

type Props = {
  services: Service[];
  phone: string;
  whatsapp: string;
  instagram: string;
  address: string;
  schedule: string;
  businessName: string;
};

const NAV = [
  { label: "Início", href: "/#inicio" },
  { label: "Serviços", href: "/#servicos" },
  { label: "Galeria", href: "/#galeria" },
  { label: "Barbeiro", href: "/#barbeiro" },
  { label: "Agendamento", href: "/agendamento" },
  { label: "Contato", href: "/#contato" },
];

export default function Footer({
  services,
  phone,
  whatsapp,
  instagram,
  address,
  schedule,
  businessName,
}: Props) {
  return (
    <footer className="border-t border-white/8 bg-ink pt-16">
      <div className="container-site grid grid-cols-1 gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <div>
          <Logo compact />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-mist/75">
            Barbearia premium dedicada a cortes personalizados, técnica e
            atendimento de alto nível.
          </p>
        </div>

        <nav aria-label="Navegação do rodapé">
          <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-white">
            Navegação
          </h3>
          <ul className="mt-5 flex flex-col gap-3">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-mist/75 transition-colors hover:text-bronze"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-white">
            Serviços
          </h3>
          <ul className="mt-5 flex flex-col gap-3">
            {services.slice(0, 6).map((s) => (
              <li key={s.id}>
                <Link
                  href={`/agendamento?servico=${s.id}`}
                  className="text-sm text-mist/75 transition-colors hover:text-bronze"
                >
                  {s.name}
                </Link>
              </li>
            ))}
            {services.length === 0 && (
              <li className="text-sm text-mist/60">Serviços em breve</li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-white">
            Contato
          </h3>
          <ul className="mt-5 flex flex-col gap-4 text-sm text-mist/75">
            <li>
              <a
                href={whatsappLink(whatsapp, `Olá! Vim pelo site da ${businessName}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 transition-colors hover:text-bronze"
              >
                <MessageCircle size={16} className="mt-0.5 shrink-0 text-bronze" />
                {phone}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <MapPin size={16} className="mt-0.5 shrink-0 text-bronze" />
              {address}
            </li>
            <li className="flex items-start gap-3">
              <Clock size={16} className="mt-0.5 shrink-0 text-bronze" />
              {schedule}
            </li>
            <li>
              <a
                href={instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 transition-colors hover:text-bronze"
              >
                <AtSign size={16} className="shrink-0 text-bronze" />
                Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/8">
        <div className="container-site flex flex-col items-center justify-between gap-3 py-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-mist/75">
            © {new Date().getFullYear()} {businessName}. Todos os direitos
            reservados.
          </p>
          <p className="text-xs uppercase tracking-[0.2em] text-mist/70">
            Estilo · Precisão · Personalidade
          </p>
        </div>
      </div>
    </footer>
  );
}
