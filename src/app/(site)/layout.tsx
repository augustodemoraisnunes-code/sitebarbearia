import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import WhatsAppButton from "@/components/site/WhatsAppButton";
import { getSettings, listServices } from "@/lib/queries";
import { ensureStorage } from "@/lib/storage";

/** O site precisa refletir imediatamente as alterações feitas no painel. */
export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await ensureStorage();
  const s = getSettings();
  const services = listServices();

  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer
        services={services}
        phone={s.phone}
        whatsapp={s.whatsapp}
        instagram={s.instagram}
        address={s.address}
        schedule={s.schedule_display}
        businessName={s.business_name}
      />
      <WhatsAppButton whatsapp={s.whatsapp} businessName={s.business_name} />
    </>
  );
}
