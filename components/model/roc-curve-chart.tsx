"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AXIS_LINE, AXIS_TICK, GRID, pct, TooltipCard } from "@/components/charts/chart-kit";
import type { RocPoint } from "@/lib/types";

export function RocCurveChart({ points }: { points: RocPoint[] }) {
  const data = points.map((p) => ({ fpr: p.fpr, tpr: p.tpr }));

  return (
    <div className="aspect-square max-h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <CartesianGrid {...GRID} />
          <XAxis
            dataKey="fpr"
            type="number"
            domain={[0, 1]}
            tickFormatter={(v: number) => pct(v)}
            tick={AXIS_TICK}
            axisLine={AXIS_LINE}
            tickLine={false}
            label={{ value: "False positive rate", position: "insideBottom", offset: -4, fontSize: 11, fill: "var(--muted)" }}
          />
          <YAxis
            dataKey="tpr"
            type="number"
            domain={[0, 1]}
            tickFormatter={(v: number) => pct(v)}
            tick={AXIS_TICK}
            axisLine={AXIS_LINE}
            tickLine={false}
            width={44}
            label={{ value: "True positive rate", angle: -90, position: "insideLeft", fontSize: 11, fill: "var(--muted)" }}
          />
          <ReferenceLine segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} stroke="var(--hairline-strong)" strokeDasharray="4 4" />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as { fpr: number; tpr: number };
              return (
                <TooltipCard
                  rows={[
                    { label: "False positive rate", value: pct(p.fpr, 1) },
                    { label: "True positive rate", value: pct(p.tpr, 1) },
                  ]}
                />
              );
            }}
          />
          <Area type="monotone" dataKey="tpr" stroke="var(--accent)" strokeWidth={2} fill="var(--accent-soft)" isAnimationActive />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
