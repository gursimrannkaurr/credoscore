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
  description: "How the model was chosen, tuned, calibrated and tested, including the candidates that lost.",
};

const HYPERPARAMETER_MEANINGS: Record<string, string> = {
  n_estimators: "250 shallow trees are added one after another, each correcting the last one's mistakes.",
  max_depth: "each tree splits at most 3 levels deep, so no single tree can memorise the data.",
  learning_rate: "each tree's vote is shrunk to 5% before it's added, so no one tree can dominate the score.",
  subsample: "each tree sees a random 80% of rows, which keeps the trees from all learning the same pattern.",
  min_samples_leaf: "a leaf needs at least 20 rows behind it before the tree is allowed to form it.",
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
            How the model was <i className="text-brand">built and checked</i>
          </>
        }
        lede="How it was chosen, tuned, calibrated and tested, including the candidates that lost."
        meta={[`${modelMeta.trees} trees · depth ${max_depth}`, "Platt-calibrated", "No ML runtime dependencies"]}
      />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <ModelToc />
        </div>

        <div className="lg:col-span-9">
          <article id="scorecard" className="scroll-mt-32 border-t-0 py-12 first:pt-0">
            <p className="kicker">§ 01</p>
            <h2 className="display-md mt-2">The scorecard</h2>
            <p className="lede mt-4 max-w-2xl">
              Four numbers summarise how well the model ranks and prices risk. All of them come from out-of-fold
              predictions, never from rows the model trained on.
            </p>
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
              <Stat
                label="ROC-AUC"
                value={portfolio.metrics.roc_auc.toFixed(3)}
                note="Chance a random defaulter scores riskier than a random payer."
              />
              <Stat
                label="PR-AUC"
                value={portfolio.metrics.pr_auc.toFixed(3)}
                note="Precision and recall on the default class, which the 70/30 split favours less than AUC."
              />
              <Stat
                label="KS"
                value={portfolio.metrics.ks_statistic.toFixed(3)}
                note="The widest gap between the good and bad score curves."
              />
              <Stat
                label="Brier"
                value={portfolio.metrics.brier_score.toFixed(3)}
                note="Mean squared error of the probability itself. Lower is better."
              />
            </dl>
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
              <Stat label="Gini" value={gini.toFixed(3)} note="2 × AUC − 1, the same ranking power on a 0 to 1 scale." />
              <Stat
                label="Top-decile lift"
                value={`${decileLift.toFixed(1)}×`}
                note="How much riskier the worst tenth of applicants is than the safest tenth."
              />
              <Stat
                label="Calibration gap"
                value={`${(calibrationGap * 100).toFixed(1)}pp`}
                note="Mean miss between predicted and observed default rate, weighted by bin."
              />
              <Stat label="Base rate" value={formatPercent(portfolio.base_default_rate, 0)} note="Share of the book that defaulted." />
            </dl>
          </article>

          <article id="benchmark" className="scroll-mt-32 border-t border-hairline py-12">
            <p className="kicker">§ 02</p>
            <h2 className="display-md mt-2">Five candidates, identical folds</h2>
            <p className="lede mt-4 max-w-2xl">
              Every model was cross-validated on the same five stratified folds before any tuning, so the comparison
              is fair.
            </p>
            <div className="mt-8">
              <BenchmarkTable benchmark={portfolio.benchmark} />
            </div>
            <p className="prose-editorial mt-6 max-w-3xl text-sm">
              XGBoost beat untuned gradient boosting by a hair, well inside fold-to-fold noise. Tuned gradient
              boosting won on AUC, and it had a second advantage: its trees flatten into plain JSON that a few lines
              of standard-library Python can walk. The live API needs no scikit-learn at all.
            </p>
          </article>

          <article id="tuning" className="scroll-mt-32 border-t border-hairline py-12">
            <p className="kicker">§ 03</p>
            <h2 className="display-md mt-2">Tuning</h2>
            <p className="lede mt-4 max-w-2xl">
              A randomised search drew 40 settings from the grid below and scored each by 5-fold ROC-AUC.
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
            <h2 className="display-md mt-2">Telling good from bad</h2>
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <Figure
                number="04"
                title="ROC curve, out-of-fold"
                caption={`AUC ${portfolio.metrics.roc_auc.toFixed(3)}. The dashed line is a coin flip.`}
              >
                <RocCurveChart points={portfolio.roc_curve} />
              </Figure>
              <div className="prose-editorial text-sm lg:self-center">
                <p>
                  The KS statistic of {portfolio.metrics.ks_statistic.toFixed(3)} is the widest vertical gap between
                  the cumulative share of good payers and the cumulative share of defaulters, read along the score
                  axis. A model that couldn&apos;t tell them apart would have a KS near 0. This one separates most of
                  the book well before the middle of the score range.
                </p>
                <p>
                  The ROC curve tells the same story from a different angle: at almost every false-positive rate, the
                  model catches a disproportionate share of the true defaulters, which is why the curve bows well
                  above the diagonal.
                </p>
              </div>
            </div>
          </article>

          <article id="calibration" className="scroll-mt-32 border-t border-hairline py-12">
            <p className="kicker">§ 05</p>
            <h2 className="display-md mt-2">Calibration</h2>
            <p className="lede mt-4 max-w-2xl">
              Ranking risk correctly isn&apos;t enough. A score also has to mean what it says: a 30% prediction should
              be wrong about 30% of the time, not 10% or 50%.
            </p>
            <div className="mt-8">
              <Figure number="05" title="Predicted vs observed, ten bins">
                <CalibrationChart bins={portfolio.calibration} />
              </Figure>
            </div>
            <div className="mt-8 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bin</TableHead>
                    <TableHead>N</TableHead>
                    <TableHead>Predicted</TableHead>
                    <TableHead>Observed</TableHead>
                    <TableHead>Gap</TableHead>
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
              The raw score from the trees is just a margin, not a probability. Platt scaling fits a sigmoid on top
              of it, P = σ(A·raw + B), with A = {modelMeta.plattA.toFixed(4)} and B = {modelMeta.plattB.toFixed(4)},
              so the output reads as a real probability of default. scikit-learn&apos;s own{" "}
              <code className="num rounded bg-paper-sunken px-1.5 py-0.5 text-[0.85em]">CalibratedClassifierCV</code>{" "}
              was skipped because its ensemble of calibrators doesn&apos;t flatten into a single transform that a
              standard-library function can replay at request time.
            </p>
          </article>

          <article id="drivers" className="scroll-mt-32 border-t border-hairline py-12">
            <p className="kicker">§ 06</p>
            <h2 className="display-md mt-2">What the model leans on</h2>
            <p className="lede mt-4 max-w-2xl">
              Ranked by impurity-based importance, summed from the one-hot columns back to the twelve original
              fields.
            </p>
            <div className="mt-8">
              <ImportanceBars rows={portfolio.feature_importance} />
            </div>
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
              Checked against TreeSHAP in the notebook (test 8): for 93 of 100 applicants, at least three of the top
              five factors match.
            </p>
          </article>

          <article id="cutoff" className="scroll-mt-32 border-t border-hairline py-12">
            <p className="kicker">§ 07</p>
            <h2 className="display-md mt-2">Choosing the cutoff</h2>
            <p className="lede mt-4 max-w-2xl">
              A bad approval costs five times a wrongful decline, so the break-even probability is about
              1 ÷ (1 + 5) ≈ 17%. The cheapest point on the tested grid is {formatPercent(cheapestOutcome.cutoff, 0)},
              close to that estimate, at a cost of {cheapestOutcome.costPerApplicant.toFixed(3)} per applicant. The
              model is deployed at {formatPercent(modelMeta.cutoff, 0)}, a little looser, which keeps approvals above
              half the book.
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
            <h2 className="display-md mt-2">Three models, one decision</h2>
            <p className="lede mt-4 max-w-2xl">
              The live scoring API doesn&apos;t run Gradient Boosting alone. It also runs XGBoost and Random Forest on
              every applicant, and shows all three results side by side on the Assess page.
            </p>
            <div className="prose-editorial mt-6 max-w-3xl space-y-4 text-sm">
              <p>
                The dataset behind this project is 1,000 rows. A single model&apos;s self-reported AUC on a book that
                small can look reassuring and still be one unlucky fold away from a different number. Running three
                models that were trained independently, on the same rows but with different mechanics, and checking
                whether they land on the same verdict is a cheaper and more honest trust signal than squeezing out
                another fraction of a point on any one model&apos;s own cross-validation.
              </p>
              <p>
                Only Gradient Boosting&apos;s score comes with the factor-by-factor waterfall. XGBoost is scored the
                same additive way under the hood, so its own contributions come along for free and are included in
                the API response, but the interface treats both XGBoost and Random Forest as a corroborating
                signal, not a second full explanation. Random Forest in particular combines its 300 trees by
                averaging predicted probabilities rather than by summing log-odds, so a feature-by-feature breakdown
                would mean something different and isn&apos;t exposed at all.
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
              All three metrics come from each model&apos;s own out-of-fold predictions on the same five folds.
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
                  The top candidates sit within about 1.5 AUC points of each other, a gap comparable to fold-to-fold
                  noise.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="num shrink-0 text-band-high">03</span>
                <span>
                  &ldquo;All credits paid duly&rdquo; scores worse than &ldquo;critical account&rdquo;, an odd quirk
                  that is probably a thin-file effect rather than a real signal.
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
                <span>Calibration holds within about 2 percentage points, but it has not been formally certified.</span>
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
