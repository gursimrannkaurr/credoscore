import raw from "@/model/portfolio.json";

import type { CutoffPoint, PortfolioResponse } from "./types";

export const portfolio = raw as unknown as PortfolioResponse;
export const DEPLOYED_CUTOFF = 0.25;

export interface CutoffOutcome extends CutoffPoint {
  approved: number;
  declined: number;
  badsApproved: number;
  badsCaught: number;
  goodsDeclined: number;
  cost: number;
  costPerApplicant: number;
}

export function outcomeAt(point: CutoffPoint, p: PortfolioResponse = portfolio): CutoffOutcome {
  const n = p.total_applicants;
  const totalBad = Math.round(n * p.base_default_rate);
  const approved = Math.round(point.approval_rate * n);
  const badsApproved = Math.round(approved * point.approved_bad_rate);
  const declined = n - approved;
  const badsCaught = totalBad - badsApproved;
  const goodsDeclined = declined - badsCaught;
  const cost =
    p.cost_matrix.false_negative_cost * badsApproved + p.cost_matrix.false_positive_cost * goodsDeclined;
  return { ...point, approved, declined, badsApproved, badsCaught, goodsDeclined, cost, costPerApplicant: cost / n };
}

export const cutoffOutcomes: CutoffOutcome[] = portfolio.cutoff_curve.map((pt) => outcomeAt(pt));

export const deployedOutcome: CutoffOutcome =
  cutoffOutcomes.find((o) => Math.abs(o.cutoff - DEPLOYED_CUTOFF) < 1e-9) ?? cutoffOutcomes[0];

export const cheapestOutcome: CutoffOutcome = cutoffOutcomes.reduce((best, o) => (o.cost < best.cost ? o : best));

export const decileLift =
  portfolio.deciles[portfolio.deciles.length - 1].observed_default_rate / portfolio.deciles[0].observed_default_rate;

export const calibrationGap = (() => {
  const total = portfolio.calibration.reduce((s, b) => s + b.count, 0);
  return portfolio.calibration.reduce((s, b) => s + b.count * Math.abs(b.mean_predicted - b.observed_rate), 0) / total;
})();

export const brierBaseline = portfolio.base_default_rate * (1 - portfolio.base_default_rate);
