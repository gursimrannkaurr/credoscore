import { INR_PER_DM } from "@/lib/format";
import type { PredictRequest } from "@/lib/types";

type NumericField = "age" | "employment_years" | "monthly_income" | "loan_amount" | "duration_months" | "existing_credits";
type CategoricalField = Exclude<keyof PredictRequest, NumericField>;
type FormState = { [K in NumericField]: string } & Pick<PredictRequest, CategoricalField>;

export const PRESETS: { id: string; label: string; note: string; values: FormState }[] = [
  {
    id: "typical",
    label: "Typical file",
    note: "Mid-career, owns a home, new-car loan",
    values: { age: "35", employment_years: "4", job_type: "skilled", housing: "own", monthly_income: String(Math.round(2500 * INR_PER_DM)), loan_amount: String(Math.round(5000 * INR_PER_DM)), duration_months: "24", purpose: "car_new", credit_history: "paid_duly", checking_status: "0_to_200", savings_status: "under_100", personal_status_sex: "male_single", existing_credits: "1" },
  },
  {
    id: "strong",
    label: "Strong file",
    note: "Senior, high income, small loan",
    values: { age: "50", employment_years: "10", job_type: "management", housing: "own", monthly_income: String(Math.round(7000 * INR_PER_DM)), loan_amount: String(Math.round(1500 * INR_PER_DM)), duration_months: "12", purpose: "radio_tv", credit_history: "critical", checking_status: "none", savings_status: "over_1000", personal_status_sex: "male_married_widowed", existing_credits: "1" },
  },
  {
    id: "stretched",
    label: "Stretched file",
    note: "Young, renting, large business loan",
    values: { age: "22", employment_years: "0", job_type: "unskilled_nonresident", housing: "rent", monthly_income: String(Math.round(800 * INR_PER_DM)), loan_amount: String(Math.round(15000 * INR_PER_DM)), duration_months: "48", purpose: "business", credit_history: "delayed_past", checking_status: "less_than_0", savings_status: "under_100", personal_status_sex: "female_single", existing_credits: "1" },
  },
];
