// Turns the already-returned Gradient Boosting contributions into plain
// advice copy for the Assess page's verdict banner. No new scoring logic
// lives here, just a field -> suggestion mapping over data the API already
// returned (see components/assess/verdict-banner.tsx).

import { featureLabel, formatFeatureValue } from "./format";
import type { Contribution } from "./types";

export interface AdviceItem {
  feature: string;
  text: string;
}

// Only fields an applicant can realistically act on get a suggestion. Age,
// employment_years, job_type, housing and purpose are left out on purpose,
// even when they show up as a top driver, because there is no sensible
// action to suggest for them (nobody can be told to "be older").
function suggestionFor(feature: string, value: string | number): string | null {
  switch (feature) {
    case "loan_amount":
      return "Consider asking for a smaller loan amount.";
    case "duration_months":
      return "A shorter repayment period would lower the risk.";
    case "savings_status":
      return value === "under_100" || value === "none" ? "A larger savings balance would help." : null;
    case "checking_status":
      return value === "less_than_0" || value === "none" ? "Keeping a positive checking balance would help." : null;
    case "credit_history":
      return value === "delayed_past" || value === "critical" ? "A stronger repayment history over time would improve this." : null;
    case "existing_credits":
      return "Paying down other open credit lines could help.";
    default:
      return null;
  }
}

// For the "no" verdict: the largest risk-increasing contributions, turned
// into concrete suggestions. Fields with no sensible suggestion are skipped
// rather than forced, so this list can come back shorter than `max`.
export function riskReductionAdvice(contributions: Contribution[], max = 4): AdviceItem[] {
  const positive = contributions.filter((c) => c.contribution > 0).sort((a, b) => b.contribution - a.contribution);
  const items: AdviceItem[] = [];
  for (const c of positive) {
    const text = suggestionFor(c.feature, c.value);
    if (text) items.push({ feature: c.feature, text });
    if (items.length >= max) break;
  }
  return items;
}

// For the "yes" verdict: the largest risk-reducing contributions, stated as
// plain reassurance.
export function reassuranceAdvice(contributions: Contribution[], max = 4): AdviceItem[] {
  const negative = contributions.filter((c) => c.contribution < 0).sort((a, b) => a.contribution - b.contribution);
  return negative.slice(0, max).map((c) => ({
    feature: c.feature,
    text: `${featureLabel(c.feature)} (${formatFeatureValue(c.feature, c.value)}) is keeping this low-risk.`,
  }));
}
