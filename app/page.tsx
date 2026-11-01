import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Section } from "@/components/editorial/section";
import { Stat } from "@/components/editorial/stat";
import { Figure } from "@/components/editorial/figure";
import { Legend } from "@/components/editorial/legend";
import { Reveal } from "@/components/editorial/reveal";
import { Button } from "@/components/ui/button";
import { DecileStaircase } from "@/components/landing/decile-staircase";
import { CostAsymmetry } from "@/components/landing/cost-asymmetry";
import { DecisionPipeline } from "@/components/landing/decision-pipeline";
import { CalibrationMini } from "@/components/landing/calibration-mini";
import { portfolio, deployedOutcome, decileLift, calibrationGap, brierBaseline } from "@/lib/portfolio";
import { formatPercent } from "@/lib/format";

export const metadata = { title: "Brief", description: "Compare loan-default estimates from Gradient Boosting, XGBoost and Random Forest, with explanations of the primary prediction and evaluation results." };

export default function LandingPage() {
  const { metrics } = portfolio;
  const binsWithinThreePp = portfolio.calibration.filter((b) => Math.abs(b.mean_predicted - b.observed_rate) < 0.03).length;

  return (
    <>
      <section className="relative overflow-hidden border-b border-hairline">
        <div aria-hidden className="grid-paper pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-14 sm:px-6 md:pt-20 lg:grid-cols-12 lg:pb-24">
          <div className="lg:col-span-7">
            <p className="font-serif text-lg text-brand">CredoScore</p>
            <p className="kicker mt-2">Credit risk assessment · UCI German Credit</p>
            <h1 className="display-xl mt-5">
              Estimate loan-default risk.
              <br />
              <span className="italic text-brand">Understand the prediction.</span>
            </h1>
            <p className="lede mt-6 max-w-xl">
              Enter twelve applicant details to compare Gradient Boosting, XGBoost and Random Forest. Each model estimates the probability of default: the chance that a borrower will fail to repay. The main result uses Gradient Boosting and shows which inputs raised or lowered its estimate. The models were trained on 1,000 historical German credit records.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/assess">
                  Assess an applicant <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/portfolio">Explore the dataset</Link>
              </Button>
            </div>
            <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
              <Stat label="ROC-AUC" value={metrics.roc_auc.toFixed(3)} note="How well predictions rank defaulted applicants above those who repaid. Not classification accuracy." />
              <Stat label="KS" value={metrics.ks_statistic.toFixed(3)} note="Separation between the score distributions of defaulted and repaid applicants." />
              <Stat label="Brier" value={metrics.brier_score.toFixed(3)} note={`vs ${brierBaseline.toFixed(3)} if every applicant received the same 30% estimate`} />
              <Stat label="Calibration gap" value={`${(calibrationGap * 100).toFixed(1)}pp`} note="Average group-level gap between predicted and recorded default rates; pp means percentage points." />
            </dl>
          </div>
          <div className="lg:col-span-5">
            <Figure
              number="01"
              title="Default rate by score decile"
              caption={`Applicants are sorted by predicted risk into ten groups of 100, called deciles. The recorded default rate in the highest-risk group is ${decileLift.toFixed(1)} times the rate in the lowest-risk group. Bars show recorded rates; black markers show mean predicted probabilities.`}
            >
              <DecileStaircase deciles={portfolio.deciles} />
              <div className="mt-4">
                <Legend
                  items={[
                    { label: "Observed default rate", color: "var(--band-medium)", shape: "bar" },
                    { label: "Mean predicted default risk", color: "var(--ink)", shape: "line" },
                  ]}
                />
              </div>
            </Figure>
          </div>
        </div>
      </section>

      <Reveal>
        <Section index="01" kicker="The problem" title="What is the model trying to predict?">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="prose-editorial md:col-span-7 md:col-start-4">
              <p>
                The training labels record whether each historical applicant had good or bad credit outcomes. In this dataset, {formatPercent(portfolio.base_default_rate, 0)} were labelled as defaults. The model learns patterns in the applicant details and uses them to estimate default risk for another application.
              </p>
              <p>
                A prediction is a probability, not a certain outcome. A 30% estimate means that about 30 out of 100 comparable applicants would be expected to default if the model is well calibrated. The project then applies an adjustable cutoff to turn that estimate into a suggested lending decision.
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="num text-6xl text-band-high">30%</p>
              <p className="kicker mt-2">Defaulted</p>
            </div>
          </div>
        </Section>
      </Reveal>

      <Reveal>
        <Section
          index="02"
          kicker="Classification error costs"
          tone="raised"
          title="Why approving a default and rejecting a repayment have different costs"
          lede="The dataset defines an illustrative cost matrix: approving an applicant who defaulted has a cost of 5 units, while declining someone who repaid costs 1 unit. We use those weights to compare approval thresholds; they are not measured monetary losses."
        >
          <CostAsymmetry />
          <dl className="mt-10 grid gap-6 sm:grid-cols-3">
            <Stat label="Approved at the 25% cutoff" value={formatPercent(deployedOutcome.approval_rate, 1)} />
            <Stat
              label="Recorded defaults among approvals"
              value={formatPercent(deployedOutcome.approved_bad_rate, 1)}
              tone="low"
              note="Compare with the dataset default rate of 30.0%."
            />
            <Stat
              label="Error cost per applicant"
              value={deployedOutcome.costPerApplicant.toFixed(3)}
              note={`vs ${(portfolio.base_default_rate * 5).toFixed(2)} if everyone were approved, or 0.70 if everyone were declined`}
            />
          </dl>
        </Section>
      </Reveal>

      <Reveal>
        <Section index="03" kicker="The approach" title="From applicant details to a calibrated risk estimate">
          <DecisionPipeline />
        </Section>
      </Reveal>

      <Reveal>
        <Section
          index="04"
          kicker="Probability calibration"
          tone="raised"
          title="Do predicted probabilities match recorded default rates?"
          lede="Calibration compares predictions with group outcomes. For example, a group with an average predicted risk of 30% should have a recorded default rate close to 30%. The chart uses held-out base-model predictions from cross-validation. Tuning and calibration reuse these data, so this is a development check rather than an untouched external test."
        >
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Figure number="02" title="Group-level calibration: predicted risk versus recorded defaults">
                <CalibrationMini bins={portfolio.calibration} />
              </Figure>
            </div>
            <div className="lg:col-span-5">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-8">
                <Stat label="Groups within 3 percentage points" value={`${binsWithinThreePp} of ${portfolio.calibration.length}`} />
                <Stat label="Average calibration gap" value={`${(calibrationGap * 100).toFixed(1)}pp`} />
                <Stat label="Top-decile lift" value={`${decileLift.toFixed(1)}×`} />
                <Stat label="Applicants scored" value="1,000" />
              </dl>
            </div>
          </div>
        </Section>
      </Reveal>

      <section className="bg-forest text-paper">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-20 sm:px-6 lg:grid-cols-3">
          <div>
            <p className="display-md">Assess an applicant or explore the data.</p>
            <p className="mt-4 text-paper/70">Use the assessment form for an individual estimate, or examine how Gradient Boosting scored the historical dataset.</p>
          </div>
          <Link href="/assess" className="group rounded-xl border border-paper/15 p-6 transition-colors hover:border-mint">
            <div className="flex items-start justify-between gap-3">
              <p className="font-serif text-xl">Assess an applicant</p>
              <ArrowUpRight className="size-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-paper/70">
              Compare three model predictions for the same applicant, with a suggested decision and a breakdown of the primary model result.
            </p>
          </Link>
          <Link href="/portfolio" className="group rounded-xl border border-paper/15 p-6 transition-colors hover:border-mint">
            <div className="flex items-start justify-between gap-3">
              <p className="font-serif text-xl">Explore the dataset</p>
              <ArrowUpRight className="size-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-paper/70">
              Examine risk bands, approval thresholds and recorded outcomes for groups of applicants. Each chart explains the quantities it compares.
            </p>
          </Link>
        </div>
      </section>
    </>
  );
}
