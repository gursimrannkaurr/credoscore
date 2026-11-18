"""Flatten the fitted credit-priority estimators into stdlib inference JSON."""
from __future__ import annotations

import gzip
import json
import struct
from pathlib import Path
from typing import Any

import joblib
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
MODEL_DIR = ROOT / "model" / "cibil"
MODEL_NAMES = ("gradient_boosting", "xgboost", "random_forest")


def flatten_sklearn_tree(tree: Any, classes: int, leaf_vectors: bool = False) -> dict[str, Any]:
    t = tree.tree_
    values = t.value[:, 0, :classes] if leaf_vectors else t.value[:, 0, 0]
    return {
        "left": t.children_left.tolist(), "right": t.children_right.tolist(),
        "feature": t.feature.tolist(), "threshold": t.threshold.tolist(),
        "value": values.tolist(),
    }


def export_pipeline(name: str) -> dict[str, Any]:
    pipeline = joblib.load(MODEL_DIR / f"{name}.joblib")
    prep = pipeline.named_steps["features"]
    estimator = pipeline.named_steps["model"]
    numeric_imputer = prep.named_transformers_["numeric"].named_steps["impute"]
    encoder = prep.named_transformers_["categorical"].named_steps["encode"]
    numeric_names = list(prep.transformers_[0][2])
    categorical_names = list(prep.transformers_[1][2])
    indicator_features = [numeric_names[int(i)] for i in numeric_imputer.indicator_.features_]

    common = {
        "feature_count": len(prep.get_feature_names_out()),
        "numeric_features": numeric_names,
        "numeric_medians": [float(v) for v in numeric_imputer.statistics_],
        "missing_indicator_features": indicator_features,
        "categorical_features": categorical_names,
        "categories": {field: [str(v) for v in cats] for field, cats in zip(categorical_names, encoder.categories_)},
    }

    if name == "gradient_boosting":
        prior = estimator.init_.class_prior_
        base = np.log(prior).astype(float).tolist()
        trees = [
            [flatten_sklearn_tree(estimator.estimators_[stage, klass], len(prior)) for klass in range(len(prior))]
            for stage in range(estimator.n_estimators)
        ]
        return {**common, "kind": name, "base": base, "learning_rate": float(estimator.learning_rate), "stages": trees}

    if name == "random_forest":
        return {
            **common, "kind": name,
            "trees": [flatten_sklearn_tree(tree, len(estimator.classes_), leaf_vectors=True) for tree in estimator.estimators_],
        }

    raw = json.loads(estimator.get_booster().save_raw(raw_format="json"))
    booster = raw["learner"]["gradient_booster"]["model"]
    trees = []
    for tree, klass in zip(booster["trees"], booster["tree_info"]):
        trees.append({
            "class": int(klass),
            "left": tree["left_children"], "right": tree["right_children"],
            "feature": tree["split_indices"], "threshold": tree["split_conditions"],
            "value": tree["split_conditions"], "default_left": tree["default_left"],
        })
    # XGBoost 2.1's binary base_score is 0.5. The multiclass objective uses
    # the same initial margin for all classes, which cancels under softmax.
    return {**common, "kind": name, "base": [0.0] * len(estimator.classes_), "trees": trees}


def build_vector(row: dict[str, Any], artifact: dict[str, Any]) -> list[float]:
    numeric = [float(row[name]) for name in artifact["numeric_features"]]
    indicators = [0.0] * len(artifact["missing_indicator_features"])
    encoded = []
    for field in artifact["categorical_features"]:
        value = str(row[field])
        encoded.extend(1.0 if value == category else 0.0 for category in artifact["categories"][field])
    vector = numeric + indicators + encoded
    if len(vector) != artifact["feature_count"]:
        raise ValueError(f"Feature vector mismatch: generated {len(vector)}, expected {artifact['feature_count']}.")
    return vector


def walk(vector: list[float], tree: dict[str, Any], strict: bool = False, sparse_zeros_missing: bool = False) -> int:
    node = 0
    while tree["left"][node] != -1:
        feature = tree["feature"][node]
        threshold = tree["threshold"][node]
        value = vector[feature]
        if sparse_zeros_missing and value == 0:
            goes_left = bool(tree["default_left"][node])
        else:
            goes_left = value < threshold if strict else value <= threshold
        node = tree["left"][node] if goes_left else tree["right"][node]
    return node


def softmax(raw: list[float]) -> np.ndarray:
    values = np.asarray(raw, dtype=float)
    exp = np.exp(values - values.max())
    return exp / exp.sum()


def predict(vector: list[float], artifact: dict[str, Any]) -> np.ndarray:
    if artifact["kind"] == "gradient_boosting":
        raw = np.asarray(artifact["base"], dtype=float)
        for stage in artifact["stages"]:
            for klass, tree in enumerate(stage):
                node = walk(vector, tree)
                raw[klass] += artifact["learning_rate"] * tree["value"][node]
        return softmax(raw)
    if artifact["kind"] == "random_forest":
        total = np.zeros(4, dtype=float)
        for tree in artifact["trees"]:
            node = walk(vector, tree)
            values = np.asarray(tree["value"][node], dtype=float)
            total += values / values.sum() if values.sum() else np.full(4, 0.25)
        return total / len(artifact["trees"])
    raw = np.asarray(artifact["base"], dtype=float)
    vector = [struct.unpack("f", struct.pack("f", value))[0] for value in vector]
    for tree in artifact["trees"]:
        node = walk(vector, tree, strict=True)
        if tree["left"][node] == -1:
            raw[tree["class"]] += tree["value"][node]
    return softmax(raw.tolist())


def main() -> None:
    models = {name: export_pipeline(name) for name in MODEL_NAMES}
    output = MODEL_DIR / "models.json.gz"
    with gzip.open(output, "wt", encoding="utf-8", compresslevel=9) as f:
        json.dump({"classes": ["P1", "P2", "P3", "P4"], "models": models}, f, separators=(",", ":"))
    print(f"Wrote stdlib inference artifact: {output} ({output.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
