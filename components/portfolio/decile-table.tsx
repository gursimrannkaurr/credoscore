import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPercent } from "@/lib/format";
import type { DecileRow } from "@/lib/types";

function bandColor(rate: number): string {
  if (rate >= 0.35) return "var(--band-high)";
  if (rate >= 0.15) return "var(--band-medium)";
  return "var(--band-low)";
}

export function DecileTable({ deciles }: { deciles: DecileRow[] }) {
  const max = Math.max(...deciles.map((d) => d.observed_default_rate));
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Decile</TableHead>
          <TableHead>Applicants</TableHead>
          <TableHead>Predicted</TableHead>
          <TableHead>Observed</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deciles.map((d) => (
          <TableRow key={d.decile}>
            <TableCell className="num">{d.decile}</TableCell>
            <TableCell className="num">{d.count}</TableCell>
            <TableCell className="num">{formatPercent(d.mean_predicted_pd, 1)}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <span className="num w-12 shrink-0">{formatPercent(d.observed_default_rate, 1)}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-sunken">
                  <span
                    className="block h-full rounded-full"
                    style={{
                      width: `${(d.observed_default_rate / max) * 100}%`,
                      background: bandColor(d.observed_default_rate),
                    }}
                  />
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
