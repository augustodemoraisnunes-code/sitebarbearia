import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Montserrat, Playfair_Display } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/queries";

const bebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-playfair",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0A0A0B",
  width: "device-width",
  initialScale: 1,
};

export function generateMetadata(): Metadata {
  const s = getSettings();
  const name = s.business_name || "Casa Navalha";
  return {
    metadataBase: new URL("https://casanavalha.com.br"),
    title: {
      default: `${name} — Barbearia Premium | Agendamento Online`,
      template: `%s | ${name}`,
    },
    description:
      "Barbearia premium com cortes personalizados, barba e experiência completa. Agende seu horário online em poucos cliques.",
    keywords: [
      "barbearia",
      "corte de cabelo",
      "barba",
      "agendamento online",
      "fade",
      "degradê",
    ],
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: name,
      title: `${name} — Barbearia Premium`,
      description:
        "Estilo, precisão e personalidade. Agende seu horário online.",
    },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const s = getSettings();
  const name = s.business_name || "Casa Navalha";
  const phone = s.phone || "";
  const address = s.address || "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name,
    description:
      "Barbearia premium com cortes personalizados, barba e agendamento online.",
    telephone: phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: address,
      addressLocality: "São Paulo",
      addressRegion: "SP",
      addressCountry: "BR",
    },
    openingHours: s.schedule_display || undefined,
    priceRange: "$$",
  };

  return (
    <html lang="pt-BR">
      <body
        className={`${bebas.variable} ${playfair.variable} ${montserrat.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
