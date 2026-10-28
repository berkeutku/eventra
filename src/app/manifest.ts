import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Eventra",
    short_name: "Eventra",
    description:
      "Etkinlik sonrası ortak yolculuk platformu. Portföy demosu, gerçek ödeme veya bilet entegrasyonu yoktur.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    lang: "tr",
    background_color: "#fff8f0",
    theme_color: "#6c4dff",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}