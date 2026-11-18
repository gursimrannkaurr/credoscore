import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Sans, Newsreader } from "next/font/google";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";

import "./globals.css";

const newsreader = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], variable: "--font-newsreader", display: "swap" });
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "CredoScore: Indian Credit Profile Explorer", template: "%s · CredoScore" },
  description:
    "An educational multiclass credit-priority model comparison using an Indian bank and CIBIL dataset.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f2ea" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1512" },
  ],
};

const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const ticker = [
    { label: "Dataset", value: "Bank + CIBIL" },
    { label: "Rows", value: "51,336" },
    { label: "Task", value: "P1–P4 classification" },
    { label: "Training", value: "3 model families" },
  ];
  return (
    <html lang="en" suppressHydrationWarning className={`${newsreader.variable} ${instrument.variable} ${plexMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="antialiased">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-forest focus:px-3 focus:py-2 focus:text-mint">
          Skip to content
        </a>
        <div className="flex min-h-dvh flex-col">
          <SiteNav ticker={ticker} />
          <main id="main" className="flex-1">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
