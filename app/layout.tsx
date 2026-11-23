import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BRAND } from "@/lib/config";
import { landing } from "@/lib/copy/landing";
import { common } from "@/lib/copy/common";
import { PALETTE, THEME_KEY } from "@/lib/palette";
import { gtmLoader } from "@/lib/analytics";
import { WeatherProvider } from "@/components/WeatherContext";
import Ambient from "@/components/Ambient";
import WeatherChip from "@/components/WeatherChip";
import TransitionLayer from "@/components/TransitionLayer";

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.url),
  title: landing.meta.title,
  description: landing.meta.description,
  applicationName: BRAND.name,
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: PALETTE.cloud },
    { media: "(prefers-color-scheme: dark)", color: PALETTE.ink },
  ],
};

// Runs before first paint so a saved choice never flashes the other theme. With no
// saved choice the CSS follows the device setting. A toggle sets data-theme on <html>
// and saves "light" or "dark" under this key.
const PRE_PAINT = `try{var t=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PRE_PAINT }} />
        {/* Google Tag Manager; skipped on private-link pages (see lib/analytics.ts) */}
        <script dangerouslySetInnerHTML={{ __html: gtmLoader() }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* App Router root layout applies to every page; this Pages-Router rule does not apply */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,500;0,600;0,700;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <WeatherProvider>
          <Ambient />
          <TransitionLayer label={common.loading}>{children}</TransitionLayer>
          <WeatherChip />
        </WeatherProvider>
      </body>
    </html>
  );
}
