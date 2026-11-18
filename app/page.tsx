import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Stat } from "@/components/editorial/stat";
import { Button } from "@/components/ui/button";
export const metadata = { title: "Brief", description: "Explore Indian bank and CIBIL credit-priority classification with Gradient Boosting, XGBoost and Random Forest." };

export default function LandingPage() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="grid-paper pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
        <p className="font-serif text-lg text-brand">CredoScore</p>
        <p className="kicker mt-2">Indian bank and CIBIL credit profile</p>
        <h1 className="display-xl mt-5">
          Classify a credit profile.
          <br />
          <span className="italic text-brand">Understand the prediction.</span>
        </h1>
        <p className="lede mt-6 max-w-xl">
          Enter an Indian credit profile and compare Gradient Boosting, XGBoost and Random Forest predictions of the dataset&apos;s P1–P4 bank priority class. The public sample contains 51,336 records with bank account activity, credit-bureau payment history and applicant details. Gender and marital status are excluded from scoring and available only for a fairness check.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/assess">
              Assess a credit profile <ArrowRight />
            </Link>
          </Button>
        </div>
        <dl className="mt-12 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-3">
          <Stat label="Source records" value="51,336" note="Matched rows from bank and CIBIL workbooks." />
          <Stat label="Target" value="P1–P4" note="Historical bank priority classes; not future default outcomes." />
          <Stat label="Models" value="03" note="Gradient Boosting, XGBoost and Random Forest." />
        </dl>
      </div>
    </section>
  );
}
