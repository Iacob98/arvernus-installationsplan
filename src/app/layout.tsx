import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arvernus Installationsplan",
  description:
    "CRM und Installationsplaner für Wärmepumpen-Projekte von Arvernus Meisterbetrieb.",
  applicationName: "Arvernus Installationsplan",
  appleWebApp: {
    capable: true,
    title: "Arvernus",
    statusBarStyle: "black-translucent",
  },
  // Icons resolve via Next.js file-based convention from src/app/icon.png
  // and src/app/apple-icon.png — manual icon links are intentionally omitted
  // so the file-based ones (highest priority) always win on iOS.
  formatDetection: {
    telephone: true,
    email: true,
    address: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={`${geist.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
