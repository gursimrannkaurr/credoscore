import Link from "next/link";

import { modelMeta } from "@/lib/model-meta";

const READ = [
  { href: "/assess", label: "Assess an applicant" },
  { href: "/portfolio", label: "The book" },
  { href: "/model", label: "Methodology" },
  { href: "/model#limitations", label: "Limitations" },
];

export function SiteFooter() {
  return (
    <footer className="bg-forest text-paper">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="kicker !text-mint/70">CredoScore</p>
          <p className="mt-1 font-serif text-3xl leading-tight">
            Loan Default <span className="italic text-mint">Risk</span>
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/70">
            A student project comparing Gradient Boosting, XGBoost and Random Forest estimates of loan-default risk.
            The main explanation uses Gradient Boosting. It is not meant for real lending decisions.
          </p>
        </div>
        <div className="md:col-span-3">
          <p className="kicker !text-mint/70">Read</p>
          <ul className="mt-4 space-y-2 text-sm">
            {READ.map((l) => (
              <li key={l.href}><Link href={l.href} className="text-paper/85 hover:text-mint">{l.label}</Link></li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-4">
          <p className="kicker !text-mint/70">Data</p>
          <p className="mt-4 text-sm leading-relaxed text-paper/75">
            UCI Statlog (German Credit Data): 1,000 applicants from one German bank, 1994, licensed CC BY 4.0.
          </p>
          <a href="https://archive.ics.uci.edu/dataset/144/statlog+german+credit+data" target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-mint underline underline-offset-4">
            Dataset page ↗
          </a>
        </div>
      </div>
      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 font-mono text-[11px] uppercase tracking-[0.12em] text-paper/55 sm:px-6">
          <span>Model v{modelMeta.version} · {modelMeta.trees} trees · Platt-calibrated</span>
          <span>Not for real lending decisions</span>
        </div>
      </div>
    </footer>
  );
}
