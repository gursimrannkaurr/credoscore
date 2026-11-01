import { Badge } from "@/components/ui/badge";
import { DECISION_LABEL, RISK_BAND_LABEL, formatPercent } from "@/lib/format";
import type { CompareModelResult, CompareResponse } from "@/lib/types";

const ROWS: { key: keyof Omit<CompareResponse, "cutoff">; label: string; deployed?: boolean }[] = [
  { key: "gradient_boosting", label: "Gradient Boosting", deployed: true },
  { key: "xgboost", label: "XGBoost" },
  { key: "random_forest", label: "Random Forest" },
];

function ModelRow({ label, deployed, result }: { label: string; deployed?: boolean; result: CompareModelResult }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-hairline py-3 first:border-t-0">
      <span className="flex items-center gap-2 text-sm">
        {label}
        {deployed ? <Badge variant="default">Deployed</Badge> : null}
      </span>
      <span className="flex items-center gap-3">
        <span className="num text-sm text-muted-foreground">{formatPercent(result.probability_of_default, 1)}</span>
        <Badge variant={result.risk_band}>{RISK_BAND_LABEL[result.risk_band]}</Badge>
        <span className="hidden text-sm sm:inline">{DECISION_LABEL[result.decision]}</span>
      </span>
    </div>
  );
}

export function ModelComparison({ compare }: { compare: CompareResponse }) {
  const bands = ROWS.map((r) => compare[r.key].risk_band);
  const decisions = ROWS.map((r) => compare[r.key].decision);
  const allAgree = bands.every((b) => b === bands[0]) && decisions.every((d) => d === decisions[0]);
  const summary = allAgree
    ? `All three models agree: ${RISK_BAND_LABEL[bands[0]].toLowerCase()}, ${DECISION_LABEL[decisions[0]].toLowerCase()}.`
    : "The three models don't all agree on this applicant.";

  return (
    <article className="overflow-hidden rounded-xl border border-hairline bg-paper-raised">
      <div className="border-b border-hairline px-5 py-3">
        <p className="kicker">Checked against two other models</p>
      </div>
      <div className="px-5 py-2 sm:px-6">
        {ROWS.map((row) => (
          <ModelRow key={row.key} label={row.label} deployed={row.deployed} result={compare[row.key]} />
        ))}
      </div>
      <div className="border-t border-hairline px-5 py-3 text-sm sm:px-6">{summary}</div>
    </article>
  );
}
