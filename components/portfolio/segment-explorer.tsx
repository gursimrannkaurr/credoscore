"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EMPLOYMENT_YEARS_LABEL, HOUSING_LABEL, JOB_TYPE_LABEL, PURPOSE_LABEL, formatPercent } from "@/lib/format";
import type { PortfolioResponse, SegmentRow } from "@/lib/types";

const SCALE_MAX = 0.6;

type SegmentKey = keyof PortfolioResponse["segments"];

const TABS: { key: SegmentKey; label: string; lookup: Record<string, string> }[] = [
  { key: "purpose", label: "Purpose", lookup: PURPOSE_LABEL },
  { key: "employment_years", label: "Employment", lookup: EMPLOYMENT_YEARS_LABEL },
  { key: "housing", label: "Housing", lookup: HOUSING_LABEL },
  { key: "job_type", label: "Job type", lookup: JOB_TYPE_LABEL },
];

function SegmentRowItem({ row, lookup, baseRate }: { row: SegmentRow; lookup: Record<string, string>; baseRate: number }) {
  const label = lookup[String(row.segment)] ?? String(row.segment);
  const observedPct = Math.min(row.default_rate / SCALE_MAX, 1) * 100;
  const predictedPct = Math.min(row.mean_predicted_pd / SCALE_MAX, 1) * 100;
  const basePct = Math.min(baseRate / SCALE_MAX, 1) * 100;
  const small = row.count < 25;

  return (
    <div className="grid gap-2 border-b border-hairline py-3 last:border-0 sm:grid-cols-[minmax(0,12rem)_1fr_5rem_5rem] sm:items-center sm:gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm">{label}</span>
        {small ? <span className="kicker !text-[10px] !tracking-[0.08em] text-band-medium">small sample</span> : null}
      </div>
      <div className="relative h-5 w-full">
        <span className="absolute left-0 top-1/2 block h-1.5 w-full -translate-y-1/2 rounded-full bg-paper-sunken" />
        <span
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-band-medium/80"
          style={{ width: `${observedPct}%` }}
        />
        <span
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
          style={{ left: `${predictedPct}%` }}
        />
        <span
          className="absolute top-0 h-full border-l border-dashed border-muted"
          style={{ left: `${basePct}%` }}
        />
      </div>
      <span className="num text-sm sm:text-right">{formatPercent(row.default_rate, 1)}</span>
      <span className="num text-sm text-muted-foreground sm:text-right">n={row.count}</span>
    </div>
  );
}

export function SegmentExplorer({ segments, baseRate }: { segments: PortfolioResponse["segments"]; baseRate: number }) {
  return (
    <Tabs defaultValue="purpose">
      <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
        Choose a grouping below. Bars show recorded default rates and dots show mean predicted risk on a 0–60% scale.
        The dashed line marks the overall dataset rate. Each row also gives the recorded rate and the number of applicants (n).
      </p>
      <TabsList>
        {TABS.map((t) => (
          <TabsTrigger key={t.key} value={t.key}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map((t) => {
        const rows = [...segments[t.key]].sort((a, b) => b.default_rate - a.default_rate);
        return (
          <TabsContent key={t.key} value={t.key}>
            {rows.map((row) => (
              <SegmentRowItem key={String(row.segment)} row={row} lookup={t.lookup} baseRate={baseRate} />
            ))}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
