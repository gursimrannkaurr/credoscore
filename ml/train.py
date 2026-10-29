"""
Training pipeline for the Loan Default Risk Predictor.

This script does five things, in order:

  1. Loads the UCI Statlog German Credit dataset and cleans it into a
     twelve-feature table with human-readable categories.
  2. Benchmarks four models (Logistic Regression, Random Forest, Gradient
     Boosting, XGBoost) under identical 5-fold stratified cross-validation.
  3. Tunes the Gradient Boosting model with a randomized hyperparameter
     search, then calibrates its raw scores against true outcomes (Platt
     scaling) using out-of-fold predictions.
  4. Exports the fitted ensemble as a dependency-free JSON artifact that the
     deployed API can evaluate with nothing but the Python standard library.
  5. Precomputes the portfolio-level aggregates the dashboard reads directly.

Run with:  py ml/train.py
Requires:  ml/requirements-train.txt  (never read by the deployed backend)
"""

from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score,
    brier_score_loss,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import RandomizedSearchCV, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBClassifier

ROOT = Path(__file__).resolve().parent.parent
RAW_FILE = Path(__file__).resolve().parent / "raw" / "german.data"
DATA_OUT = ROOT / "data" / "german_credit.csv"
MODEL_OUT = ROOT / "model" / "model.json"
PORTFOLIO_OUT = ROOT / "model" / "portfolio.json"

RANDOM_STATE = 42
N_FOLDS = 5

# ---------------------------------------------------------------------------
# 1. Load and clean
# ---------------------------------------------------------------------------

COLUMN_NAMES = [
    "checking_status_raw", "duration_months", "credit_history_raw",
    "purpose_raw", "loan_amount", "savings_status_raw", "employment_raw",
    "installment_rate", "personal_status_raw", "other_debtors_raw",
    "residence_since", "property_raw", "age", "other_plans_raw",
    "housing_raw", "existing_credits", "job_raw", "num_dependents",
    "telephone_raw", "foreign_worker_raw", "target_raw",
]

CHECKING_MAP = {
    "A11": "less_than_0", "A12": "0_to_200",
    "A13": "200_or_more", "A14": "none",
}
CREDIT_HISTORY_MAP = {
    "A30": "no_credits", "A31": "all_paid",
    "A32": "paid_duly", "A33": "delayed_past", "A34": "critical",
}
PURPOSE_MAP = {
    "A40": "car_new", "A41": "car_used", "A42": "furniture_equipment",
    "A43": "radio_tv", "A44": "domestic_appliances", "A45": "repairs",
    "A46": "education", "A47": "vacation", "A48": "retraining",
    "A49": "business", "A410": "other",
}
SAVINGS_MAP = {
    "A61": "under_100", "A62": "100_to_500",
    "A63": "500_to_1000", "A64": "over_1000", "A65": "none",
}
# Employment bucket -> representative years, used as a *numeric* feature so
# the UI can take a plain number and we still respect the original binning.
EMPLOYMENT_YEARS_MAP = {
    "A71": 0.0, "A72": 0.5, "A73": 2.5, "A74": 5.5, "A75": 10.0,
}
HOUSING_MAP = {"A151": "rent", "A152": "own", "A153": "free"}
JOB_MAP = {
    "A171": "unskilled_nonresident", "A172": "unskilled_resident",
    "A173": "skilled", "A174": "management",
}

NUMERIC_FEATURES = [
    "age", "employment_years", "monthly_income", "loan_amount",
    "duration_months", "existing_credits",
]
CATEGORICAL_FEATURES = [
    "job_type", "housing", "purpose", "credit_history",
    "checking_status", "savings_status",
]
ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES


