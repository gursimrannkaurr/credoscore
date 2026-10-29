export const AXIS_TICK = { fontSize: 11, fill: "var(--muted)", fontFamily: "var(--font-mono)" } as const;
export const AXIS_LINE = { stroke: "var(--hairline-strong)" } as const;
export const GRID = { stroke: "var(--hairline)", strokeDasharray: "2 4" } as const;
export const pct = (v: number, d = 0) => `${(v * 100).toFixed(d)}%`;

export function TooltipCard({ title, rows }: { title?: string; rows: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="min-w-40 rounded-lg border border-hairline bg-popover px-3 py-2.5 text-xs shadow-lg shadow-black/5">
      {title ? <p className="mb-1.5 font-medium text-foreground">{title}</p> : null}
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {r.color ? <span aria-hidden className="size-2 rounded-full" style={{ background: r.color }} /> : null}
              {r.label}
            </span>
            <span className="num text-foreground">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
