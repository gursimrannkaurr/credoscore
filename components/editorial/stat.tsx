import { cn } from "@/lib/utils";

const TONE = { default: "text-ink", low: "text-band-low", medium: "text-band-medium", high: "text-band-high", brand: "text-brand" } as const;

export function Stat({ label, value, note, tone = "default", className }: { label: string; value: string; note?: string; tone?: keyof typeof TONE; className?: string }) {
  return (
    <div className={cn("border-t border-ink pt-3", className)}>
      <dt className="kicker">{label}</dt>
      <dd className={cn("num mt-2 text-3xl tracking-tight md:text-[2.5rem] md:leading-none", TONE[tone])}>{value}</dd>
      {note ? <dd className="mt-2 text-sm leading-snug text-muted-foreground">{note}</dd> : null}
    </div>
  );
}
