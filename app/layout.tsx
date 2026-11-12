import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BRAND } from "@/lib/config";
import { WeatherProvider } from "@/components/WeatherContext";
import Ambient from "@/components/Ambient";
import WeatherChip from "@/components/WeatherChip";
import TransitionLayer from "@/components/TransitionLayer";

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
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,500;0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>
        <WeatherProvider>
          <Ambient />
          <TransitionLayer>{children}</TransitionLayer>
          <WeatherChip />
        </WeatherProvider>
      </body>
    </html>
  );
}
