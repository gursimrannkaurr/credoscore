"use client";

import { Bar, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AXIS_LINE, AXIS_TICK, GRID, TooltipCard } from "@/components/charts/chart-kit";
import type { DecileRow } from "@/lib/types";

interface ChartRow {
  decile: number;
  observed: number;
  predicted: number;
  rate: number;
}

function bandColor(rate: number): string {
  if (rate >= 0.35) return "var(--band-high)";
  if (rate >= 0.15) return "var(--band-medium)";
  return "var(--band-low)";
}

export function DecileChart({ deciles }: { deciles: DecileRow[] }) {
  const data: ChartRow[] = deciles.map((d) => ({
    decile: d.decile,
    observed: d.observed_default_rate * 100,
    predicted: d.mean_predicted_pd * 100,
    rate: d.observed_default_rate,
  }));

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID.stroke} strokeDasharray={GRID.strokeDasharray} />
          <XAxis dataKey="decile" tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
          <YAxis tickFormatter={(v: number) => `${v}%`} tick={AXIS_TICK} axisLine={AXIS_LINE} tickLine={false} />
          <Tooltip
            cursor={{ fill: "var(--hairline)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as ChartRow;
              return (
                <TooltipCard
                  title={`Decile ${row.decile}`}
                  rows={[
                    { label: "Observed", value: `${row.observed.toFixed(1)}%`, color: bandColor(row.rate) },
                    { label: "Predicted", value: `${row.predicted.toFixed(1)}%`, color: "var(--ink)" },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="observed" radius={[4, 4, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.decile} fill={bandColor(d.rate)} />
            ))}
          </Bar>
          <Line type="monotone" dataKey="predicted" stroke="var(--ink)" strokeWidth={2} dot={{ r: 3, fill: "var(--ink)" }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
