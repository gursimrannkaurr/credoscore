"use client";

import { CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis, ZAxis } from "recharts";

import { AXIS_LINE, AXIS_TICK, GRID, pct, TooltipCard } from "@/components/charts/chart-kit";
import type { CalibrationBin } from "@/lib/types";

export function CalibrationChart({ bins }: { bins: CalibrationBin[] }) {
  const data = bins.map((b) => ({
    predicted: b.mean_predicted,
    observed: b.observed_rate,
    count: b.count,
  }));

  return (
    <div className="aspect-square max-h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid {...GRID} />
          <XAxis
            dataKey="predicted"
            type="number"
            domain={[0, 1]}
            tickFormatter={(v: number) => pct(v)}
            tick={AXIS_TICK}
            axisLine={AXIS_LINE}
            tickLine={false}
            label={{ value: "Mean predicted risk", position: "insideBottom", offset: -4, fontSize: 11, fill: "var(--muted)" }}
          />
          <YAxis
            dataKey="observed"
            type="number"
            domain={[0, 1]}
            tickFormatter={(v: number) => pct(v)}
            tick={AXIS_TICK}
            axisLine={AXIS_LINE}
            tickLine={false}
            width={44}
            label={{ value: "Recorded default rate", angle: -90, position: "insideLeft", fontSize: 11, fill: "var(--muted)" }}
          />
          <ZAxis dataKey="count" range={[40, 400]} />
          <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="var(--hairline-strong)" strokeDasharray="4 4" />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as { predicted: number; observed: number; count: number };
              return (
                <TooltipCard
                  rows={[
                    { label: "Predicted", value: pct(p.predicted, 1) },
                    { label: "Observed", value: pct(p.observed, 1) },
                    { label: "Applicants", value: String(p.count) },
                  ]}
                />
              );
            }}
          />
          <Line type="linear" dataKey="observed" stroke="var(--accent)" strokeWidth={1.5} dot={false} isAnimationActive />
          <Scatter dataKey="observed" fill="var(--accent)" fillOpacity={0.85} stroke="var(--paper-raised)" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
