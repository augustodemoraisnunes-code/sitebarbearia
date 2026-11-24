import type { Metadata } from "next";
import BookingFlow from "@/components/booking/BookingFlow";
import SectionHeading from "@/components/ui/SectionHeading";
import { getSettings, listServices } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Agendamento online",
  description:
    "Escolha o serviço, a data e o horário e confirme seu agendamento em poucos passos.",
};

type Props = {
  searchParams: Promise<{ servico?: string }>;
};

export default async function BookingPage({ searchParams }: Props) {
  const params = await searchParams;
  const s = getSettings();
  const services = listServices();
  const initial = Number(params.servico);
  const initialServiceId =
    Number.isFinite(initial) && services.some((x) => x.id === initial)
      ? initial
      : undefined;

  return (
    <section className="section-y bg-ink pt-32">
      <div className="container-site">
        <SectionHeading
          kicker="Agendamento online"
          title="Seu horário, do seu jeito"
          subtitle="Poucas etapas, confirmação imediata e nenhum risco de horário duplicado."
        />

        <div className="mt-14">
          <BookingFlow
            services={services}
            initialServiceId={initialServiceId}
            settings={{
              whatsapp: s.whatsapp,
              address: s.address,
              businessName: s.business_name,
              schedule: s.schedule_display,
            }}
          />
        </div>
      </div>
    </section>
  );
}
