"use client";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { DECISION_TONE, decisionAt } from "@/lib/decision";
import { DECISION_LABEL } from "@/lib/format";

const TONE_TEXT: Record<"low" | "medium" | "high", string> = {
  low: "text-band-low",
  medium: "text-band-medium",
  high: "text-band-high",
};

interface CutoffControlProps {
  cutoff: number;
  deployedCutoff: number;
  pd: number;
  onChange: (cutoff: number) => void;
}

export function CutoffControl({ cutoff, deployedCutoff, pd, onChange }: CutoffControlProps) {
  const decision = decisionAt(pd, cutoff);
  const tone = DECISION_TONE[decision];
  const deployedPct = (deployedCutoff * 100).toFixed(0);

  return (
    <div className="rounded-xl border border-hairline bg-paper-raised p-5">
      <p className="kicker">What-if</p>
      <p className="mt-1 font-serif text-xl">Move the approval cutoff</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        The trained cutoff is {deployedPct}%. It comes from the dataset&apos;s cost matrix: a bad approval costs five times a wrongful decline. Slide it to see how the recommendation for this applicant changes.
      </p>
      <div className="mt-5">
        <Slider
          value={[cutoff]}
          onValueChange={([v]) => onChange(v)}
          min={0.05}
          max={0.6}
          step={0.01}
          aria-label="Approval cutoff"
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="num text-sm">Cutoff {(cutoff * 100).toFixed(0)}%</p>
        <p className={`text-sm font-medium ${TONE_TEXT[tone]}`}>{DECISION_LABEL[decision]}</p>
      </div>
      {cutoff !== deployedCutoff ? (
        <Button type="button" variant="link" size="sm" onClick={() => onChange(deployedCutoff)}>
          Back to {deployedPct}%
        </Button>
      ) : null}
    </div>
  );
}