def load_clean_dataset() -> pd.DataFrame:
    df = pd.read_csv(RAW_FILE, sep=r"\s+", header=None, names=COLUMN_NAMES)

    df["checking_status"] = df["checking_status_raw"].map(CHECKING_MAP)
    df["credit_history"] = df["credit_history_raw"].map(CREDIT_HISTORY_MAP)
    df["purpose"] = df["purpose_raw"].map(PURPOSE_MAP)
    df["savings_status"] = df["savings_status_raw"].map(SAVINGS_MAP)
    df["employment_years"] = df["employment_raw"].map(EMPLOYMENT_YEARS_MAP)
    df["housing"] = df["housing_raw"].map(HOUSING_MAP)
    df["job_type"] = df["job_raw"].map(JOB_MAP)

    # Attribute 8 is defined as the monthly installment expressed as a
    # percentage of disposable income. That definition inverts exactly:
    #   monthly_installment = loan_amount / duration_months
    #   disposable_income   = monthly_installment / (installment_rate / 100)
    # See docs/01-data.md for the full derivation and a worked example.
    monthly_installment = df["loan_amount"] / df["duration_months"]
    df["monthly_income"] = (monthly_installment / (df["installment_rate"] / 100.0)).round(2)

    # 1 = good (no default), 2 = bad (default)
    df["default"] = (df["target_raw"] == 2).astype(int)

    out = df[ALL_FEATURES + ["default"]].copy()
    out["age"] = out["age"].astype(int)
    out["existing_credits"] = out["existing_credits"].astype(int)
    out["duration_months"] = out["duration_months"].astype(int)
    out["loan_amount"] = out["loan_amount"].astype(int)
    return out


# ---------------------------------------------------------------------------
# 2. Preprocessing + model definitions
# ---------------------------------------------------------------------------

def build_preprocessor() -> ColumnTransformer:
    # "passthrough" for numeric columns keeps their order fixed and known,
    # which the deployed stdlib scorer relies on to rebuild the same vector.
    return ColumnTransformer(
        transformers=[
            ("num", "passthrough", NUMERIC_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ],
    )


def sigmoid(z: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-z))


def ks_statistic(y_true: np.ndarray, y_score: np.ndarray) -> float:
    fpr, tpr, _ = roc_curve(y_true, y_score)
    return float(np.max(tpr - fpr))


