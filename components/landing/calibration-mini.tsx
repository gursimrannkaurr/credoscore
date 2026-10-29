import type { CalibrationBin } from "@/lib/types";

export function CalibrationMini({ bins }: { bins: CalibrationBin[] }) {
  const W = 420, H = 300, L = 40, R = 10, T = 10, B = 34;
  const x = (v: number) => L + v * (W - L - R);
  const y = (v: number) => T + (1 - v) * (H - T - B);
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const maxGapPct = Math.round(Math.max(...bins.map((b) => Math.abs(b.mean_predicted - b.observed_rate))) * 1000) / 10;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Calibration plot across ${bins.length} score bins. Predicted and observed default rates track each other closely, with the largest gap at ${maxGapPct} percentage points.`}
      className="h-auto w-full"
    >
      <line x1={x(0)} y1={y(0)} x2={x(1)} y2={y(1)} stroke="var(--hairline-strong)" strokeDasharray="4 4" />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={T} y2={H - B} stroke="var(--hairline)" strokeDasharray="2 4" />
          <text x={x(t)} y={H - B + 16} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="var(--muted)">
            {Math.round(t * 100)}%
          </text>
          <text x={L - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--muted)">
            {Math.round(t * 100)}%
          </text>
        </g>
      ))}
      <polyline
        points={bins.map((b) => `${x(b.mean_predicted)},${y(b.observed_rate)}`).join(" ")}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={1.5}
      />
      {bins.map((b, i) => (
        <circle
          key={i}
          cx={x(b.mean_predicted)}
          cy={y(b.observed_rate)}
          r={4 + Math.sqrt(b.count) / 2}
          fill="var(--accent)"
          fillOpacity={0.85}
          stroke="var(--paper-raised)"
          strokeWidth={1.5}
        />
      ))}
      <text x={(L + (W - R)) / 2} y={H - 4} textAnchor="middle" fontSize="9" fontFamily="var(--font-mono)" fill="var(--muted)" letterSpacing="1.2">
        PREDICTED
      </text>
      <text
        x={12}
        y={(T + (H - B)) / 2}
        textAnchor="middle"
        fontSize="9"
        fontFamily="var(--font-mono)"
        fill="var(--muted)"
        letterSpacing="1.2"
        transform={`rotate(-90 12 ${(T + (H - B)) / 2})`}
      >
        OBSERVED
      </text>
    </svg>
  );
}
