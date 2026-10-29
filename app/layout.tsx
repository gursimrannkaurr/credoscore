import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Sans, Newsreader } from "next/font/google";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteNav } from "@/components/site/site-nav";
import { modelMeta } from "@/lib/model-meta";
import { portfolio } from "@/lib/portfolio";

import "./globals.css";

const newsreader = Newsreader({ subsets: ["latin"], style: ["normal", "italic"], axes: ["opsz"], variable: "--font-newsreader", display: "swap" });
const instrument = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "CredoScore: Loan Default Risk Predictor", template: "%s · CredoScore" },
  description:
    "A credit risk tool built on the UCI German Credit data. It scores applicants with a calibrated gradient boosting model and explains every score factor by factor.",
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
    { label: "Model", value: `v${modelMeta.version}` },
    { label: "ROC-AUC", value: portfolio.metrics.roc_auc.toFixed(3) },
    { label: "KS", value: portfolio.metrics.ks_statistic.toFixed(3) },
    { label: "Brier", value: portfolio.metrics.brier_score.toFixed(3) },
    { label: "Sample", value: `${portfolio.total_applicants.toLocaleString("en-US")} · out-of-fold` },
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
