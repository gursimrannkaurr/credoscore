import { Stat } from "@/components/editorial/stat";
import { formatPercent } from "@/lib/format";
import type { RiskBand } from "@/lib/types";
import { cn } from "@/lib/utils";

const ORDER: RiskBand[] = ["low", "medium", "high"];

const BAND_META: Record<RiskBand, { label: string; tone: "low" | "medium" | "high"; bg: string; note: string }> = {
  low: { label: "Low", tone: "low", bg: "bg-band-low", note: "PD below 15%" },
  medium: { label: "Medium", tone: "medium", bg: "bg-band-medium", note: "PD 15% to 35%" },
  high: { label: "High", tone: "high", bg: "bg-band-high", note: "PD 35% or more" },
};

export function BandSplit({
  bandCounts,
  total,
  baseDefaultRate,
}: {
  bandCounts: Record<RiskBand, number>;
  total: number;
  baseDefaultRate: number;
}) {
  return (
    <div>
      <div className="flex h-14 overflow-hidden rounded-lg">
        {ORDER.map((band) => {
          const count = bandCounts[band];
          const share = count / total;
          return (
            <div
              key={band}
              className={cn("flex items-center justify-center", BAND_META[band].bg)}
              style={{ width: `${share * 100}%` }}
            >
              {share >= 0.08 ? <span className="num text-sm text-paper">{formatPercent(share, 0)}</span> : null}
            </div>
          );
        })}
      </div>
      <dl className="mt-8 grid gap-6 sm:grid-cols-4">
        {ORDER.map((band) => {
          const count = bandCounts[band];
          const meta = BAND_META[band];
          return (
            <Stat
              key={band}
              label={meta.label}
              value={count.toLocaleString("en-US")}
              tone={meta.tone}
              note={`${formatPercent(count / total, 0)} of applicants · ${meta.note}`}
            />
          );
        })}
        <Stat label="Base default rate" value={formatPercent(baseDefaultRate, 1)} />
      </dl>
    </div>
  );
}