def main() -> None:
    print("=" * 70)
    print("LOAN DEFAULT RISK PREDICTOR — TRAINING PIPELINE")
    print("=" * 70)

    df = load_clean_dataset()
    DATA_OUT.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(DATA_OUT, index=False)
    print(f"\nCleaned dataset written to {DATA_OUT}  ({len(df)} rows)")
    print(f"Base default rate: {df['default'].mean():.4f}")

    X = df[ALL_FEATURES]
    y = df["default"].to_numpy()
    cv = StratifiedKFold(n_splits=N_FOLDS, shuffle=True, random_state=RANDOM_STATE)

    # -----------------------------------------------------------------
    # 3. Four-model benchmark under identical folds
    # -----------------------------------------------------------------
    print("\n" + "-" * 70)
    print("BENCHMARK — 5-fold stratified cross-validation, identical folds")
    print("-" * 70)

    candidates = {
        "logistic_regression": LogisticRegression(
            max_iter=5000, class_weight="balanced", random_state=RANDOM_STATE,
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=300, max_depth=6, class_weight="balanced",
            random_state=RANDOM_STATE,
        ),
        "gradient_boosting": GradientBoostingClassifier(
            n_estimators=150, max_depth=3, learning_rate=0.05,
            random_state=RANDOM_STATE,
        ),
        "xgboost": XGBClassifier(
            n_estimators=200, max_depth=3, learning_rate=0.05,
            eval_metric="logloss", random_state=RANDOM_STATE,
            scale_pos_weight=(y == 0).sum() / (y == 1).sum(),
        ),
    }

    # Cross-validated manually (rather than via sklearn's scoring="..." string
    # scorers) so every candidate — including XGBoost, whose sklearn wrapper
    # does not fully implement the estimator-tag interface newer scikit-learn
    # scorers expect — is benchmarked the same way: fit on the fold's train
    # split, score its held-out fold via predict_proba, pool across folds.
    benchmark_results = {}
    for name, estimator in candidates.items():
        oof = np.zeros(len(y), dtype=float)
        fold_aucs = []
        for train_idx, val_idx in cv.split(X, y):
            pipe = Pipeline([("prep", build_preprocessor()), ("clf", estimator.__class__(**estimator.get_params()))])
            pipe.fit(X.iloc[train_idx], y[train_idx])
            fold_proba = pipe.predict_proba(X.iloc[val_idx])[:, 1]
            oof[val_idx] = fold_proba
            fold_aucs.append(roc_auc_score(y[val_idx], fold_proba))

        auc_mean, auc_std = float(np.mean(fold_aucs)), float(np.std(fold_aucs))
        pr_auc = float(average_precision_score(y, oof))
        benchmark_results[name] = {
            "roc_auc_mean": auc_mean,
            "roc_auc_std": auc_std,
            "pr_auc_mean": pr_auc,
        }
        print(f"  {name:20s}  ROC-AUC {auc_mean:.4f} ± {auc_std:.4f}   PR-AUC {pr_auc:.4f}")

    # -----------------------------------------------------------------
    # 4. Hyperparameter search on the selected family (Gradient Boosting)
    # -----------------------------------------------------------------
    print("\n" + "-" * 70)
    print("HYPERPARAMETER SEARCH — Gradient Boosting, RandomizedSearchCV")
    print("-" * 70)

    param_distributions = {
        "clf__n_estimators": [80, 120, 150, 200, 250, 300],
        "clf__max_depth": [2, 3, 4, 5],
        "clf__learning_rate": [0.01, 0.03, 0.05, 0.08, 0.1, 0.15],
        "clf__subsample": [0.7, 0.8, 0.9, 1.0],
        "clf__min_samples_leaf": [5, 10, 20, 30],
    }
    search_pipe = Pipeline([
        ("prep", build_preprocessor()),
        ("clf", GradientBoostingClassifier(random_state=RANDOM_STATE)),
    ])
    search = RandomizedSearchCV(
        search_pipe, param_distributions, n_iter=40, cv=cv,
        scoring="roc_auc", random_state=RANDOM_STATE, n_jobs=-1,
    )
    search.fit(X, y)
    best_params = {k.replace("clf__", ""): v for k, v in search.best_params_.items()}
    print(f"  Best CV ROC-AUC: {search.best_score_:.4f}")
    print(f"  Best params: {best_params}")

    benchmark_results["gradient_boosting_tuned"] = {
        "roc_auc_mean": float(search.best_score_),
        "params": best_params,
    }

    # -----------------------------------------------------------------
    # Out-of-fold raw margins for the tuned model, used both for honest
    # metrics and to fit a single global Platt-scaling transform.
    # -----------------------------------------------------------------
    print("\n" + "-" * 70)
    print("CALIBRATION — out-of-fold raw margins -> Platt scaling")
    print("-" * 70)

    final_gb = GradientBoostingClassifier(random_state=RANDOM_STATE, **best_params)
    final_pipe = Pipeline([("prep", build_preprocessor()), ("clf", final_gb)])

    oof_margins = np.zeros(len(y), dtype=float)
    for train_idx, val_idx in cv.split(X, y):
        fold_pipe = Pipeline([("prep", build_preprocessor()),
                               ("clf", GradientBoostingClassifier(random_state=RANDOM_STATE, **best_params))])
        fold_pipe.fit(X.iloc[train_idx], y[train_idx])
        oof_margins[val_idx] = fold_pipe.decision_function(X.iloc[val_idx])

    platt = LogisticRegression()
    platt.fit(oof_margins.reshape(-1, 1), y)
    platt_a = float(platt.coef_[0, 0])
    platt_b = float(platt.intercept_[0])
    oof_probs = sigmoid(platt_a * oof_margins + platt_b)

    print(f"  Platt scaling: A={platt_a:.6f}  B={platt_b:.6f}")

    oof_auc = roc_auc_score(y, oof_probs)
    oof_ap = average_precision_score(y, oof_probs)
    oof_ks = ks_statistic(y, oof_probs)
    oof_brier = brier_score_loss(y, oof_probs)
    print(f"  Out-of-fold  ROC-AUC={oof_auc:.4f}  PR-AUC={oof_ap:.4f}"
          f"  KS={oof_ks:.4f}  Brier={oof_brier:.4f}")

    # -----------------------------------------------------------------
    # Fit the production pipeline on ALL data for deployment.
    # -----------------------------------------------------------------
    final_pipe.fit(X, y)

    # -----------------------------------------------------------------
    # 5. Export to a dependency-free JSON artifact
    # -----------------------------------------------------------------
    print("\n" + "-" * 70)
    print("EXPORT — flattening the fitted ensemble into JSON")
    print("-" * 70)

    preprocessor = final_pipe.named_steps["prep"]
    clf = final_pipe.named_steps["clf"]
    ohe: OneHotEncoder = preprocessor.named_transformers_["cat"]
    categories = {col: cats.tolist() for col, cats in zip(CATEGORICAL_FEATURES, ohe.categories_)}

    # Global feature importance (impurity-based, native to the fitted
    # ensemble), grouped from the expanded one-hot columns back to the
    # original twelve fields for a chart that matches the input form.
    expanded_names = list(NUMERIC_FEATURES)
    for col in CATEGORICAL_FEATURES:
        expanded_names += [f"{col}={c}" for c in categories[col]]
    importances_by_field: dict[str, float] = {f: 0.0 for f in ALL_FEATURES}
    for name, importance in zip(expanded_names, clf.feature_importances_):
        field = name.split("=")[0]
        importances_by_field[field] += float(importance)
    total_importance = sum(importances_by_field.values()) or 1.0
    feature_importance = sorted(
        (
            {"feature": f, "label": f, "importance": v / total_importance}
            for f, v in importances_by_field.items()
        ),
        key=lambda row: -row["importance"],
    )
    print("  Feature importance (impurity-based, grouped by field):")
    for row in feature_importance:
        print(f"    {row['feature']:20s} {row['importance']:.4f}")

    learning_rate = float(clf.learning_rate)
    trees = []
    for estimator_row in clf.estimators_:
        tree = estimator_row[0].tree_
        trees.append({
            "feature": tree.feature.tolist(),
            "threshold": tree.threshold.tolist(),
            "left": tree.children_left.tolist(),
            "right": tree.children_right.tolist(),
            "value": tree.value.reshape(-1).tolist(),
        })

    # Recover the constant init (base) score. sklearn's default init for
    # log-loss classification is a constant prior log-odds, identical for
    # every row — verified below rather than assumed.
    X_transformed = preprocessor.transform(X)
    if hasattr(X_transformed, "toarray"):
        X_transformed = X_transformed.toarray()
    raw_full = final_pipe.decision_function(X)

    def tree_sum(row_idx: int) -> float:
        total = 0.0
        for t in trees:
            node = 0
            while t["left"][node] != -1:
                if X_transformed[row_idx, t["feature"][node]] <= t["threshold"][node]:
                    node = t["left"][node]
                else:
                    node = t["right"][node]
            total += t["value"][node]
        return total * learning_rate

    base_candidates = [raw_full[i] - tree_sum(i) for i in (0, 1, 2, len(y) - 1)]
    base_value = float(np.mean(base_candidates))
    base_spread = float(np.max(base_candidates) - np.min(base_candidates))
    print(f"  Base value: {base_value:.6f}  (spread across samples: {base_spread:.2e})")
    assert base_spread < 1e-6, "Base value is not constant — export logic needs revisiting"

    artifact = {
        "model_version": "1.0.0",
        "model_type": "gradient_boosting",
        "trained_on_rows": int(len(y)),
        "numeric_features": NUMERIC_FEATURES,
        "categorical_features": CATEGORICAL_FEATURES,
        "categories": categories,
        "learning_rate": learning_rate,
        "base_value": base_value,
        "platt_a": platt_a,
        "platt_b": platt_b,
        "trees": trees,
        "base_rate": float(y.mean()),
        "cutoff": 0.25,
        "metrics": {
            "roc_auc": oof_auc,
            "pr_auc": oof_ap,
            "ks_statistic": oof_ks,
            "brier_score": oof_brier,
        },
        "benchmark": benchmark_results,
        "hyperparameters": best_params,
    }

    MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
    MODEL_OUT.write_text(json.dumps(artifact))
    size_kb = MODEL_OUT.stat().st_size / 1024
    print(f"  Model artifact written to {MODEL_OUT}  ({size_kb:.1f} KB, {len(trees)} trees)")

    # -----------------------------------------------------------------
    # Parity check: does the pure-Python formula reproduce sklearn exactly?
    # -----------------------------------------------------------------
    def python_predict(row_idx: int) -> float:
        raw = base_value + tree_sum(row_idx)
        return 1.0 / (1.0 + math.exp(-(platt_a * raw + platt_b)))

    sklearn_probs = sigmoid(platt_a * raw_full + platt_b)
    python_probs = np.array([python_predict(i) for i in range(len(y))])
    max_diff = float(np.max(np.abs(sklearn_probs - python_probs)))
    print(f"  Parity check (pure-Python vs sklearn, full dataset): max diff = {max_diff:.2e}")
    assert max_diff < 1e-9, "Parity check failed"

    # -----------------------------------------------------------------
    # Portfolio aggregates for the dashboard (all out-of-fold / honest)
    # -----------------------------------------------------------------
    print("\n" + "-" * 70)
    print("PORTFOLIO AGGREGATES")
    print("-" * 70)

    def band_for(p: float) -> str:
        if p < 0.15:
            return "low"
        if p < 0.35:
            return "medium"
        return "high"

    bands = [band_for(p) for p in oof_probs]
    band_counts = {b: bands.count(b) for b in ("low", "medium", "high")}
    print(f"  Risk bands: {band_counts}")

    # Decile table (by predicted probability)
    order = np.argsort(oof_probs)
    deciles = []
    n = len(y)
    for d in range(10):
        lo = int(n * d / 10)
        hi = int(n * (d + 1) / 10)
        idx = order[lo:hi]
        deciles.append({
            "decile": d + 1,
            "count": int(len(idx)),
            "mean_predicted_pd": float(oof_probs[idx].mean()),
            "observed_default_rate": float(y[idx].mean()),
        })

    # Segment tables
    def segment_table(col: str) -> list[dict]:
        rows = []
        for value in sorted(df[col].unique()):
            mask = (df[col] == value).to_numpy()
            rows.append({
                "segment": value,
                "count": int(mask.sum()),
                "default_rate": float(y[mask].mean()),
                "mean_predicted_pd": float(oof_probs[mask].mean()),
            })
        return rows

    # Approval-rate / expected-loss curve over cutoffs
    cutoff_curve = []
    for cutoff in np.round(np.arange(0.05, 0.65, 0.05), 2):
        approve = oof_probs < cutoff
        approval_rate = float(approve.mean())
        approved_bad_rate = float(y[approve].mean()) if approve.sum() > 0 else 0.0
        cutoff_curve.append({
            "cutoff": float(cutoff),
            "approval_rate": approval_rate,
            "approved_bad_rate": approved_bad_rate,
        })

    fpr, tpr, roc_thresholds = roc_curve(y, oof_probs)
    roc_points = [
        {"fpr": float(f), "tpr": float(t)}
        for f, t in zip(fpr[::max(1, len(fpr) // 60)], tpr[::max(1, len(tpr) // 60)])
    ]

    # Calibration curve (10 bins by predicted probability)
    calibration = []
    bin_edges = np.linspace(0, 1, 11)
    for i in range(10):
        mask = (oof_probs >= bin_edges[i]) & (oof_probs < bin_edges[i + 1])
        if mask.sum() > 0:
            calibration.append({
                "bin_start": float(bin_edges[i]),
                "bin_end": float(bin_edges[i + 1]),
                "count": int(mask.sum()),
                "mean_predicted": float(oof_probs[mask].mean()),
                "observed_rate": float(y[mask].mean()),
            })

    portfolio = {
        "total_applicants": int(n),
        "base_default_rate": float(y.mean()),
        "band_counts": band_counts,
        "deciles": deciles,
        "segments": {
            "purpose": segment_table("purpose"),
            "employment_years": segment_table("employment_years"),
            "housing": segment_table("housing"),
            "job_type": segment_table("job_type"),
        },
        "cutoff_curve": cutoff_curve,
        "roc_curve": roc_points,
        "calibration": calibration,
        "metrics": artifact["metrics"],
        "benchmark": benchmark_results,
        "feature_importance": feature_importance,
        "cost_matrix": {
            "false_negative_cost": 5,
            "false_positive_cost": 1,
            "note": "UCI-documented cost matrix: approving a bad applicant "
                    "costs 5x more than declining a good one.",
        },
    }
    PORTFOLIO_OUT.write_text(json.dumps(portfolio))
    print(f"  Portfolio artifact written to {PORTFOLIO_OUT}")

    print("\n" + "=" * 70)
    print("DONE")
    print("=" * 70)


if __name__ == "__main__":
    main()
