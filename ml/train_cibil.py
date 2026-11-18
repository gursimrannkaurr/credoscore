"""Train three Indian credit-priority classifiers from the public workbook pair.

Download source workbooks into data/cibil/ (they are ignored by Git):
  py ml/train_cibil.py --download
Then run:
  py ml/train_cibil.py

The label is Approved_Flag (P1–P4), a historical bank priority tier. It is
not an observed future repayment/default outcome. Sensitive demographics and
the prospect ID are intentionally excluded from model features.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from urllib.request import urlretrieve

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, balanced_accuracy_score, classification_report, f1_score, log_loss
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from xgboost import XGBClassifier

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "cibil"
MODEL_DIR = ROOT / "model" / "cibil"
SOURCE = "https://github.com/rounak97/Credit-Risk-Modelling-Using-Machine-Learning/raw/refs/heads/main/{}"
LABELS = ["P1", "P2", "P3", "P4"]
NUMERIC = [
    "AGE", "NETMONTHLYINCOME", "Time_With_Curr_Empr", "Credit_Score",
    "Total_TL", "Tot_Active_TL", "Tot_Missed_Pmnt", "num_times_delinquent",
    "num_times_30p_dpd", "num_deliq_12mts", "time_since_recent_payment",
    "PL_TL", "CC_utilization", "enq_L12m", "Secured_TL", "Unsecured_TL",
    "active_account_ratio", "missed_payment_rate", "unsecured_account_ratio",
]
CATEGORICAL = ["EDUCATION", "last_prod_enq2", "first_prod_enq2"]
FEATURES = NUMERIC + CATEGORICAL


def download_source() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    for filename in ("case_study1.xlsx", "case_study2.xlsx", "Features_Target_Description.xlsx"):
        destination = DATA_DIR / filename
        if not destination.exists():
            print(f"Downloading {filename}...")
            urlretrieve(SOURCE.format(filename), destination)


def load_dataset() -> tuple[pd.DataFrame, pd.Series, pd.DataFrame]:
    internal_path, bureau_path = DATA_DIR / "case_study1.xlsx", DATA_DIR / "case_study2.xlsx"
    if not internal_path.exists() or not bureau_path.exists():
        raise FileNotFoundError("CIBIL workbook files are missing. Run: py ml/train_cibil.py --download")
    internal = pd.read_excel(internal_path)
    bureau = pd.read_excel(bureau_path)
    if internal["PROSPECTID"].duplicated().any() or bureau["PROSPECTID"].duplicated().any():
        raise ValueError("PROSPECTID must be unique in each source workbook.")
    df = internal.merge(bureau, on="PROSPECTID", how="inner", validate="one_to_one", suffixes=("_bank", "_bureau"))
    if len(df) != len(internal) or len(df) != len(bureau):
        raise ValueError("The bank and bureau files do not contain a complete one-to-one matching population.")
    if "Approved_Flag" not in df or set(df["Approved_Flag"].dropna().unique()) != set(LABELS):
        raise ValueError("Expected Approved_Flag to contain exactly P1, P2, P3, and P4.")

    df = df.replace(-99999, np.nan)
    # Derived ratios keep volume features comparable between small and large
    # credit files and make the raw-to-feature extraction explicit.
    total = df["Total_TL"].replace(0, np.nan)
    df["active_account_ratio"] = (df["Tot_Active_TL"] / total).clip(0, 1)
    df["missed_payment_rate"] = (df["Tot_Missed_Pmnt"] / total).clip(0, 1)
    df["unsecured_account_ratio"] = (df["Unsecured_TL"] / total).clip(0, 1)
    X = df[FEATURES].copy()
    y = df["Approved_Flag"].astype(str).map({label: i for i, label in enumerate(LABELS)})
    audit = df[["GENDER", "MARITALSTATUS", "Approved_Flag"]].copy()
    return X, y, audit


def make_pipeline(estimator) -> Pipeline:
    prep = ColumnTransformer([
        ("numeric", Pipeline([("impute", SimpleImputer(strategy="median", add_indicator=True))]), NUMERIC),
        ("categorical", Pipeline([
            ("impute", SimpleImputer(strategy="most_frequent")),
            ("encode", OneHotEncoder(handle_unknown="ignore")),
        ]), CATEGORICAL),
    ])
    return Pipeline([("features", prep), ("model", estimator)])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--download", action="store_true", help="download the public source workbooks")
    args = parser.parse_args()
    if args.download:
        download_source()

    X, y, audit = load_dataset()
    X_train, X_test, y_train, y_test, audit_train, audit_test = train_test_split(
        X, y, audit, test_size=0.20, random_state=42, stratify=y,
    )
    counts = y_train.value_counts()
    weights = y_train.map({label: len(y_train) / (len(counts) * count) for label, count in counts.items()})
    estimators = {
        "gradient_boosting": GradientBoostingClassifier(
            n_estimators=220, learning_rate=0.05, max_depth=3,
            min_samples_leaf=20, subsample=0.85, random_state=42,
        ),
        "xgboost": XGBClassifier(
            objective="multi:softprob", num_class=4, n_estimators=350,
            max_depth=4, learning_rate=0.04, min_child_weight=5,
            subsample=0.85, colsample_bytree=0.85, reg_lambda=2.0,
            eval_metric="mlogloss", tree_method="hist", n_jobs=-1,
            random_state=42,
        ),
        "random_forest": RandomForestClassifier(
            n_estimators=400, max_features="sqrt", min_samples_leaf=3,
            class_weight="balanced_subsample", n_jobs=-1, random_state=42,
        ),
    }
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    metrics = {}
    for name, estimator in estimators.items():
        print(f"Fitting {name} on {len(X_train):,} train rows...")
        pipeline = make_pipeline(estimator)
        fit_args = {"model__sample_weight": weights.to_numpy()} if name != "random_forest" else {}
        pipeline.fit(X_train, y_train, **fit_args)
        probs = pipeline.predict_proba(X_test)
        pred = pipeline.classes_[np.argmax(probs, axis=1)].astype(int)
        metrics[name] = {
            "accuracy": float(accuracy_score(y_test, pred)),
            "balanced_accuracy": float(balanced_accuracy_score(y_test, pred)),
            "macro_f1": float(f1_score(y_test, pred, average="macro")),
            "log_loss": float(log_loss(y_test, probs, labels=pipeline.classes_)),
            "classification_report": classification_report(y_test, pred, labels=range(4), target_names=LABELS, output_dict=True, zero_division=0),
        }
        joblib.dump(pipeline, MODEL_DIR / f"{name}.joblib", compress=3)
        print(f"  accuracy={metrics[name]['accuracy']:.4f} balanced_accuracy={metrics[name]['balanced_accuracy']:.4f} macro_f1={metrics[name]['macro_f1']:.4f}")

    # Group-level source-label distributions support an audit. They are not
    # added as model features and do not imply that the label is fair.
    audit_summary = {}
    for field in ("GENDER", "MARITALSTATUS"):
        audit_summary[field] = {}
        for group, frame in audit_test.groupby(field, dropna=False):
            audit_summary[field][str(group)] = {
                "count": int(len(frame)),
                "priority_distribution": {label: float((frame["Approved_Flag"] == label).mean()) for label in LABELS},
            }
    metadata = {
        "model_version": "indian-bank-cibil-priority-1.0",
        "source": "Leading Indian Bank & CIBIL Real-World Dataset",
        "source_rows": int(len(X)), "train_rows": int(len(X_train)), "test_rows": int(len(X_test)),
        "label": "Approved_Flag", "label_meaning": "historical bank priority tier, not future repayment/default",
        "classes": LABELS, "numeric_features": NUMERIC, "categorical_features": CATEGORICAL,
        "sensitive_features_excluded": ["GENDER", "MARITALSTATUS", "PROSPECTID"],
        "metrics": metrics, "test_group_audit": audit_summary,
        "split": "stratified 80/20, random_state=42",
    }
    (MODEL_DIR / "metadata.json").write_text(json.dumps(metadata, indent=2))
    from export_cibil_models import main as export_models
    export_models()
    for artifact in MODEL_DIR.glob("*.joblib"):
        artifact.unlink()
    print(f"Trained artifacts and holdout metrics saved under {MODEL_DIR}")


if __name__ == "__main__":
    main()
