import Link from "next/link";

import { BenchmarkTable } from "@/components/model/benchmark-table";
import { CalibrationChart } from "@/components/model/calibration-chart";
import { CutoffTable } from "@/components/model/cutoff-table";
import { ImportanceBars } from "@/components/model/importance-bars";
import { ModelToc } from "@/components/model/model-toc";
import { RocCurveChart } from "@/components/model/roc-curve-chart";
import { Figure } from "@/components/editorial/figure";
import { PageHeader } from "@/components/editorial/page-header";
import { Stat } from "@/components/editorial/stat";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPercent } from "@/lib/format";
import { modelMeta } from "@/lib/model-meta";
import { calibrationGap, cheapestOutcome, cutoffOutcomes, decileLift, portfolio } from "@/lib/portfolio";
import { cn } from "@/lib/utils";
import xgboostRaw from "@/model/model_xgboost.json";
import randomForestRaw from "@/model/model_random_forest.json";

const THREE_MODEL_METRICS = [
  { label: "Gradient Boosting", deployed: true, metrics: portfolio.metrics },
  { label: "XGBoost", metrics: xgboostRaw.metrics as typeof portfolio.metrics },
  { label: "Random Forest", metrics: randomForestRaw.metrics as typeof portfolio.metrics },
];

export const metadata = {
  title: "Methodology",
  description: "How the model was chosen, tuned, calibrated and tested, with plain-language explanations of the results.",
};

const HYPERPARAMETER_MEANINGS: Record<string, string> = {
  n_estimators: "Add 250 trees in sequence. Each tree learns a correction to the current prediction.",
  max_depth: "Limit each tree to three levels of splits. This restricts complexity and helps reduce overfitting.",
  learning_rate: "Multiply each new tree output by 0.05 before adding it. Smaller updates make learning more gradual.",
  subsample: "Fit each new tree on a random 80% of the available training rows to introduce variation.",
  min_samples_leaf: "Require at least 20 training rows in each final leaf. This avoids rules based on very small groups.",
};

