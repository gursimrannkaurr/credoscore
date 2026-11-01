import { BandSplit } from "@/components/portfolio/band-split";
import { CutoffExplorer } from "@/components/portfolio/cutoff-explorer";
import { DecileChart } from "@/components/portfolio/decile-chart";
import { DecileTable } from "@/components/portfolio/decile-table";
import { SegmentExplorer } from "@/components/portfolio/segment-explorer";
import { Figure } from "@/components/editorial/figure";
import { PageHeader } from "@/components/editorial/page-header";
import { Section } from "@/components/editorial/section";
import { formatPercent } from "@/lib/format";
import { cheapestOutcome, cutoffOutcomes, DEPLOYED_CUTOFF, portfolio } from "@/lib/portfolio";

export const metadata = {
  title: "The book",
  description:
    "Explore Gradient Boosting predictions for 1,000 historical applicants, with explanations of risk bands, approval thresholds, deciles and borrower groups.",
};

export default function PortfolioPage() {
  const deciles = portfolio.deciles;
  const d1 = formatPercent(deciles[0].observed_default_rate, 0);
  const d10 = formatPercent(deciles[deciles.length - 1].observed_default_rate, 0);

  return (
    <>
      <PageHeader
        kicker="Portfolio view"
        title={
          <>
            Default-risk estimates for <i className="text-brand">1,000 historical applicants.</i>
          </>
        }
        lede="This page uses Gradient Boosting predictions from five-fold cross-validation: each applicant was scored by a base model trained on the other folds. Here, the book means the historical dataset, not a live lending portfolio. Calibration and tuning reused these data, so the results are development estimates rather than an independent test on new borrowers."
        meta={["5-fold out-of-fold", "1,000 applicants", "Error costs: 5 units versus 1"]}
      />

      <Section index="01" kicker="Risk bands" title="Applicants grouped by predicted risk" lede="Probability of default (PD) estimates how likely a borrower is to fail to repay. These bands group applicants by that estimate: low below 15%, medium from 15% to below 35%, and high at 35% or above. Band membership does not tell us whether an individual actually defaulted.">
        <BandSplit bandCounts={portfolio.band_counts} total={portfolio.total_applicants} baseDefaultRate={portfolio.base_default_rate} />
      </Section>

      <Section
        index="02"
        kicker="Cutoff explorer"
        tone="raised"
        title="How the approval threshold changes outcomes"
        lede="The cutoff is the risk level below which this simulation approves an applicant. Lowering it usually reduces approvals and defaults among approved applicants, while rejecting more people who repaid. Move the slider to compare the recorded outcomes and the cost of these two errors; the model probabilities stay unchanged."
      >
        <CutoffExplorer
          outcomes={cutoffOutcomes}
          deployed={DEPLOYED_CUTOFF}
          cheapest={cheapestOutcome.cutoff}
          n={portfolio.total_applicants}
        />
      </Section>

      <Section
        index="03"
        kicker="Rank ordering"
        title="Default rate by score decile"
        lede={`A decile is one of ten equal-sized groups. We sort applicants from lowest to highest predicted default risk, then put 100 applicants in each group. The recorded default rate rises from ${d1} in the lowest-risk group to ${d10} in the highest-risk group. Compare the bars (recorded defaults) with the line (mean predicted risk) to see how closely they match.`}
      >
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Figure number="03" title="Recorded default rate and predicted risk in each decile">
              <DecileChart deciles={deciles} />
            </Figure>
          </div>
          <div className="lg:col-span-5">
            <DecileTable deciles={deciles} />
          </div>
        </div>
      </Section>

      <Section
        index="04"
        kicker="Segments"
        tone="raised"
        title="Risk estimates for different borrower groups"
        lede="A segment is a group of applicants sharing a loan purpose, employment period, housing status or job type. Each bar shows the recorded default rate; the dot shows mean predicted risk. A close match means the group average is well estimated in this sample, even though individual predictions can still be wrong. The dashed marker is the overall 30% default rate."
      >
        <SegmentExplorer segments={portfolio.segments} baseRate={portfolio.base_default_rate} />
      </Section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <p className="text-sm text-muted-foreground">
          The cost calculation uses 5 units for an approved applicant who defaulted and 1 unit for a declined applicant who repaid. These are illustrative dataset costs, not measured financial losses. Groups with fewer than 25 applicants are marked as small samples because a few outcomes can change their rates substantially.
        </p>
      </div>
    </>
  );
}
