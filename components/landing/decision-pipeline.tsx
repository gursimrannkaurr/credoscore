import { modelMeta } from "@/lib/model-meta";

const STEPS = [
  {
    n: "01",
    value: "12",
    title: "Fields on the form",
    body: "Age, income, loan, purpose, credit history and the rest. Sex and marital status are left out on purpose.",
  },
  {
    n: "02",
    value: String(modelMeta.encodedColumns),
    title: "Model inputs",
    body: "Categories are one-hot encoded; numbers go in as they are, because trees split on thresholds.",
  },
  {
    n: "03",
    value: String(modelMeta.trees),
    title: "Shallow trees",
    body: `Depth ${modelMeta.hyperparameters.max_depth}, learning rate ${modelMeta.hyperparameters.learning_rate}, chosen by a 40-draw search on 5 folds.`,
  },
  {
    n: "04",
    value: "A·x+B",
    title: "Platt calibration",
    body: "The raw margin goes through a fitted sigmoid, so scores read as real probabilities.",
  },
  {
    n: "05",
    value: "3",
    title: "Risk bands",
    body: "Below 15% is low, 15 to 35% is medium, and 35% or more is high.",
  },
  {
    n: "06",
    value: "25%",
    title: "Approval cutoff",
    body: "Set from the 5-to-1 cost matrix rather than the default 50%.",
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
