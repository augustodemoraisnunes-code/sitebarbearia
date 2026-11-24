import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://casanavalha.com.br";
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${base}/agendamento`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];
}
