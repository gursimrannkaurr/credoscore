"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AXIS_LINE, AXIS_TICK, GRID, pct, TooltipCard } from "@/components/charts/chart-kit";
import { Legend } from "@/components/editorial/legend";
import { Stat } from "@/components/editorial/stat";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { formatPercent } from "@/lib/format";
import type { CutoffOutcome } from "@/lib/portfolio";

interface ChartRow {
  cutoff: number;
  approvalRate: number;
  badRate: number;
  costPerApplicant: number;
}

export function CutoffExplorer({
  outcomes,
  deployed,
  cheapest,
  n,
}: {
  outcomes: CutoffOutcome[];
  deployed: number;
  cheapest: number;
  n: number;
}) {
  const deployedIndex = outcomes.findIndex((o) => Math.abs(o.cutoff - deployed) < 1e-9);
  const [index, setIndex] = useState(deployedIndex === -1 ? 0 : deployedIndex);
  const selected = outcomes[index];
  const isDeployed = Math.abs(selected.cutoff - deployed) < 1e-9;
  const isCheapest = Math.abs(selected.cutoff - cheapest) < 1e-9;

  const chartData: ChartRow[] = useMemo(
    () =>
      outcomes.map((o) => ({
        cutoff: o.cutoff,
        approvalRate: o.approval_rate * 100,
        badRate: o.approved_bad_rate * 100,
        costPerApplicant: o.costPerApplicant,
      })),
    [outcomes],
  );

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-4">
        <div className="mb-8">
          <div className="flex items-baseline justify-between">
            <label htmlFor="cutoff-slider" className="kicker">
              Cutoff
            </label>
            <span className="num text-xl">{formatPercent(selected.cutoff, 0)}</span>
          </div>
          <Slider
            id="cutoff-slider"
            className="mt-4"
            min={0}
            max={outcomes.length - 1}
            step={1}
            value={[index]}
            onValueChange={([value]) => setIndex(value)}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {isDeployed ? <Badge>Trained cutoff</Badge> : null}
            {isCheapest ? <Badge variant="low">Lowest cost on this grid</Badge> : null}
          </div>
        </div>
        <dl className="grid gap-6 sm:grid-cols-2">
          <Stat
            label="Approved"
            value={`${selected.approved.toLocaleString("en-US")}`}
            note={`${formatPercent(selected.approval_rate, 1)} of ${n.toLocaleString("en-US")}`}
          />
          <Stat
            label="Defaults let through"
            value={`${selected.badsApproved}`}
            tone="high"
            note={`${formatPercent(selected.approved_bad_rate, 1)} of approvals`}
          />
          <Stat label="Good applicants declined" value={`${selected.goodsDeclined}`} tone="medium" />
          <Stat
            label="Cost per applicant"
            value={selected.costPerApplicant.toFixed(3)}
            note="5 × defaults approved + 1 × good declines, ÷ 1,000"
          />
        </dl>
      </div>

      <div className="lg:col-span-8">
        <Legend
          items={[
            { label: "Approval rate", color: "var(--accent)", shape: "line" },
            { label: "Bad rate among approved", color: "var(--band-high)", shape: "line" },
            { label: "Cost per applicant", color: "var(--band-medium)", shape: "line" },
          ]}
        />
        <div className="mt-4 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID.stroke} strokeDasharray={GRID.strokeDasharray} />
              <XAxis
                dataKey="cutoff"
                tickFormatter={(v: number) => pct(v, 0)}
                tick={AXIS_TICK}
                axisLine={AXIS_LINE}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => `${v}%`}
                tick={AXIS_TICK}
                axisLine={AXIS_LINE}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                cursor={{ stroke: "var(--hairline-strong)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0].payload as ChartRow;
                  return (
                    <TooltipCard
                      title={pct(row.cutoff, 0)}
                      rows={[
                        { label: "Approval rate", value: `${row.approvalRate.toFixed(1)}%`, color: "var(--accent)" },
                        { label: "Bad rate among approved", value: `${row.badRate.toFixed(1)}%`, color: "var(--band-high)" },
                      ]}
                    />
                  );
                }}
              />
              <ReferenceLine x={selected.cutoff} stroke="var(--ink)" />
              <ReferenceLine
                x={deployed}
                stroke="var(--muted)"
                strokeDasharray="4 4"
                label={{ value: "trained", position: "insideTopRight", fill: "var(--muted)", fontSize: 10 }}
              />
              <Line
                type="monotone"
                dataKey="approvalRate"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="badRate"
                stroke="var(--band-high)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={GRID.stroke} strokeDasharray={GRID.strokeDasharray} />
              <XAxis
                dataKey="cutoff"
                tickFormatter={(v: number) => pct(v, 0)}
                tick={AXIS_TICK}
                axisLine={AXIS_LINE}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v: number) => v.toFixed(2)}
                tick={AXIS_TICK}
                axisLine={AXIS_LINE}
                tickLine={false}
              />
              <Tooltip
                cursor={{ stroke: "var(--hairline-strong)" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0].payload as ChartRow;
                  return (
                    <TooltipCard
                      title={pct(row.cutoff, 0)}
                      rows={[{ label: "Cost per applicant", value: row.costPerApplicant.toFixed(3), color: "var(--band-medium)" }]}
                    />
                  );
                }}
              />
              <ReferenceLine x={selected.cutoff} stroke="var(--ink)" />
              <ReferenceLine
                x={deployed}
                stroke="var(--muted)"
                strokeDasharray="4 4"
                label={{ value: "trained", position: "insideTopRight", fill: "var(--muted)", fontSize: 10 }}
              />
              <Area
                type="monotone"
                dataKey="costPerApplicant"
                stroke="var(--band-medium)"
                fill="var(--band-medium-soft)"
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
