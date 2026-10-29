import { AssessWorkbench } from "@/components/assess/assess-workbench";
import { PageHeader } from "@/components/editorial/page-header";
import { modelMeta } from "@/lib/model-meta";

export const metadata = { title: "Assess an applicant", description: "Score one loan applicant and see which factors moved the score." };

export default function AssessPage() {
  return (
    <>
      <PageHeader
        kicker="Single applicant"
        title={<>Score one applicant. <span className="italic text-brand">See why.</span></>}
        lede="Fill in the twelve fields a loan officer would have on file. You get a probability of default, a risk band, a recommendation, and an exact breakdown of what pushed the number up or down."
        meta={[`Model v${modelMeta.version}`, `Trained cutoff ${Math.round(modelMeta.cutoff * 100)}%`, "Nothing you enter is stored"]}
      />
      <AssessWorkbench deployedCutoff={modelMeta.cutoff} />
    </>
  );
}
