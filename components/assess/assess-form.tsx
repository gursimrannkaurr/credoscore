"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiRequestError, predictCibil } from "@/lib/api";
import type { CibilAssessmentRequest, CibilCompareResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AssessFormProps {
  onStart: () => void;
  onResult: (result: CibilCompareResponse) => void;
  onError: (message: string) => void;
}

function displayCategory(field: string, value: string): string {
  if (field === "gender") return value === "F" ? "Woman" : "Man";
  if (field === "recent_product" || field === "first_product") {
    return ({ PL: "Personal loan", CC: "Credit card", AL: "Auto loan", HL: "Home loan", ConsumerLoan: "Consumer loan", others: "Other / not specified" } as Record<string, string>)[value] ?? value;
  }
  if (field === "education") return value === "12TH" ? "Class 12" : value === "SSC" ? "Class 10 (SSC)" : value;
  return value;
}

export function AssessForm({ onStart, onResult, onError }: AssessFormProps) {
  const [form, setForm] = useState<CibilAssessmentRequest>({
    age: 35, monthly_income: 60000, employer_months: 60, credit_score: 720,
    total_trades: 5, active_trades: 3, missed_payments: 1,
    delinquency_events: 1, recent_dpd_30_plus: 0, recent_delinquency_12m: 0, personal_loan_accounts: 1,
    credit_card_utilization: 0.35, recent_enquiries_12m: 2,
    recent_payment_days: 45, secured_accounts: 2, unsecured_accounts: 3,
    gender: "M", marital_status: "Married", education: "GRADUATE",
    recent_product: "PL", first_product: "ConsumerLoan",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CibilAssessmentRequest | "form", string>>>({});
  const [loading, setLoading] = useState(false);

  function set<K extends keyof CibilAssessmentRequest>(field: K, value: CibilAssessmentRequest[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    onStart();
    try {
      const scored = await predictCibil(form);
      onResult(scored);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Something went wrong while scoring.";
      const field = err instanceof ApiRequestError && err.field in form ? (err.field as keyof CibilAssessmentRequest) : "form";
      setErrors({ [field]: message });
      if (field !== "form") document.getElementById(field)?.focus();
      onError(message);
    } finally {
      setLoading(false);
    }
  }

  const numeric = (f: keyof Pick<CibilAssessmentRequest, "age" | "monthly_income" | "employer_months" | "credit_score" | "total_trades" | "active_trades" | "missed_payments" | "delinquency_events" | "recent_dpd_30_plus" | "recent_delinquency_12m" | "personal_loan_accounts" | "credit_card_utilization" | "recent_enquiries_12m" | "recent_payment_days" | "secured_accounts" | "unsecured_accounts">, label: string, suffix?: string, className?: string) => (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={f} className="flex items-baseline justify-between text-[13px]">
        <span>{label}</span>
        <span className="num text-[11px] text-muted-foreground">{suffix}</span>
      </Label>
      <Input
        id={f}
        name={f}
        type="number"
        inputMode="decimal"
        min={f === "credit_score" ? 300 : 0}
        max={f === "credit_score" ? 900 : f === "credit_card_utilization" ? 1 : undefined}
        step={f === "monthly_income" ? 1000 : f === "credit_card_utilization" ? 0.01 : 1}
        value={form[f]}
        onChange={(e) => set(f, Number(e.target.value))}
        aria-invalid={errors[f] ? true : undefined}
        aria-describedby={errors[f] ? `${f}-error` : undefined}
      />
      {errors[f] ? <p id={`${f}-error`} className="text-xs text-band-high">{errors[f]}</p> : null}
    </div>
  );

  const category = (f: keyof Pick<CibilAssessmentRequest, "gender" | "marital_status" | "education" | "recent_product" | "first_product">, label: string, options: string[], className?: string) => (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={f} className="text-[13px]">{label}</Label>
      <Select value={form[f]} onValueChange={(v) => set(f, v as CibilAssessmentRequest[typeof f])}>
        <SelectTrigger id={f} className="w-full" aria-invalid={errors[f] ? true : undefined} aria-describedby={errors[f] ? `${f}-error` : undefined}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((value) => (
            <SelectItem key={value} value={value}>{displayCategory(f, value)}</SelectItem>
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
        <span className="text-xs text-muted-foreground">Indian CIBIL profile</span>
      </div>

      <div className="mt-6 space-y-6">
        {group("01", "Applicant profile", <>
          {numeric("age", "Age", "years")}
          {numeric("monthly_income", "Net monthly income", "INR", "col-span-2")}
          {numeric("employer_months", "Time with current employer", "months", "col-span-2")}
          {category("education", "Education", ["SSC", "12TH", "UNDER GRADUATE", "GRADUATE", "POST-GRADUATE", "PROFESSIONAL", "OTHERS"], "col-span-2")}
        </>)}
        {group("02", "Credit profile", <>
          {numeric("credit_score", "CIBIL score", "/ 900")}
          {numeric("total_trades", "Total credit accounts")}
          {numeric("active_trades", "Active accounts")}
          {numeric("missed_payments", "Missed payments")}
          {numeric("delinquency_events", "Past delinquency events")}
          {numeric("recent_dpd_30_plus", "30+ DPD events")}
          {numeric("recent_delinquency_12m", "Delinquencies (12 months)")}
          {numeric("recent_payment_days", "Days since recent payment", "days")}
          {numeric("personal_loan_accounts", "Personal loan accounts")}
          {numeric("credit_card_utilization", "Credit card utilisation", "0–1")}
          {numeric("recent_enquiries_12m", "Credit enquiries (12 months)")}
          {numeric("secured_accounts", "Secured accounts")}
          {numeric("unsecured_accounts", "Unsecured accounts")}
        </>)}
        {group("03", "Other credit activity", <>
          {category("recent_product", "Most recent product enquiry", ["others", "ConsumerLoan", "PL", "CC", "AL", "HL"], "col-span-2")}
          {category("first_product", "First recorded product enquiry", ["others", "ConsumerLoan", "PL", "CC", "AL", "HL"], "col-span-2")}
        </>)}
        {group("04", "Fairness check (not used to score)", <>
          {category("gender", "Gender", ["M", "F"], "col-span-1")}
          {category("marital_status", "Marital status", ["Married", "Single"], "col-span-1")}
          <p className="col-span-2 text-xs leading-relaxed text-muted-foreground">
            Gender and marital status are excluded from model features. They are used only to select a matching holdout group for the fairness summary; changing either field never changes the submitted model score. This check is educational and does not establish fairness or causation.
          </p>
        </>)}
      </div>

      {errors.form ? (
        <p role="alert" className="mt-6 rounded-md border border-band-high/30 bg-band-high-soft px-3 py-2.5 text-sm text-band-high">{errors.form}</p>
      ) : null}

      <Button type="submit" size="lg" className="mt-6 w-full" disabled={loading}>
        {loading ? <><Loader2 className="animate-spin" /> Classifying…</> : <>Classify credit profile <ArrowRight /></>}
      </Button>
      <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
        The model predicts the dataset&apos;s historical P1–P4 bank priority category. It does not predict default probability or approve a real loan.
      </p>
    </form>
  );
}
