"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import type { CibilCompareResponse } from "@/lib/types";

import { AssessForm } from "./assess-form";
import { EmptySlip, ResultSkeleton } from "./result-states";

export function AssessWorkbench() {
  const [compare, setCompare] = useState<CibilCompareResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "done">("idle");
  const [run, setRun] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  function handleResult(res: CibilCompareResponse) {
    setCompare(res);
    setStatus("done");
    setRun((n) => n + 1);
    if (window.matchMedia("(max-width: 1023px)").matches) ref.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  const result = compare;

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] lg:gap-12">
      <AssessForm onStart={() => setStatus("loading")} onResult={handleResult} onError={() => setStatus("error")} />
      <div ref={ref} className="scroll-mt-24 space-y-6 lg:sticky lg:top-28 lg:self-start" aria-live="polite" aria-busy={status === "loading"}>
        <AnimatePresence mode="wait" initial={false}>
          {status === "loading" && !result ? (
            <ResultSkeleton key="skeleton" />
          ) : result ? (
            <motion.div key={run} className="space-y-6" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
              <section className="rounded-xl border border-hairline bg-paper-raised p-6">
                <p className="kicker">Model outputs</p>
                <h2 className="mt-1 font-serif text-2xl">Predicted priority tier</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">The source label is the bank’s historical P1–P4 priority classification. It is not a repayment/default outcome, a calibrated probability of default, or a recommendation to approve or reject a person.</p>
                <div className="mt-5 space-y-3">{(["gradient_boosting", "xgboost", "random_forest"] as const).map((key) => <div key={key} className="flex items-center justify-between gap-3 border-t border-hairline pt-3"><span className="text-sm">{key === "gradient_boosting" ? "Gradient Boosting" : key === "xgboost" ? "XGBoost" : "Random Forest"}</span><strong className="font-serif text-xl">{result[key].priority_class} <span className="font-sans text-sm font-normal text-muted-foreground">{(result[key].confidence * 100).toFixed(1)}% class probability</span></strong></div>)}</div>
                <p className="mt-5 border-t border-hairline pt-4 text-xs leading-relaxed text-muted-foreground">Fairness what-if: gender {result.fairness.gender} / {result.fairness.marital_status} → {result.fairness.current_priority}; switching gender → {result.fairness.other_gender_priority}; switching marital status → {result.fairness.other_marital_priority}. The model output stays fixed because these sensitive attributes are excluded from training and scoring. This removes direct use, but does not prove that other correlated features are fair.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">{(["GENDER", "MARITALSTATUS"] as const).map((field) => <div key={field} className="rounded-lg bg-secondary/40 p-3"><p className="kicker">Holdout label mix by {field === "GENDER" ? "gender" : "marital status"}</p>{Object.entries(result.fairness.test_group_audit[field] ?? {}).map(([group, stats]) => <p key={group} className="mt-2 text-xs text-muted-foreground"><strong className="text-ink">{group}</strong> · n={stats.count.toLocaleString()} · {(["P1", "P2", "P3", "P4"] as const).map((tier) => `${tier} ${(stats.priority_distribution[tier] * 100).toFixed(0)}%`).join(" / ")}</p>)}</div>)}</div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">These are historical priority-label shares in the held-out sample, not approval rates, default rates, or proof of discrimination. Small groups have less stable estimates.</p>
              </section>
              <section className="rounded-xl border border-hairline bg-paper-raised p-6"><p className="kicker">Feature extraction</p><h2 className="mt-1 font-serif text-xl">Raw profile → model-ready features</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">The training pipeline joins bank and bureau records on the source row ID, then removes that ID so it cannot act as a shortcut. It converts −99999 markers into missing values, fills numeric gaps with training medians and category gaps with the most common training value, then one-hot encodes education and product-enquiry categories. From the account counts it derives three ratios: active accounts / all accounts, missed payments / all accounts, and unsecured accounts / all accounts. The form supplies 16 numeric fields; those ratios make 19 numeric model columns, alongside three encoded categories. Gender and marital status are excluded from scoring and used only for the group audit shown above.</p></section>
            </motion.div>
          ) : (
            <EmptySlip key="empty" error={status === "error"} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
