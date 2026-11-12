import { reassuranceAdvice, riskReductionAdvice } from "@/lib/advice";
import { formatPercent } from "@/lib/format";
import type { CompareModelResult } from "@/lib/types";

// Pure presentation over the Gradient Boosting result the workbench already
// has in state. No new network call and no change to the trained decision
// boundary: the yes/no line below is exactly `probability_of_default <
// cutoff`, the same comparison the rest of the page already makes.
export function VerdictBanner({ result }: { result: CompareModelResult }) {
  const lowRisk = result.probability_of_default < result.cutoff;
  const contributions = result.contributions ?? [];

  const advice = lowRisk ? reassuranceAdvice(contributions) : riskReductionAdvice(contributions);

  return (
    <article
      className={
        lowRisk
          ? "overflow-hidden rounded-xl border-2 border-band-low bg-band-low-soft"
          : "overflow-hidden rounded-xl border-2 border-band-high bg-band-high-soft"
      }
    >
      <div className="p-5 sm:p-6">
        <p className={`kicker ${lowRisk ? "text-band-low" : "text-band-high"}`}>Verdict</p>
        <p className={`mt-1 font-serif text-3xl leading-tight sm:text-4xl ${lowRisk ? "text-band-low" : "text-band-high"}`}>
          {lowRisk ? "Yes, this application is low-risk" : "No, this application is high-risk"}
        </p>
        <p className="mt-2 text-sm text-ink-muted">
          Estimated probability of default is <span className="num text-ink">{formatPercent(result.probability_of_default, 1)}</span>, against a {(result.cutoff * 100).toFixed(0)}% cutoff.
        </p>
      </div>
      {advice.length ? (
        <div className="border-t border-hairline bg-paper-raised px-5 py-4 sm:px-6">
          <p className="kicker">{lowRisk ? "What's keeping this low-risk" : "What would make this lower-risk"}</p>
          <ul className="mt-2 space-y-1.5 text-sm text-ink">
            {advice.map((item) => (
              <li key={item.feature} className="flex gap-2">
                <span aria-hidden className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${lowRisk ? "bg-band-low" : "bg-band-high"}`} />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}
