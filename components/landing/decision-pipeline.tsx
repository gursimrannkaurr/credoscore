import { modelMeta } from "@/lib/model-meta";

const STEPS = [
  {
    n: "01",
    value: "12",
    title: "Fields on the form",
    body: "Six numeric fields and six categories describe the applicant, loan and credit position. Sex and marital status are excluded; that alone does not establish fairness.",
  },
  {
    n: "02",
    value: String(modelMeta.encodedColumns),
    title: "Model inputs",
    body: "One-hot encoding turns categories into 0/1 indicators. Together with the six numeric fields, these form the feature vector used by all three models.",
  },
  {
    n: "03",
    value: String(modelMeta.trees),
    title: "Gradient Boosting trees",
    body: `The primary model adds ${modelMeta.trees} trees sequentially. Depth ${modelMeta.hyperparameters.max_depth} limits each tree; learning rate ${modelMeta.hyperparameters.learning_rate} controls each update.`,
  },
  {
    n: "04",
    value: "A·x+B",
    title: "Platt calibration",
    body: "A fitted logistic function maps raw model scores to estimated default probabilities. The calibration chart checks how well group averages match recorded outcomes.",
  },
  {
    n: "05",
    value: "3",
    title: "Risk bands",
    body: "Low: below 15%. Medium: 15% to below 35%. High: 35% or above. These groups describe predicted risk, not an observed outcome.",
  },
  {
    n: "06",
    value: "25%",
    title: "Approval cutoff",
    body: "The app starts at 25%. The cost explorer compares this choice with other thresholds; changing the cutoff changes the decision, not the probability.",
  },
];

export function DecisionPipeline() {
  return (
    <ol className="grid gap-px overflow-hidden rounded-xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-3">
      {STEPS.map((step) => (
        <li key={step.n} className="bg-paper-raised p-6">
          <p className="num text-xs text-brand">{step.n}</p>
          <p className="num mt-3 text-3xl">{step.value}</p>
          <p className="mt-2 font-serif text-xl">{step.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
