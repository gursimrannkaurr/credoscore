import { Badge } from "@/components/ui/badge";
import type { BenchmarkEntry } from "@/lib/types";

const ROWS: { key: string; label: string; deployed?: boolean }[] = [
  { key: "logistic_regression", label: "Logistic regression" },
  { key: "random_forest", label: "Random forest" },
  { key: "gradient_boosting", label: "Gradient boosting (default settings)" },
  { key: "xgboost", label: "XGBoost" },
  { key: "gradient_boosting_tuned", label: "Gradient boosting, tuned", deployed: true },
];

const SCALE_MIN = 0.74;
const SCALE_MAX = 0.82;

function IntervalStrip({ entry }: { entry: BenchmarkEntry }) {
  const W = 200;
  const H = 28;
  const x = (v: number) => ((v - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * W;
  const mean = entry.roc_auc_mean;
  const std = entry.roc_auc_std ?? 0;
  const lo = Math.max(SCALE_MIN, mean - std);
  const hi = Math.min(SCALE_MAX, mean + std);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`ROC-AUC ${mean.toFixed(4)}${entry.roc_auc_std ? ` plus or minus ${entry.roc_auc_std.toFixed(4)}` : ""}`} className="h-7 w-[200px]">
      <line x1={0} x2={W} y1={H / 2} y2={H / 2} stroke="var(--hairline)" />
      {entry.roc_auc_std ? (
        <line x1={x(lo)} x2={x(hi)} y1={H / 2} y2={H / 2} stroke="var(--muted)" strokeWidth={2} />
      ) : null}
      <line x1={x(mean)} x2={x(mean)} y1={2} y2={H - 2} stroke="var(--accent)" strokeWidth={2} strokeDasharray={entry.roc_auc_std ? undefined : "3 3"} />
      <circle cx={x(mean)} cy={H / 2} r={3.5} fill="var(--accent)" />
    </svg>
  );
}

export function BenchmarkTable({ benchmark }: { benchmark: Record<string, BenchmarkEntry> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink text-left font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            <th className="py-3 pr-4">Model</th>
            <th className="py-3 pr-4">ROC-AUC (mean)</th>
            <th className="py-3 pr-4">± std</th>
            <th className="py-3 pr-4">PR-AUC</th>
            <th className="py-3">Interval (0.74 to 0.82)</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => {
            const entry = benchmark[row.key];
            if (!entry) return null;
            return (
              <tr key={row.key} className="border-b border-hairline">
                <td className="py-3 pr-4">
                  <span className="flex items-center gap-2">
                    {row.label}
                    {row.deployed ? <Badge variant="default">Deployed</Badge> : null}
                  </span>
                </td>
                <td className="num py-3 pr-4">{entry.roc_auc_mean.toFixed(4)}</td>
                <td className="num py-3 pr-4 text-muted-foreground">{entry.roc_auc_std ? `± ${entry.roc_auc_std.toFixed(4)}` : "n/a"}</td>
                <td className="num py-3 pr-4 text-muted-foreground">{entry.pr_auc_mean ? entry.pr_auc_mean.toFixed(4) : "n/a"}</td>
                <td className="py-3"><IntervalStrip entry={entry} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
