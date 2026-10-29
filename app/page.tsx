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

export const metadata = { title: "Brief", description: "A calibrated gradient boosting model for loan default risk, trained on the UCI German Credit data." };

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
              Every approval is a bet.
              <br />
              <span className="italic text-brand">This model prices the odds.</span>
            </h1>
            <p className="lede mt-6 max-w-xl">
              A gradient boosting model trained on 1,000 real loan files. It is calibrated, so a 30% score means
              about 30 in 100 such borrowers default. It runs with no ML libraries at request time, and it shows
              which factors moved every single score.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/assess">
                  Assess an applicant <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/portfolio">Read the book</Link>
              </Button>
            </div>
            <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
              <Stat label="ROC-AUC" value={metrics.roc_auc.toFixed(3)} note="Ranking power, out-of-fold" />
              <Stat label="KS" value={metrics.ks_statistic.toFixed(3)} note="Gap between good and bad score curves" />
              <Stat label="Brier" value={metrics.brier_score.toFixed(3)} note={`vs ${brierBaseline.toFixed(3)} for a flat guess`} />
              <Stat label="Calibration gap" value={`${(calibrationGap * 100).toFixed(1)}pp`} note="Mean miss, weighted by bin" />
            </dl>
          </div>
          <div className="lg:col-span-5">
            <Figure
              number="01"
              title="Default rate by score decile"
              caption={`The riskiest tenth of applicants defaulted ${decileLift.toFixed(1)}× as often as the safest tenth, and the model's predictions (black ticks) track what actually happened.`}
            >
              <DecileStaircase deciles={portfolio.deciles} />
              <div className="mt-4">
                <Legend
                  items={[
                    { label: "Observed default rate", color: "var(--band-medium)", shape: "bar" },
                    { label: "Mean predicted PD", color: "var(--ink)", shape: "line" },
                  ]}
                />
              </div>
            </Figure>
          </div>
        </div>
      </section>

      <Reveal>
        <Section index="01" kicker="The problem" title="A lender sees an application, not a future.">
          <div className="grid gap-10 md:grid-cols-12">
            <div className="prose-editorial md:col-span-7 md:col-start-4">
              <p>
                On the day they sign, almost every applicant looks able to pay. Some won&rsquo;t. In this book,{" "}
                {formatPercent(portfolio.base_default_rate, 0)} of approved loans went bad.
              </p>
              <p>
                So the useful question isn&rsquo;t &ldquo;will this person default?&rdquo;. It&rsquo;s &ldquo;how
                likely is it, and how should that change the terms we offer?&rdquo; A score only helps if its
                numbers can be taken at face value.
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
          kicker="The asymmetry"
          tone="raised"
          title="Not every mistake costs the same."
          lede="The dataset ships with its own cost matrix. Approving someone who then defaults costs five times as much as turning away someone who would have paid."
        >
          <CostAsymmetry />
          <dl className="mt-10 grid gap-6 sm:grid-cols-3">
            <Stat label="Approved at the 25% cutoff" value={formatPercent(deployedOutcome.approval_rate, 1)} />
            <Stat
              label="Of those, defaulted"
              value={formatPercent(deployedOutcome.approved_bad_rate, 1)}
              tone="low"
              note="vs 30.0% if everyone were approved"
            />
            <Stat
              label="Cost per applicant"
              value={deployedOutcome.costPerApplicant.toFixed(3)}
              note={`vs ${(portfolio.base_default_rate * 5).toFixed(2)} if everyone were approved, or 0.70 if everyone were declined`}
            />
          </dl>
        </Section>
      </Reveal>

      <Reveal>
        <Section index="03" kicker="The approach" title="One tuned ensemble, calibrated, with every score explained.">
          <DecisionPipeline />
        </Section>
      </Reveal>

      <Reveal>
        <Section
          index="04"
          kicker="Honest numbers"
          tone="raised"
          title="When it says 30%, about 30% default."
          lede="Every number on this site comes from out-of-fold predictions, made by a model that never saw that applicant during training."
        >
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Figure number="02" title="Calibration: predicted vs observed">
                <CalibrationMini bins={portfolio.calibration} />
              </Figure>
            </div>
            <div className="lg:col-span-5">
              <dl className="grid grid-cols-2 gap-x-6 gap-y-8">
                <Stat label="Bins within 3pp" value={`${binsWithinThreePp} of ${portfolio.calibration.length}`} />
                <Stat label="Weighted gap" value={`${(calibrationGap * 100).toFixed(1)}pp`} />
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
            <p className="display-md">Two ways in.</p>
            <p className="mt-4 text-paper/70">Start with one applicant, or see the whole book at once.</p>
          </div>
          <Link href="/assess" className="group rounded-xl border border-paper/15 p-6 transition-colors hover:border-mint">
            <div className="flex items-start justify-between gap-3">
              <p className="font-serif text-xl">Assess an applicant</p>
              <ArrowUpRight className="size-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-paper/70">
              Enter one applicant&rsquo;s details. Get a probability of default, a recommendation, and the factors
              behind it.
            </p>
          </Link>
          <Link href="/portfolio" className="group rounded-xl border border-paper/15 p-6 transition-colors hover:border-mint">
            <div className="flex items-start justify-between gap-3">
              <p className="font-serif text-xl">Explore the book</p>
              <ArrowUpRight className="size-5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-paper/70">
              See how all 1,000 applicants score out-of-fold, by band, by decile and by segment.
            </p>
          </Link>
        </div>
      </section>
    </>
  );
}
