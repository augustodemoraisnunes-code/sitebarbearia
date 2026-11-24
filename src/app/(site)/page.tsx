import Hero from "@/components/site/Hero";
import FeatureBar from "@/components/site/FeatureBar";
import ServicesSection from "@/components/site/ServicesSection";
import CutsGallery from "@/components/site/CutsGallery";
import BarberAbout from "@/components/site/BarberAbout";
import ShopGallery from "@/components/site/ShopGallery";
import TestimonialsSection from "@/components/site/TestimonialsSection";
import BookingSection from "@/components/site/BookingSection";
import ContactSection from "@/components/site/ContactSection";
import {
  getSettings,
  listGallery,
  listServices,
  listTestimonials,
} from "@/lib/queries";

export default function HomePage() {
  const s = getSettings();
  const services = listServices();
  const gallery = listGallery();
  const barberPhotos = gallery.filter((g) => g.category === "barbeiro");
  const environment = gallery.filter((g) => g.category === "ambiente");
  const testimonials = listTestimonials();

  return (
    <>
      <Hero
        kicker={s.hero_kicker}
        title={s.hero_title}
        description={s.hero_description}
        image={s.hero_image}
        address={s.address}
        schedule={s.schedule_display}
      />

      <FeatureBar />

      <ServicesSection services={services} />

      <CutsGallery items={gallery} />

      <BarberAbout
        name={s.barber_name}
        role={s.barber_role}
        bio={s.barber_bio}
        years={s.barber_years}
        specialties={s.barber_specialties}
        image={s.about_image}
        gallery={barberPhotos}
      />

      <ShopGallery items={environment} cover={s.environment_cover} />

      <TestimonialsSection testimonials={testimonials} />

      <BookingSection />

      <ContactSection
        phone={s.phone}
        whatsapp={s.whatsapp}
        instagram={s.instagram}
        address={s.address}
        schedule={s.schedule_display}
        mapUrl={s.map_url}
        businessName={s.business_name}
      />
    </>
  );
}
