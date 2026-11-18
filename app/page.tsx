import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Stat } from "@/components/editorial/stat";
import { Button } from "@/components/ui/button";
import { portfolio, brierBaseline } from "@/lib/portfolio";

export const metadata = { title: "Brief", description: "Compare loan-default estimates from Gradient Boosting, XGBoost and Random Forest, with explanations of the primary prediction and evaluation results." };

export default function LandingPage() {
  const { metrics } = portfolio;

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="grid-paper pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
        <p className="font-serif text-lg text-brand">CredoScore</p>
        <p className="kicker mt-2">Credit risk assessment · UCI German Credit</p>
        <h1 className="display-xl mt-5">
          Estimate loan-default risk.
          <br />
          <span className="italic text-brand">Understand the prediction.</span>
        </h1>
        <p className="lede mt-6 max-w-xl">
          Enter thirteen applicant details, including the source dataset&apos;s combined sex and personal-status group, to compare Gradient Boosting, XGBoost and Random Forest. Each model estimates the probability of default: the chance that a borrower will fail to repay. The main result uses Gradient Boosting and shows which inputs raised or lowered its estimate. The models were trained on 1,000 historical German credit records.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/assess">
              Assess an applicant <ArrowRight />
            </Link>
          </Button>
        </div>
        <dl className="mt-12 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-3">
          <Stat label="ROC-AUC" value={metrics.roc_auc.toFixed(3)} note="How well predictions rank defaulted applicants above those who repaid. Not classification accuracy." />
          <Stat label="KS" value={metrics.ks_statistic.toFixed(3)} note="Separation between the score distributions of defaulted and repaid applicants." />
          <Stat label="Brier" value={metrics.brier_score.toFixed(3)} note={`vs ${brierBaseline.toFixed(3)} if every applicant received the same 30% estimate`} />
        </dl>
      </div>
    </section>
  );
}
