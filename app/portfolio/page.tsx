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
    "All 1,000 applicants in the UCI German Credit book, scored out-of-fold and broken down by risk band, cutoff, decile and segment.",
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
            All 1,000 applicants, <i className="text-brand">scored blind.</i>
          </>
        }
        lede="Every number here comes from out-of-fold predictions. Each applicant was scored by a model that never saw them in training, so this is a fair read on how the model handles new borrowers."
        meta={["5-fold out-of-fold", "1,000 applicants", "Cost matrix 5 : 1"]}
      />

      <Section index="01" kicker="Risk bands" title="How the book splits">
        <BandSplit bandCounts={portfolio.band_counts} total={portfolio.total_applicants} baseDefaultRate={portfolio.base_default_rate} />
      </Section>

      <Section
        index="02"
        kicker="Cutoff explorer"
        tone="raised"
        title="Pick a cutoff, see the trade"
        lede="A lower cutoff turns more people away and lets fewer defaults through. Drag it and watch approvals, defaults and total cost move together."
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
        lede={`Applicants sorted into ten equal groups by predicted risk. A good model shows the observed rate climbing step by step, and it does: from ${d1} to ${d10}.`}
      >
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Figure number="03" title="Observed vs predicted, by decile">
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
        title="Where the risk sits"
        lede="Default rate and average predicted risk by loan purpose, job tenure, housing and job type. When the dot sits on the bar's end, the model has that segment right."
      >
        <SegmentExplorer segments={portfolio.segments} baseRate={portfolio.base_default_rate} />
      </Section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <p className="text-sm text-muted-foreground">
          &ldquo;{portfolio.cost_matrix.note}&rdquo; Rates in segments with fewer than 25 applicants move a lot from fold to
          fold. Read them as rough.
        </p>
      </div>
    </>
  );
}
