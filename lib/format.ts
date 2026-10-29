// Formatting helpers used across the tables, tiles and charts. Centralised
// so every number on the site renders with the same locale and precision.

import type { Decision } from "./types";

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatScore(value: number): string {
  return value.toLocaleString("en-US");
}

export function formatSigned(value: number, digits = 1): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(digits)}pp`;
}

export function titleCase(input: string): string {
  return input
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export const RISK_BAND_LABEL: Record<string, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
};

export const DECISION_LABEL: Record<Decision, string> = {
  approve: "Approve",
  approve_with_conditions: "Approve with conditions",
  refer_for_review: "Refer for review",
  decline: "Decline",
};

export const PURPOSE_LABEL: Record<string, string> = {
  car_new: "New car",
  car_used: "Used car",
  furniture_equipment: "Furniture / equipment",
  radio_tv: "Radio / television",
  domestic_appliances: "Domestic appliances",
  repairs: "Repairs",
  education: "Education",
  retraining: "Retraining",
  business: "Business",
  other: "Other",
};

export const CREDIT_HISTORY_LABEL: Record<string, string> = {
  no_credits: "No credits taken yet",
  all_paid: "All credits paid back duly",
  paid_duly: "Existing credits paid duly",
  delayed_past: "Delayed payment in the past",
  critical: "Critical account / other credits",
};

export const CHECKING_STATUS_LABEL: Record<string, string> = {
  less_than_0: "Below 0 DM",
  "0_to_200": "0 to 200 DM",
  "200_or_more": "200 DM or more",
  none: "No checking account",
};

export const SAVINGS_STATUS_LABEL: Record<string, string> = {
  under_100: "Under 100 DM",
  "100_to_500": "100 to 500 DM",
  "500_to_1000": "500 to 1,000 DM",
  over_1000: "Over 1,000 DM",
  none: "No savings account",
};

export const HOUSING_LABEL: Record<string, string> = {
  rent: "Rents",
  own: "Owns",
  free: "Lives rent-free",
};

export const FEATURE_LABEL: Record<string, string> = {
  age: "Age",
  employment_years: "Years employed",
  monthly_income: "Monthly income",
  loan_amount: "Loan amount",
  duration_months: "Loan duration",
  existing_credits: "Existing credit lines",
  job_type: "Job type",
  housing: "Housing situation",
  purpose: "Loan purpose",
  credit_history: "Credit history",
  checking_status: "Checking account status",
  savings_status: "Savings account status",
};

export const EMPLOYMENT_YEARS_LABEL: Record<string, string> = {
  "0": "Unemployed",
  "0.5": "Under 1 year",
  "2.5": "1 to 4 years",
  "5.5": "4 to 7 years",
  "10": "7 years or more",
};

export const JOB_TYPE_LABEL: Record<string, string> = {
  unskilled_nonresident: "Unskilled, non-resident",
  unskilled_resident: "Unskilled, resident",
  skilled: "Skilled employee",
  management: "Management / self-employed",
};

export function formatNumber(value: number, digits = 0): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatDM(value: number): string {
  return `${formatNumber(Math.round(value))} DM`;
}

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  job_type: JOB_TYPE_LABEL,
  housing: HOUSING_LABEL,
  purpose: PURPOSE_LABEL,
  credit_history: CREDIT_HISTORY_LABEL,
  checking_status: CHECKING_STATUS_LABEL,
  savings_status: SAVINGS_STATUS_LABEL,
};

export function formatFeatureValue(feature: string, value: string | number): string {
  if (typeof value === "string") return CATEGORY_LABELS[feature]?.[value] ?? titleCase(value);
  switch (feature) {
    case "monthly_income":
    case "loan_amount":
      return formatDM(value);
    case "duration_months":
      return `${formatNumber(value)} months`;
    case "employment_years":
      return value === 1 ? "1 year" : `${formatNumber(value, Number.isInteger(value) ? 0 : 1)} years`;
    case "age":
      return `${formatNumber(value)} years old`;
    case "existing_credits":
      return value === 1 ? "1 credit line" : `${formatNumber(value)} credit lines`;
    default:
      return formatNumber(value, Number.isInteger(value) ? 0 : 2);
  }
}

export function featureLabel(feature: string): string {
  return FEATURE_LABEL[feature] ?? titleCase(feature);
}
