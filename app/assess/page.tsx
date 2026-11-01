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
        lede="Enter twelve applicant details to compare default-risk estimates from three models. The main Gradient Boosting result shows a risk band, a suggested decision, and how each input contributed to the prediction. A probability estimates the chance of failing to repay; it does not determine the outcome of an individual loan."
        meta={[`Model v${modelMeta.version}`, `Default cutoff ${Math.round(modelMeta.cutoff * 100)}%`, "Nothing you enter is stored"]}
      />
      <AssessWorkbench deployedCutoff={modelMeta.cutoff} />
    </>
  );
}
