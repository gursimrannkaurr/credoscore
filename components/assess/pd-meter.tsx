import { BAND_EDGES } from "@/lib/decision";

export function PdMeter({ pd, cutoff }: { pd: number; cutoff: number }) {
  const zones = [
    { from: 0, to: BAND_EDGES.low, cls: "bg-band-low-soft border-band-low", label: "Low" },
    { from: BAND_EDGES.low, to: BAND_EDGES.medium, cls: "bg-band-medium-soft border-band-medium", label: "Medium" },
    { from: BAND_EDGES.medium, to: 1, cls: "bg-band-high-soft border-band-high", label: "High" },
  ];
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  return (
    <div className="pt-7" role="img" aria-label={`Probability of default ${(pd * 100).toFixed(1)} percent on a scale from 0 to 100, with the approval cutoff at ${(cutoff * 100).toFixed(0)} percent.`}>
      <div className="relative">
        <div className="flex h-3 overflow-hidden rounded-full">
          {zones.map((z) => (
            <div key={z.label} className={`border-t-2 ${z.cls}`} style={{ width: `${(z.to - z.from) * 100}%` }} />
          ))}
        </div>
        <div className="absolute -top-1.5 h-6 w-px border-l border-dashed border-ink/60" style={{ left: `${clamp(cutoff) * 100}%` }} />
        <div className="absolute -top-7 -translate-x-1/2 text-center transition-[left] duration-500 ease-out" style={{ left: `${clamp(pd) * 100}%` }}>
          <span className="num rounded bg-ink px-1.5 py-0.5 text-[11px] text-paper">{(pd * 100).toFixed(1)}%</span>
          <span aria-hidden className="mx-auto block h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-ink" />
        </div>
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-muted-foreground">
        <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
      </div>
      <div className="mt-1 flex text-[11px] text-muted-foreground">
        {zones.map((z) => (
          <span key={z.label} style={{ width: `${(z.to - z.from) * 100}%` }} className="truncate">{z.label}</span>
        ))}
      </div>
    </div>
  );
}
