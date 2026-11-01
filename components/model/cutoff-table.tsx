import { Badge } from "@/components/ui/badge";
import { DEPLOYED_CUTOFF, type CutoffOutcome } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

export function CutoffTable({ outcomes }: { outcomes: CutoffOutcome[] }) {
  const cheapest = outcomes.reduce((best, o) => (o.cost < best.cost ? o : best));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink text-left font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            <th className="py-3 pr-4">Cutoff</th>
            <th className="py-3 pr-4">Approved</th>
            <th className="py-3 pr-4">Default rate among approvals</th>
            <th className="py-3 pr-4">Approved defaults</th>
            <th className="py-3 pr-4">Repaid applicants declined</th>
            <th className="py-3">Error cost / applicant</th>
          </tr>
        </thead>
        <tbody>
          {outcomes.map((o) => {
            const isDeployed = Math.abs(o.cutoff - DEPLOYED_CUTOFF) < 1e-9;
            const isCheapest = o.cutoff === cheapest.cutoff;
            return (
              <tr key={o.cutoff} className={cn("border-b border-hairline", isDeployed && "bg-secondary")}>
                <td className="num py-3 pr-4">
                  <span className="flex items-center gap-2">
                    {(o.cutoff * 100).toFixed(0)}%
                    {isDeployed ? <Badge variant="default">Deployed</Badge> : null}
                    {isCheapest ? <Badge variant="low">Lowest cost</Badge> : null}
                  </span>
                </td>
                <td className="num py-3 pr-4">{o.approved.toLocaleString("en-US")}</td>
                <td className="num py-3 pr-4">{(o.approved_bad_rate * 100).toFixed(1)}%</td>
                <td className="num py-3 pr-4">{o.badsApproved}</td>
                <td className="num py-3 pr-4">{o.goodsDeclined}</td>
                <td className="num py-3">{o.costPerApplicant.toFixed(3)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
