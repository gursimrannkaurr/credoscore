import type { FormState } from "./assess-form";

export const PRESETS: { id: string; label: string; note: string; values: FormState }[] = [
  {
    id: "typical",
    label: "Typical file",
    note: "Mid-career, owns a home, new-car loan",
    values: { age: "35", employment_years: "4", job_type: "skilled", housing: "own", monthly_income: "2500", loan_amount: "5000", duration_months: "24", purpose: "car_new", credit_history: "paid_duly", checking_status: "0_to_200", savings_status: "under_100", existing_credits: "1" },
  },
  {
    id: "strong",
    label: "Strong file",
    note: "Senior, high income, small loan",
    values: { age: "50", employment_years: "10", job_type: "management", housing: "own", monthly_income: "7000", loan_amount: "1500", duration_months: "12", purpose: "radio_tv", credit_history: "critical", checking_status: "none", savings_status: "over_1000", existing_credits: "1" },
  },
  {
    id: "stretched",
    label: "Stretched file",
    note: "Young, renting, large business loan",
    values: { age: "22", employment_years: "0", job_type: "unskilled_nonresident", housing: "rent", monthly_income: "800", loan_amount: "15000", duration_months: "48", purpose: "business", credit_history: "delayed_past", checking_status: "less_than_0", savings_status: "under_100", existing_credits: "1" },
  },
];
