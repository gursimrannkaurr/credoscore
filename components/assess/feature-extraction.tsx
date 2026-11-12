"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { EMPLOYMENT_YEARS_LABEL, featureLabel, formatFeatureValue } from "@/lib/format";
import type { Contribution } from "@/lib/types";

const NUMERIC_FIELDS = ["age", "employment_years", "monthly_income", "loan_amount", "duration_months", "existing_credits"] as const;

// The one-hot slot order the model was actually trained on (read from
// model/model.json's "categories" directly, by hand, while building this
// panel). It is alphabetical per category, which does not match the
// friendlier UX ordering lib/format.ts uses for dropdowns elsewhere on this
// page. model/model.json itself is not imported here: it's documented as
// server-only (see lib/model-meta.ts), so these orderings are copied in as
// plain strings instead of read live.
const CATEGORY_ORDER: Record<string, string[]> = {
  job_type: ["management", "skilled", "unskilled_nonresident", "unskilled_resident"],
  housing: ["free", "own", "rent"],
  purpose: ["business", "car_new", "car_used", "domestic_appliances", "education", "furniture_equipment", "other", "radio_tv", "repairs", "retraining"],
  credit_history: ["all_paid", "critical", "delayed_past", "no_credits", "paid_duly"],
  checking_status: ["0_to_200", "200_or_more", "less_than_0", "none"],
  savings_status: ["100_to_500", "500_to_1000", "none", "over_1000", "under_100"],
};

const CATEGORICAL_FIELDS = Object.keys(CATEGORY_ORDER);
const ONE_HOT_COUNT = CATEGORICAL_FIELDS.reduce((sum, f) => sum + CATEGORY_ORDER[f].length, 0);

// The Assess form takes employment years as a free number (0 to 50, half-year
// steps), but training binned the original dataset's five ordinal employment
// codes into five representative years (0, 0.5, 2.5, 5.5, 10 -- see
// EMPLOYMENT_YEARS_MAP in ml/train.py). This reproduces that same binning for
// whatever number the applicant typed, instead of only matching the five
// representative values exactly.
function employmentBucket(years: number): string {
  if (years <= 0) return "0";
  if (years < 1) return "0.5";
  if (years < 4) return "2.5";
  if (years < 7) return "5.5";
  return "10";
}

// Computed entirely client-side from the values already submitted on this
// request (read back off the Gradient Boosting contributions, which echo
// every input field's validated value). No backend call.
export function FeatureExtraction({ contributions }: { contributions: Contribution[] }) {
  const [open, setOpen] = useState(false);
  const byField = new Map(contributions.map((c) => [c.feature, c] as const));

  const employmentValue = byField.get("employment_years")?.value;
  const employmentBucketLabel = typeof employmentValue === "number" ? EMPLOYMENT_YEARS_LABEL[employmentBucket(employmentValue)] : undefined;

  return (
    <section className="rounded-xl border border-hairline bg-paper-raised">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
      >
        <div>
          <p className="kicker">Under the hood</p>
          <h2 className="mt-1 font-serif text-xl">Feature extraction</h2>
        </div>
        {open ? <ChevronUp aria-hidden className="shrink-0 text-muted-foreground" /> : <ChevronDown aria-hidden className="shrink-0 text-muted-foreground" />}
      </button>

      {open ? (
        <div className="space-y-6 border-t border-hairline px-5 py-5 text-sm leading-relaxed sm:px-6">
          <p className="text-ink-muted">
            The twelve fields you entered are turned into 37 numbers before the model ever sees them.
          </p>

          <div>
            <p className="kicker mb-2">1. Numeric fields, passed through as-is</p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {NUMERIC_FIELDS.map((f) => {
                const c = byField.get(f);
                return (
                  <li key={f} className="flex items-baseline justify-between gap-3 rounded-md bg-secondary/40 px-3 py-1.5">
                    <span className="text-ink-muted">{featureLabel(f)}</span>
                    <span className="num text-ink">{c ? formatFeatureValue(f, c.value) : "—"}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <p className="kicker mb-2">2. Engineered features</p>
            <ul className="space-y-2 text-ink-muted">
              <li>
                <span className="font-medium text-ink">Employment-year bucket.</span> The training pipeline bins years employed into
                five buckets (0, 0.5, 2.5, 5.5 and 10 representative years) rather than using the raw figure. This applicant&apos;s
                answer falls into the{" "}
                {employmentBucketLabel ? <strong className="font-medium text-ink">&quot;{employmentBucketLabel}&quot;</strong> : "matching"} bucket.
              </li>
              <li>
                <span className="font-medium text-ink">Monthly income.</span> In the original training data, monthly income was not
                recorded directly. It was derived from the loan amount, the repayment duration and the instalment rate reported in
                that dataset. This form asks for income directly, so nothing is recomputed on this request; it is stated here as a
                fact about how the training data was built.
              </li>
            </ul>
          </div>

          <div>
            <p className="kicker mb-2">3. Categorical fields, one-hot encoded</p>
            <ul className="space-y-2">
              {CATEGORICAL_FIELDS.map((f) => {
                const c = byField.get(f);
                const order = CATEGORY_ORDER[f];
                const idx = typeof c?.value === "string" ? order.indexOf(c.value) : -1;
                const vector = order.map((_, i) => (i === idx ? 1 : 0));
                return (
                  <li key={f} className="rounded-md bg-secondary/40 px-3 py-1.5">
                    <span className="text-ink-muted">{featureLabel(f)}</span>{" "}
                    <span className="num text-ink">
                      = {c ? formatFeatureValue(f, c.value) : "—"} &rarr; [{vector.join(", ")}]
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="border-t border-hairline pt-4 text-ink-muted">
            Together: 6 numeric + {ONE_HOT_COUNT} one-hot columns = {6 + ONE_HOT_COUNT} inputs to the model.
          </p>
        </div>
      ) : null}
    </section>
  );
}
