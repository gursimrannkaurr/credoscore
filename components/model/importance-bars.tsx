import { featureLabel } from "@/lib/format";
import type { FeatureImportanceRow } from "@/lib/types";

export function ImportanceBars({ rows }: { rows: FeatureImportanceRow[] }) {
  const sorted = [...rows].sort((a, b) => b.importance - a.importance);
  const max = sorted[0]?.importance ?? 1;

  return (
    <ol className="divide-y divide-hairline">
      {sorted.map((row, i) => (
        <li key={row.feature} className="flex items-center gap-4 py-3">
          <span className="num w-6 shrink-0 text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
          <span className="w-44 shrink-0 text-sm sm:w-52">{featureLabel(row.feature)}</span>
          <span className="relative flex-1">
            <span
              aria-hidden
              className="block h-2.5 rounded-sm bg-brand"
              style={{ width: `${(row.importance / max) * 100}%` }}
            />
          </span>
          <span className="num w-16 shrink-0 text-right text-sm text-muted-foreground">
            {(row.importance * 100).toFixed(1)}%
          </span>
        </li>
      ))}
    </ol>
  );
}
