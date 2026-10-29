import { featureLabel, formatFeatureValue, formatPercent, formatSigned } from "@/lib/format";
import type { Contribution } from "@/lib/types";
import { Legend } from "@/components/editorial/legend";

export function ContributionWaterfall({ contributions, pd }: { contributions: Contribution[]; pd: number }) {
  const rows = [...contributions].sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const start = pd - contributions.reduce((s, c) => s + c.contribution, 0);
  const max = Math.max(...rows.map((r) => Math.abs(r.contribution)), 0.01);
  const up = rows.find((r) => r.contribution > 0);
  const down = rows.find((r) => r.contribution < 0);
  return (
    <section aria-labelledby="drivers-title" className="rounded-xl border border-hairline bg-paper-raised">
      <header className="border-b border-hairline px-5 py-4">
        <p className="kicker">Fig. A · Score drivers</p>
        <h2 id="drivers-title" className="mt-1 font-serif text-xl">What moved this score</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The model starts every applicant at <span className="num text-ink">{formatPercent(start, 1)}</span>, its average score. Each factor then pushes that number up or down. Here they add up to <span className="num text-ink">{formatPercent(pd, 1)}</span> exactly: this is the model&apos;s own decision path, not an estimate.
        </p>
        <div className="mt-3"><Legend items={[{ label: "Raises risk", color: "var(--band-high)", shape: "bar" }, { label: "Lowers risk", color: "var(--band-low)", shape: "bar" }]} /></div>
      </header>
      <ol className="divide-y divide-hairline">
        {rows.map((r) => {
          const w = (Math.abs(r.contribution) / max) * 50;
          const pos = r.contribution >= 0;
          return (
            <li key={r.feature} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_4.25rem] items-center gap-3 px-5 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm">{featureLabel(r.feature)}</p>
                <p className="truncate text-xs text-muted-foreground">{formatFeatureValue(r.feature, r.value)}</p>
              </div>
              <div className="relative h-5" aria-hidden>
                <div className="absolute inset-y-0 left-1/2 w-px bg-hairline-strong" />
                <div
                  className={pos ? "absolute inset-y-1 left-1/2 rounded-r-sm bg-band-high" : "absolute inset-y-1 right-1/2 rounded-l-sm bg-band-low"}
                  style={{ width: `${Math.max(w, 0.6)}%` }}
                />
              </div>
              <p className={`num text-right text-sm ${pos ? "text-band-high" : "text-band-low"}`}>{formatSigned(r.contribution)}</p>
            </li>
          );
        })}
      </ol>
      <footer className="space-y-1 border-t border-hairline px-5 py-4 text-sm text-ink-muted">
        {up ? <p>Biggest push up: <strong className="font-medium text-ink">{featureLabel(up.feature)}</strong> ({formatFeatureValue(up.feature, up.value)}), {formatSigned(up.contribution)}.</p> : null}
        {down ? <p>Biggest push down: <strong className="font-medium text-ink">{featureLabel(down.feature)}</strong> ({formatFeatureValue(down.feature, down.value)}), {formatSigned(down.contribution)}.</p> : null}
      </footer>
    </section>
  );
}
