// Shared types between the frontend and the two Python endpoints.
// Keep these in sync with api/predict.py and api/portfolio.py by hand —
// the project is intentionally small enough that a generated client would
// be more ceremony than the two request shapes are worth.

export type JobType =
  | "unskilled_nonresident"
  | "unskilled_resident"
  | "skilled"
  | "management";

export type Housing = "rent" | "own" | "free";

export type Purpose =
  | "car_new"
  | "car_used"
  | "furniture_equipment"
  | "radio_tv"
  | "domestic_appliances"
  | "repairs"
  | "education"
  | "retraining"
  | "business"
  | "other";

export type CreditHistory =
  | "no_credits"
  | "all_paid"
  | "paid_duly"
  | "delayed_past"
  | "critical";

export type CheckingStatus =
  | "less_than_0"
  | "0_to_200"
  | "200_or_more"
  | "none";

export type SavingsStatus =
  | "under_100"
  | "100_to_500"
  | "500_to_1000"
  | "over_1000"
  | "none";

export interface PredictRequest {
  age: number;
  employment_years: number;
  job_type: JobType;
  housing: Housing;
  monthly_income: number;
  loan_amount: number;
  duration_months: number;
  purpose: Purpose;
  credit_history: CreditHistory;
  checking_status: CheckingStatus;
  savings_status: SavingsStatus;
  existing_credits: number;
}

export type RiskBand = "low" | "medium" | "high";

export type Decision =
  | "approve"
  | "approve_with_conditions"
  | "refer_for_review"
  | "decline";

export interface Contribution {
  feature: string;
  label: string;
  value: string | number;
  contribution: number;
}

export interface PredictResponse {
  probability_of_default: number;
  risk_band: RiskBand;
  score: number;
  decision: Decision;
  cutoff: number;
  contributions: Contribution[];
  base_rate: number;
  model_version: string;
}

export interface CompareModelResult {
  probability_of_default: number;
  risk_band: RiskBand;
  score: number;
  decision: Decision;
  cutoff: number;
  model_version: string;
  contributions?: Contribution[];
  base_rate?: number;
}

export interface CompareResponse {
  gradient_boosting: CompareModelResult;
  xgboost: CompareModelResult;
  random_forest: CompareModelResult;
  cutoff: number;
}

export interface ApiError {
  error: string;
  message: string;
}

export interface DecileRow {
  decile: number;
  count: number;
  mean_predicted_pd: number;
  observed_default_rate: number;
}

export interface SegmentRow {
  segment: string | number;
  count: number;
  default_rate: number;
  mean_predicted_pd: number;
}

export interface CutoffPoint {
  cutoff: number;
  approval_rate: number;
  approved_bad_rate: number;
}

export interface RocPoint {
  fpr: number;
  tpr: number;
}

export interface CalibrationBin {
  bin_start: number;
  bin_end: number;
  count: number;
  mean_predicted: number;
  observed_rate: number;
}

export interface ModelMetrics {
  roc_auc: number;
  pr_auc: number;
  ks_statistic: number;
  brier_score: number;
}

export interface FeatureImportanceRow {
  feature: string;
  label: string;
  importance: number;
}

export interface BenchmarkEntry {
  roc_auc_mean: number;
  roc_auc_std?: number;
  pr_auc_mean?: number;
  pr_auc_std?: number;
  params?: Record<string, number | string>;
}

export interface PortfolioResponse {
  total_applicants: number;
  base_default_rate: number;
  band_counts: Record<RiskBand, number>;
  deciles: DecileRow[];
  segments: {
    purpose: SegmentRow[];
    employment_years: SegmentRow[];
    housing: SegmentRow[];
    job_type: SegmentRow[];
  };
  cutoff_curve: CutoffPoint[];
  roc_curve: RocPoint[];
  calibration: CalibrationBin[];
  metrics: ModelMetrics;
  benchmark: Record<string, BenchmarkEntry>;
  feature_importance: FeatureImportanceRow[];
  cost_matrix: {
    false_negative_cost: number;
    false_positive_cost: number;
    note: string;
  };
}
