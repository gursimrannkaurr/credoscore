import type { DecileRow } from "@/lib/types";

export function DecileStaircase({ deciles }: { deciles: DecileRow[] }) {
  const W = 480, H = 270, L = 38, R = 6, T = 10, B = 30, MAX = 0.8;
  const bw = (W - L - R) / deciles.length;
  const y = (v: number) => T + (1 - v / MAX) * (H - T - B);
  const fill = (v: number) => (v >= 0.35 ? "var(--band-high)" : v >= 0.15 ? "var(--band-medium)" : "var(--band-low)");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Observed default rate rises from ${Math.round(deciles[0].observed_default_rate * 100)}% in decile 1 to ${Math.round(deciles[deciles.length - 1].observed_default_rate * 100)}% in decile 10.`} className="h-auto w-full">
      {[0, 0.2, 0.4, 0.6, 0.8].map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--hairline)" strokeDasharray="2 4" />
          <text x={L - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize="10" fontFamily="var(--font-mono)" fill="var(--muted)">{Math.round(t * 100)}%</text>
        </g>
      ))}
      {deciles.map((d, i) => {
        const x = L + i * bw + bw * 0.16;
        const w = bw * 0.68;
        const top = y(d.observed_default_rate);
        return (
          <g key={d.decile}>
            <rect x={x} y={top} width={w} height={y(0) - top} rx={2} fill={fill(d.observed_default_rate)} className="staircase-bar" style={{ animationDelay: `${i * 55}ms` }} />
            <line x1={x - 3} x2={x + w + 3} y1={y(d.mean_predicted_pd)} y2={y(d.mean_predicted_pd)} stroke="var(--ink)" strokeWidth={2} strokeLinecap="round" />
            <text x={x + w / 2} y={H - B + 17} textAnchor="middle" fontSize="10" fontFamily="var(--font-mono)" fill="var(--muted)">{d.decile}</text>
          </g>
        );
      })}
      <text x={W - R} y={H - 2} textAnchor="end" fontSize="9" fontFamily="var(--font-mono)" fill="var(--muted)" letterSpacing="1.2">DECILE · SAFEST → RISKIEST</text>
    </svg>
  );
}
