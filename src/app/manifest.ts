import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Arvernus Installationsplan",
    short_name: "Arvernus",
    description:
      "CRM und Installationsplaner für Wärmepumpen-Projekte von Arvernus Meisterbetrieb.",
    start_url: "/clients",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#1565C0",
    theme_color: "#1565C0",
    lang: "de",
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
