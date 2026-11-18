import { AssessWorkbench } from "@/components/assess/assess-workbench";
import { PageHeader } from "@/components/editorial/page-header";

export const metadata = { title: "Assess a credit profile", description: "Compare Indian bank priority-class predictions and review demographic group label distributions." };

export default function AssessPage() {
  return (
    <>
      <PageHeader
        kicker="Single applicant"
        title={<>Score one applicant. <span className="italic text-brand">See why.</span></>}
        lede="Enter a credit profile based on the Indian bank and CIBIL dataset to compare Gradient Boosting, XGBoost and Random Forest predictions of the historical P1–P4 priority tier. Gender and marital status are kept out of scoring and shown only in a separate what-if fairness check. This is a dataset-label demonstration, not a default predictor or loan decision service."
        meta={["Indian bank + CIBIL profile", "Target: P1–P4 priority class", "Nothing you enter is stored"]}
      />
      <AssessWorkbench />
    </>
  );
}