export default function ModelPage() {
  const gini = 2 * portfolio.metrics.roc_auc - 1;
  const { max_depth } = modelMeta.hyperparameters;

  return (
    <>
      <PageHeader
        kicker="Methodology"
        title={
          <>
            How the models were <i className="text-brand">built and evaluated</i>
          </>
        }
        lede="Learn how the training data becomes a prediction, how the three models differ, and what their evaluation results tell us. Each section explains the ML term before interpreting the result."
        meta={[`Primary model: ${modelMeta.trees} trees · depth ${max_depth}`, "Three calibrated models", "Python scoring without ML libraries"]}
      />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-3">
          <ModelToc />
        </div>

        <div className="min-w-0 lg:col-span-9">
          <article id="scorecard" className="scroll-mt-32 border-t-0 py-12 first:pt-0">
            <p className="kicker">§ 01</p>
            <h2 className="display-md mt-2">Understanding the evaluation metrics</h2>
            <p className="lede mt-4 max-w-2xl">
              The metrics below describe Gradient Boosting, the primary model. Some measure how well it ranks applicants by risk; others measure how close its probability estimates are to recorded outcomes. A high ranking score does not automatically mean accurate probabilities.
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
              <Stat
                label="ROC-AUC"
                value={portfolio.metrics.roc_auc.toFixed(3)}
                note="Probability that a randomly chosen defaulted applicant receives a higher risk estimate than a repaid applicant. This is not classification accuracy."
              />
              <Stat
                label="PR-AUC"
                value={portfolio.metrics.pr_auc.toFixed(3)}
                note="Precision is the share of flagged applicants who defaulted; recall is the share of actual defaults found. PR-AUC summarises this trade-off across thresholds."
              />
              <Stat
                label="KS"
                value={portfolio.metrics.ks_statistic.toFixed(3)}
                note="Largest separation between the cumulative score distributions of applicants who repaid and those who defaulted."
              />
              <Stat
                label="Brier"
                value={portfolio.metrics.brier_score.toFixed(3)}
                note="Average squared difference between predicted probability and the recorded 0/1 outcome. Lower is better."
              />
            </dl>
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
              <Stat label="Gini" value={gini.toFixed(3)} note="Calculated as 2 × ROC-AUC − 1. Zero corresponds to random ranking; one to perfect ranking." />
              <Stat
                label="Top-decile lift"
                value={`${decileLift.toFixed(1)}×`}
                note="Observed default rate in the highest-risk 10%, divided by the rate in the lowest-risk 10%."
              />
              <Stat
                label="Calibration gap"
                value={`${(calibrationGap * 100).toFixed(1)}pp`}
                note="Average absolute gap between predicted and recorded group default rates, weighted by group size. pp means percentage points."
              />
              <Stat label="Base rate" value={formatPercent(portfolio.base_default_rate, 0)} note="Recorded default proportion in this dataset: 300 of 1,000 applicants." />
            </dl>
          </article>

          <article id="benchmark" className="scroll-mt-32 border-t border-hairline py-12">
            <p className="kicker">§ 02</p>
            <h2 className="display-md mt-2">Four model families, evaluated on the same splits</h2>
            <p className="lede mt-4 max-w-2xl">
              Cross-validation tests a model on data excluded from its training. We divide the 1,000 rows into five groups, or folds, keeping a similar proportion of defaults in each. A model trains on four groups and predicts the fifth; this repeats until every row has an out-of-fold prediction. The table includes four model families and a separately tuned Gradient Boosting configuration.
            </p>
            <div className="mt-8">
              <BenchmarkTable benchmark={portfolio.benchmark} />
            </div>
            <p className="prose-editorial mt-6 max-w-3xl text-sm">
              The horizontal intervals show the mean score plus or minus one standard deviation (SD). SD describes how much the scores vary across the five folds; it is not a guarantee about future performance. Tuned Gradient Boosting achieved the highest search score here, but the differences are small. Its search score is a different evaluation stage from the final calibrated metrics shown above. All three deployed tree ensembles are exported as JSON for Python scoring.
            </p>
          </article>

          <article id="tuning" className="scroll-mt-32 border-t border-hairline py-12">
            <p className="kicker">§ 03</p>
            <h2 className="display-md mt-2">Tuning</h2>
            <p className="lede mt-4 max-w-2xl">
              Hyperparameters are settings chosen before fitting, such as tree depth and learning rate. RandomizedSearchCV tried 40 combinations and compared their five-fold ROC-AUC scores. The values below are the selected Gradient Boosting settings; they control how much complexity each tree can learn.
            </p>
            <dl className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {Object.entries(modelMeta.hyperparameters).map(([key, value]) => (
                <div key={key} className="border-t border-hairline pt-3">
                  <dt className="num text-sm">
                    {key} <span className="text-muted-foreground">= {value}</span>
                  </dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {HYPERPARAMETER_MEANINGS[key] ?? "No description recorded."}
                  </dd>
                </div>
              ))}
            </dl>
          </article>

          <article id="discrimination" className="scroll-mt-32 border-t border-hairline py-12">
            <p className="kicker">§ 04</p>
            <h2 className="display-md mt-2">Ranking applicants by default risk</h2>
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <Figure
                number="04"
                title="ROC curve, out-of-fold"
                caption={`ROC-AUC ${portfolio.metrics.roc_auc.toFixed(3)}. The dashed diagonal represents random ranking.`}
              >
                <RocCurveChart points={portfolio.roc_curve} />
              </Figure>
              <div className="prose-editorial text-sm lg:self-center">
                <p>
              Discrimination means separating applicants who later defaulted from those who repaid. A KS statistic of {portfolio.metrics.ks_statistic.toFixed(3)} measures the largest gap between their cumulative score distributions. Zero means no separation; a larger value indicates stronger separation in this dataset.
            </p>
                <p>
              The ROC curve plots the proportion of defaults correctly flagged against the proportion of repaid applicants incorrectly flagged, across different thresholds. A curve above the diagonal indicates better-than-random ranking. It does not tell us whether a predicted 30% risk is well calibrated.
            </p>
              </div>
            </div>
          </article>

          <article id="calibration" className="scroll-mt-32 border-t border-hairline py-12">
            <p className="kicker">§ 05</p>
            <h2 className="display-md mt-2">Calibration</h2>
            <p className="lede mt-4 max-w-2xl">
              Calibration checks whether predicted probabilities match group outcomes. If 100 comparable applicants receive estimates close to 30%, we would expect about 30 to default and about 70 to repay if the model is well calibrated. This is a statement about a group, not a promise about one applicant or a claim that the model is wrong 30% of the time.
            </p>
            <div className="mt-8">
              <Figure number="05" title="Predicted risk versus recorded defaults, grouped by probability">
                <CalibrationChart bins={portfolio.calibration} />
              </Figure>
            </div>
            <div className="mt-8 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bin</TableHead>
                    <TableHead>Applicants</TableHead>
                    <TableHead>Mean predicted risk</TableHead>
                    <TableHead>Recorded default rate</TableHead>
                    <TableHead>Gap (percentage points)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {portfolio.calibration.map((bin) => {
                    const gapPp = (bin.observed_rate - bin.mean_predicted) * 100;
                    const overThreshold = Math.abs(gapPp) > 3;
                    return (
                      <TableRow key={bin.bin_start}>
                        <TableCell className="num">
                          {formatPercent(bin.bin_start, 0)}–{formatPercent(bin.bin_end, 0)}
                        </TableCell>
                        <TableCell className="num">{bin.count}</TableCell>
                        <TableCell className="num">{formatPercent(bin.mean_predicted, 1)}</TableCell>
                        <TableCell className="num">{formatPercent(bin.observed_rate, 1)}</TableCell>
                        <TableCell className={cn("num", overThreshold && "text-band-medium")}>
                          {gapPp > 0 ? "+" : ""}
                          {gapPp.toFixed(1)}pp
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <p className="prose-editorial mt-6 max-w-3xl text-sm">
              Platt scaling fits a logistic mapping to raw model scores: P = sigmoid(A × raw score + B). For Gradient Boosting, A = {modelMeta.plattA.toFixed(4)} and B = {modelMeta.plattB.toFixed(4)}. The chart groups predictions into probability ranges; points near the diagonal have similar predicted and recorded default rates. The calibrator was fitted and assessed using the same out-of-fold pairs, and tuning reused these folds, so a separate test set or nested validation would provide a stronger evaluation. Calibration on this sample does not guarantee calibration for new borrowers.
            </p>
          </article>

          <article id="drivers" className="scroll-mt-32 border-t border-hairline py-12">
            <p className="kicker">§ 06</p>
            <h2 className="display-md mt-2">Which input features influence the model?</h2>
            <p className="lede mt-4 max-w-2xl">
              Feature importance measures how much an input helped the trees reduce training error at their splits. The chart combines the one-hot category columns back into the twelve original fields. Longer bars indicate greater overall importance, not whether the field raises or lowers risk for a particular person.
            </p>
            <div className="mt-8">
              <ImportanceBars rows={portfolio.feature_importance} />
            </div>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              The applicant-level waterfall is a separate explanation: it assigns changes along the tree paths to the input fields for one prediction. In a notebook check, its top factors overlapped with offline TreeSHAP for 93 of 100 sampled applicants by at least three of the top five factors. That check does not make impurity importance a SHAP explanation, or establish that any feature causes default.
            </p>
          </article>

          <article id="cutoff" className="scroll-mt-32 border-t border-hairline py-12">
            <p className="kicker">§ 07</p>
            <h2 className="display-md mt-2">Choosing the cutoff</h2>
            <p className="lede mt-4 max-w-2xl">
              A cutoff is the probability threshold used to label a loan as approved or declined in this portfolio simulation. We assign 5 cost units to approving a borrower who defaulted and 1 unit to declining someone who repaid. Under perfectly calibrated probabilities, equal expected costs occur at 1 ÷ (1 + 5), or about 17%. The lowest measured cost on our tested grid is at {formatPercent(cheapestOutcome.cutoff, 0)} ({cheapestOutcome.costPerApplicant.toFixed(3)} units per applicant). The app instead starts at {formatPercent(modelMeta.cutoff, 0)}, which approves more applicants. These costs and the default cutoff are project assumptions, not a bank policy.
            </p>
            <div className="mt-8">
              <CutoffTable outcomes={cutoffOutcomes} />
            </div>
            <p className="mt-6">
              <Link href="/assess" className="link-underline text-sm">
                Try it on one applicant →
              </Link>
            </p>
          </article>

          <article id="three-models" className="scroll-mt-32 border-t border-hairline py-12">
            <p className="kicker">§ 08</p>
            <h2 className="display-md mt-2">How the three models are used</h2>
            <p className="lede mt-4 max-w-2xl">
              Each assessment request runs Gradient Boosting, XGBoost and Random Forest on the same twelve inputs. The interface shows a separate default probability, risk band and recommendation for each model. Gradient Boosting remains the primary result; the application does not average the three predictions or decide by majority vote.
            </p>
            <div className="prose-editorial mt-6 max-w-3xl space-y-4 text-sm">
              <p>
              Gradient Boosting builds 250 shallow trees in sequence, with each tree correcting the current prediction. XGBoost also uses sequential boosting, with 200 trees and regularised training. Random Forest builds 300 separate trees using sampled rows and random feature subsets, then averages their probabilities. Each model has its own calibration mapping. They share the same training data, so agreement is useful context but is not independent proof that a prediction is correct.
            </p>
              <p>
              The displayed waterfall and adjustable assessment cutoff use Gradient Boosting. The API also returns tree-path contributions for XGBoost, but its explanation is not displayed as a second waterfall. Random Forest returns a probability, band, score and decision without a contribution breakdown. An explanation describes the model calculation; it does not establish a causal relationship.
            </p>
            </div>
            <div className="mt-8 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>ROC-AUC</TableHead>
                    <TableHead>PR-AUC</TableHead>
                    <TableHead>KS</TableHead>
                    <TableHead>Brier</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {THREE_MODEL_METRICS.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell>
                        <span className="flex items-center gap-2">
                          {row.label}
                          {row.deployed ? <Badge variant="default">Deployed</Badge> : null}
                        </span>
                      </TableCell>
                      <TableCell className="num">{row.metrics.roc_auc.toFixed(3)}</TableCell>
                      <TableCell className="num">{row.metrics.pr_auc.toFixed(3)}</TableCell>
                      <TableCell className="num">{row.metrics.ks_statistic.toFixed(3)}</TableCell>
                      <TableCell className="num">{row.metrics.brier_score.toFixed(3)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Each row summarises that model&apos;s calibrated out-of-fold results on the same five splits. These development estimates are not results from an untouched external test set.
            </p>
            <p className="mt-6">
              <Link href="/assess" className="link-underline text-sm">
                See all three scored on one applicant →
              </Link>
            </p>
          </article>

          <article id="limitations" className="scroll-mt-32 border-t border-hairline py-12">
            <p className="kicker">§ 09</p>
            <h2 className="display-md mt-2">Limitations</h2>
            <ol className="prose-editorial mt-6 max-w-2xl space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="num shrink-0 text-band-high">01</span>
                <span>
                  The data is small and old: 1,000 applicants from one German bank, recorded in 1994, with amounts in
                  Deutsche Marks.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="num shrink-0 text-band-high">02</span>
                <span>
                  The model scores are close and vary between cross-validation folds. A small difference in average AUC is not enough to establish that one model will always perform better.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="num shrink-0 text-band-high">03</span>
                <span>
                  Some credit-history groups have counterintuitive observed risk in this small dataset. The cause has not been established, so these patterns should not be treated as general lending rules.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="num shrink-0 text-band-high">04</span>
                <span>
                  There is no fairness or disparate-impact audit. Excluding sex and marital status is a precaution,
                  not an audit.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="num shrink-0 text-band-high">05</span>
                <span>The average calibration gap summarises this sample. Individual groups can have larger gaps, and the calibrator has not been evaluated on an untouched external dataset.</span>
              </li>
            </ol>
            <div className="mt-8 rounded-xl bg-forest px-6 py-5 text-paper">
              <p className="font-serif text-lg">Not for real lending decisions.</p>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
