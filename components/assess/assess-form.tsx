"use client";

import { useState } from "react";
import { ArrowRight, Loader2, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiRequestError, predict } from "@/lib/api";
import {
  CHECKING_STATUS_LABEL, CREDIT_HISTORY_LABEL, HOUSING_LABEL, JOB_TYPE_LABEL, PURPOSE_LABEL, SAVINGS_STATUS_LABEL,
} from "@/lib/format";
import type { PredictRequest, PredictResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

import { PRESETS } from "./presets";

type NumericField = "age" | "employment_years" | "monthly_income" | "loan_amount" | "duration_months" | "existing_credits";
type CategoricalField = Exclude<keyof PredictRequest, NumericField>;
export type FormState = { [K in NumericField]: string } & Pick<PredictRequest, CategoricalField>;
type Errors = Partial<Record<keyof PredictRequest | "form", string>>;

const BOUNDS: Record<NumericField, { min: number; max: number; step: number; suffix?: string }> = {
  age: { min: 18, max: 100, step: 1, suffix: "yrs" },
  employment_years: { min: 0, max: 50, step: 0.5, suffix: "yrs" },
  monthly_income: { min: 1, max: 1_000_000, step: 50, suffix: "DM" },
  loan_amount: { min: 1, max: 1_000_000, step: 100, suffix: "DM" },
  duration_months: { min: 1, max: 120, step: 1, suffix: "mo" },
  existing_credits: { min: 0, max: 20, step: 1 },
};

const OPTIONS: Record<CategoricalField, Record<string, string>> = {
  job_type: JOB_TYPE_LABEL,
  housing: HOUSING_LABEL,
  purpose: PURPOSE_LABEL,
  credit_history: CREDIT_HISTORY_LABEL,
  checking_status: CHECKING_STATUS_LABEL,
  savings_status: SAVINGS_STATUS_LABEL,
};

const NUMERIC_FIELDS = Object.keys(BOUNDS) as NumericField[];

function validate(form: FormState): Errors {
  const errors: Errors = {};
  for (const f of NUMERIC_FIELDS) {
    const raw = form[f].trim();
    const { min, max } = BOUNDS[f];
    if (raw === "") errors[f] = "Required.";
    else if (!Number.isFinite(Number(raw))) errors[f] = "Enter a number.";
    else if (Number(raw) < min || Number(raw) > max) errors[f] = `Enter a value from ${min.toLocaleString("en-US")} to ${max.toLocaleString("en-US")}.`;
  }
  if (!errors.loan_amount && !errors.duration_months && !errors.monthly_income) {
    const instalment = Number(form.loan_amount) / Number(form.duration_months);
    if (instalment > 4 * Number(form.monthly_income)) {
      errors.loan_amount = "The monthly instalment (amount ÷ months) can't be more than four times monthly income.";
    }
  }
  return errors;
}

function toPayload(form: FormState): PredictRequest {
  return {
    ...form,
    age: Number(form.age),
    employment_years: Number(form.employment_years),
    monthly_income: Number(form.monthly_income),
    loan_amount: Number(form.loan_amount),
    duration_months: Number(form.duration_months),
    existing_credits: Number(form.existing_credits),
  };
}

interface AssessFormProps {
  onStart: () => void;
  onResult: (result: PredictResponse) => void;
  onError: (message: string) => void;
}

export function AssessForm({ onStart, onResult, onError }: AssessFormProps) {
  const [form, setForm] = useState<FormState>(PRESETS[0].values);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [preset, setPreset] = useState<string | null>(PRESETS[0].id);

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setPreset(null);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function applyPreset(id: string) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setForm(p.values);
    setPreset(id);
    setErrors({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate(form);
    if (Object.keys(found).length) {
      setErrors(found);
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }
    setLoading(true);
    onStart();
    try {
      onResult(await predict(toPayload(form)));
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Something went wrong while scoring.";
      const field = err instanceof ApiRequestError && err.field in form ? (err.field as keyof PredictRequest) : "form";
      setErrors({ [field]: message });
      if (field !== "form") document.getElementById(field)?.focus();
      onError(message);
    } finally {
      setLoading(false);
    }
  }

  const numeric = (f: NumericField, label: string, className?: string) => (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={f} className="flex items-baseline justify-between text-[13px]">
        <span>{label}</span>
        <span className="num text-[11px] text-muted-foreground">{BOUNDS[f].suffix}</span>
      </Label>
      <Input
        id={f}
        name={f}
        type="number"
        inputMode="decimal"
        min={BOUNDS[f].min}
        max={BOUNDS[f].max}
        step={BOUNDS[f].step}
        value={form[f]}
        onChange={(e) => set(f, e.target.value)}
        aria-invalid={errors[f] ? true : undefined}
        aria-describedby={errors[f] ? `${f}-error` : undefined}
      />
      {errors[f] ? <p id={`${f}-error`} className="text-xs text-band-high">{errors[f]}</p> : null}
    </div>
  );

  const category = (f: CategoricalField, label: string, className?: string) => (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={f} className="text-[13px]">{label}</Label>
      <Select value={form[f]} onValueChange={(v) => set(f, v as FormState[typeof f])}>
        <SelectTrigger id={f} className="w-full" aria-invalid={errors[f] ? true : undefined} aria-describedby={errors[f] ? `${f}-error` : undefined}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(OPTIONS[f]).map(([value, text]) => (
            <SelectItem key={value} value={value}>{text}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {errors[f] ? <p id={`${f}-error`} className="text-xs text-band-high">{errors[f]}</p> : null}
    </div>
  );

  const group = (n: string, title: string, children: React.ReactNode) => (
    <fieldset className="border-t border-hairline pt-5">
      <legend className="float-left mb-4 flex w-full items-baseline gap-3">
        <span className="num text-xs text-brand">{n}</span>
        <span className="font-serif text-lg">{title}</span>
      </legend>
      <div className="clear-both grid grid-cols-2 gap-x-4 gap-y-4">{children}</div>
    </fieldset>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="rounded-xl border border-hairline bg-paper-raised p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="kicker">Application form</p>
          <p className="mt-1 font-serif text-2xl">Applicant details</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={() => applyPreset(PRESETS[0].id)} aria-label="Reset the form to the typical file">
          <RotateCcw /> Reset
        </Button>
      </div>

      <div className="mt-5">
        <p className="kicker mb-2">Load a sample file</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Sample files">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              aria-pressed={preset === p.id}
              title={p.note}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[13px] transition-colors",
                preset === p.id ? "border-brand bg-secondary text-ink" : "border-hairline text-ink-muted hover:border-ink hover:text-ink",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {group("01", "Applicant", <>
          {numeric("age", "Age")}
          {numeric("employment_years", "Years employed")}
          {category("job_type", "Job type")}
          {category("housing", "Housing")}
          {numeric("monthly_income", "Monthly income", "col-span-2")}
        </>)}
        {group("02", "Loan", <>
          {numeric("loan_amount", "Amount")}
          {numeric("duration_months", "Duration")}
          {category("purpose", "Purpose", "col-span-2")}
        </>)}
        {group("03", "Credit position", <>
          {category("credit_history", "Credit history", "col-span-2")}
          {category("checking_status", "Checking account")}
          {category("savings_status", "Savings account")}
          {numeric("existing_credits", "Existing credit lines", "col-span-2")}
        </>)}
      </div>

      {errors.form ? (
        <p role="alert" className="mt-6 rounded-md border border-band-high/30 bg-band-high-soft px-3 py-2.5 text-sm text-band-high">{errors.form}</p>
      ) : null}

      <Button type="submit" size="lg" className="mt-6 w-full" disabled={loading}>
        {loading ? <><Loader2 className="animate-spin" /> Scoring…</> : <>Score this applicant <ArrowRight /></>}
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">Amounts are in Deutsche Marks, as in the original 1994 data.</p>
    </form>
  );
}
