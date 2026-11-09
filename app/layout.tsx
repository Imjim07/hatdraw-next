import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BRAND } from "@/lib/config";
import { WeatherProvider } from "@/components/WeatherContext";
import Ambient from "@/components/Ambient";
import WeatherChip from "@/components/WeatherChip";

export const metadata: Metadata = {
  title: `${BRAND.name}: Secret Santa for friends, family & teams`,
  description:
    "Drop everyone's name in the hat. It secretly picks who gifts who this Christmas and sends each person a private link to unwrap their match.",
};

export const viewport: Viewport = { themeColor: "#0E1838" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* App Router root layout applies to every page; this Pages-Router rule does not apply */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,600&family=Manrope:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <WeatherProvider>
          <Ambient />
          {children}
          <WeatherChip />
        </WeatherProvider>
      </body>
    </html>
  );
}
