import raw from "@/model/model.json";

export const modelMeta = {
  version: raw.model_version as string,
  type: raw.model_type as string,
  rows: raw.trained_on_rows as number,
  trees: (raw.trees as unknown[]).length,
  learningRate: raw.learning_rate as number,
  baseValue: raw.base_value as number,
  plattA: raw.platt_a as number,
  plattB: raw.platt_b as number,
  cutoff: raw.cutoff as number,
  hyperparameters: raw.hyperparameters as Record<string, number>,
  numericFeatures: raw.numeric_features as string[],
  categoricalFeatures: raw.categorical_features as string[],
  encodedColumns:
    (raw.numeric_features as string[]).length +
    Object.values(raw.categories as Record<string, string[]>).reduce((s, c) => s + c.length, 0),
};

export const modelBaselinePd = 1 / (1 + Math.exp(-(modelMeta.plattA * modelMeta.baseValue + modelMeta.plattB)));
