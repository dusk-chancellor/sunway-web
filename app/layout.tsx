import type { Metadata } from "next";
import { getLocale, getMessages } from "next-intl/server";
import { Providers } from "@/components/providers";
import "@/styles/globals.css";

// Fonts are loaded at runtime via <link> to Google Fonts (see <head> below)
// rather than next/font's build-time fetch. This keeps `next build` fully
// offline-capable (CI / air-gapped) while still serving the real brand fonts in
// the browser. The CSS variables fall back to a system stack if the network is
// unavailable. See DECISIONS.md.

export const metadata: Metadata = {
  title: { default: "Sunway — Online Store", template: "%s · Sunway" },
  description: "General-retail online store with local delivery across the region.",
  metadataBase: new URL("https://sunway.example"),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Sora:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-r-md focus:bg-navy focus:px-4 focus:py-2 focus:text-white">
          Skip to content
        </a>
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
