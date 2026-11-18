import Link from "next/link";

const READ = [
  { href: "/", label: "Brief" },
  { href: "/assess", label: "Assess an applicant" },
];

export function SiteFooter() {
  return (
    <footer className="bg-forest text-paper">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="kicker !text-mint/70">CredoScore</p>
          <p className="mt-1 font-serif text-3xl leading-tight">
            Credit <span className="italic text-mint">Priority</span>
          </p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/70">
            A student project comparing Gradient Boosting, XGBoost and Random Forest predictions of a historical P1–P4 bank priority label. It does not predict future default or make lending decisions.
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
            Indian bank and CIBIL sample: 51,336 matched applicant records. The target is a historical priority class, not a repayment outcome.
          </p>
          <a href="https://github.com/rounak97/Credit-Risk-Modelling-Using-Machine-Learning" target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-mint underline underline-offset-4">
            Source repository ↗
          </a>
        </div>
      </div>
      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 font-mono text-[11px] uppercase tracking-[0.12em] text-paper/55 sm:px-6">
          <span>Three model families · P1–P4 priority classification</span>
          <span>Not for real lending decisions</span>
        </div>
      </div>
    </footer>
  );
}
