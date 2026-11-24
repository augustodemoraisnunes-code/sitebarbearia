import BookingFlow from "@/components/booking/BookingFlow";
import Reveal from "@/components/ui/Reveal";
import SectionHeading from "@/components/ui/SectionHeading";
import { getSettings, listServices } from "@/lib/queries";

/** Seção de agendamento da página inicial. */
export default function BookingSection() {
  const s = getSettings();
  const services = listServices();

  return (
    <section id="agendamento" className="section-y bg-ink">
      <div className="container-site">
        <SectionHeading
          kicker="Agendamento online"
          title="Reserve seu horário"
          subtitle="Escolha o serviço, a data e o horário. A reserva é confirmada na hora, sem espera e sem ligação."
        />

        <Reveal className="mt-14">
          <BookingFlow
            services={services}
            settings={{
              whatsapp: s.whatsapp,
              address: s.address,
              businessName: s.business_name,
              schedule: s.schedule_display,
            }}
          />
        </Reveal>
      </div>
    </section>
  );
}
