import { Badge } from "@/components/ui/badge";
import { DECISION_TONE, decisionAt } from "@/lib/decision";
import { DECISION_LABEL, RISK_BAND_LABEL, formatPercent, formatScore } from "@/lib/format";
import type { PredictResponse } from "@/lib/types";

import { PdMeter } from "./pd-meter";

const TONE_CLASS: Record<"low" | "medium" | "high", string> = {
  low: "border-band-low text-band-low bg-band-low-soft",
  medium: "border-band-medium text-band-medium bg-band-medium-soft",
  high: "border-band-high text-band-high bg-band-high-soft",
};

export function RiskVerdict({ result, cutoff }: { result: PredictResponse; cutoff: number }) {
  const pd = result.probability_of_default;
  const decision = decisionAt(pd, cutoff);
  const tone = DECISION_TONE[decision];

  return (
    <article className="overflow-hidden rounded-xl border border-hairline bg-paper-raised">
      <div className="flex justify-between border-b border-hairline px-5 py-3">
        <p className="kicker">Risk slip</p>
        <p className="num text-[11px] text-muted-foreground">Model v{result.model_version}</p>
      </div>
      <div className="grid gap-6 p-5 sm:grid-cols-[1.3fr_1fr] sm:p-6">
        <div>
          <p className="kicker">Probability of default</p>
          <p className="num text-6xl tracking-tight md:text-7xl">{formatPercent(pd, 1)}</p>
          <Badge variant={result.risk_band} className="mt-2">{RISK_BAND_LABEL[result.risk_band]}</Badge>
          <PdMeter pd={pd} cutoff={cutoff} />
        </div>
        <div className="space-y-5">
          <div className={`rounded-lg border-2 px-4 py-3 text-center ${TONE_CLASS[tone]}`}>
            <p className="kicker">Recommendation</p>
            <p className="font-serif text-2xl">{DECISION_LABEL[decision]}</p>
            <p className="text-xs">at a {(cutoff * 100).toFixed(0)}% cutoff</p>
          </div>
          <div>
            <p className="kicker">Score</p>
            <p className="num text-4xl">
              {formatScore(result.score)} <span className="text-base text-muted-foreground">/ 850</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">300 is the riskiest and 850 the safest.</p>
          </div>
        </div>
      </div>
    </article>
  );
}
