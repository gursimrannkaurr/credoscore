"""Monochrome, academic-styled charts for the report, built from
model/portfolio.json only, never from retyped numbers.

Run with PY312 (matplotlib + pandas are installed only for that
interpreter): PY312 -I report/scripts/make_charts.py
"""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker

ROOT = Path(__file__).resolve().parent.parent.parent
PORTFOLIO_PATH = ROOT / "model" / "portfolio.json"
OUT_DIR = Path(__file__).resolve().parent.parent / "assets" / "charts"
OUT_DIR.mkdir(parents=True, exist_ok=True)

plt.rcParams.update(
    {
        "font.family": "Times New Roman",
        "font.size": 11,
        "axes.edgecolor": "black",
        "axes.linewidth": 0.8,
        "grid.color": "#bbbbbb",
        "grid.linestyle": "--",
        "grid.linewidth": 0.5,
        "axes.grid": True,
        "figure.dpi": 300,
        "savefig.dpi": 300,
    }
)

MONO = ["#000000", "#555555", "#999999"]
FEATURE_LABELS = {
    "age": "Age",
    "employment_years": "Years employed",
    "monthly_income": "Monthly income",
    "loan_amount": "Loan amount",
    "duration_months": "Loan duration",
    "existing_credits": "Existing credit lines",
    "job_type": "Job type",
    "housing": "Housing situation",
    "purpose": "Loan purpose",
    "credit_history": "Credit history",
    "checking_status": "Checking account status",
    "savings_status": "Savings account status",
}

portfolio = json.loads(PORTFOLIO_PATH.read_text())


def savefig(fig, name: str) -> None:
    fig.tight_layout()
    fig.savefig(OUT_DIR / name, dpi=300)
    plt.close(fig)
    print(f"  wrote {name}")


# ---------------------------------------------------------------------------
# Fig 3.10, ROC curve
# ---------------------------------------------------------------------------
def chart_roc() -> None:
    roc = portfolio["roc_curve"]
    fpr = [p["fpr"] for p in roc]
    tpr = [p["tpr"] for p in roc]
    auc = portfolio["metrics"]["roc_auc"]

    fig, ax = plt.subplots(figsize=(6.2, 3.6))
    ax.plot(fpr, tpr, color=MONO[0], linewidth=1.4, label=f"GB tuned (AUC = {auc:.4f})")
    ax.plot([0, 1], [0, 1], color=MONO[1], linewidth=0.9, linestyle="--", label="Chance")
    ax.set_xlabel("False positive rate")
    ax.set_ylabel("True positive rate")
    ax.set_title("ROC curve, out-of-fold")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.legend(loc="lower right", frameon=False, fontsize=9)
    savefig(fig, "fig-3-10-roc.png")


# ---------------------------------------------------------------------------
# Fig 3.11, Calibration reliability diagram
# ---------------------------------------------------------------------------
def chart_calibration() -> None:
    cal = portfolio["calibration"]
    mean_pred = [b["mean_predicted"] for b in cal]
    observed = [b["observed_rate"] for b in cal]
    counts = [b["count"] for b in cal]
    max_count = max(counts) if counts else 1
    sizes = [20 + 180 * (c / max_count) for c in counts]

    fig, ax = plt.subplots(figsize=(6.2, 3.6))
    ax.plot([0, 1], [0, 1], color=MONO[1], linewidth=0.9, linestyle="--", label="Perfect calibration")
    ax.scatter(mean_pred, observed, s=sizes, facecolors="none", edgecolors=MONO[0], linewidths=1.2, label="Decile bin (marker size scales with count)")
    ax.set_xlabel("Mean predicted probability")
    ax.set_ylabel("Observed default rate")
    ax.set_title("Calibration (reliability) diagram")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.legend(loc="upper left", frameon=False, fontsize=9)
    savefig(fig, "fig-3-11-calibration.png")


# ---------------------------------------------------------------------------
# Fig 3.12, Feature importance, horizontal bars
# ---------------------------------------------------------------------------
def chart_importance() -> None:
    items = sorted(portfolio["feature_importance"], key=lambda r: r["importance"])
    labels = [FEATURE_LABELS.get(r["feature"], r["feature"]) for r in items]
    values = [r["importance"] for r in items]

    fig, ax = plt.subplots(figsize=(6.2, 3.6))
    bars = ax.barh(labels, values, color="white", edgecolor=MONO[0], linewidth=0.8, hatch="///")
    for bar in bars:
        bar.set_hatch("///")
    ax.set_xlabel("Relative importance")
    ax.set_title("Feature importance, 12 fields")
    ax.grid(axis="x")
    savefig(fig, "fig-3-12-importance.png")


# ---------------------------------------------------------------------------
# Fig 3.13, Decile bars (observed) + line (predicted)
# ---------------------------------------------------------------------------
def chart_deciles() -> None:
    deciles = portfolio["deciles"]
    x = [d["decile"] for d in deciles]
    observed = [d["observed_default_rate"] for d in deciles]
    predicted = [d["mean_predicted_pd"] for d in deciles]

    fig, ax = plt.subplots(figsize=(6.2, 3.6))
    ax.bar(x, observed, color="white", edgecolor=MONO[0], linewidth=0.8, hatch="///", label="Observed default rate", width=0.6)
    ax.plot(x, predicted, color=MONO[0], marker="o", markersize=4, linewidth=1.3, label="Mean predicted PD")
    ax.set_xlabel("Risk decile (1 = lowest risk, 10 = highest)")
    ax.set_ylabel("Rate")
    ax.set_title("Rank ordering: observed vs predicted, by decile")
    ax.set_xticks(x)
    ax.legend(loc="upper left", frameon=False, fontsize=9)
    savefig(fig, "fig-3-13-deciles.png")


# ---------------------------------------------------------------------------
# Fig 3.14, Cutoff trade-off: approval rate, bad rate among approved, cost
# ---------------------------------------------------------------------------
def chart_cutoff() -> None:
    curve = portfolio["cutoff_curve"]
    total = portfolio["total_applicants"]
    base_rate = portfolio["base_default_rate"]
    fn_cost = portfolio["cost_matrix"]["false_negative_cost"]
    fp_cost = portfolio["cost_matrix"]["false_positive_cost"]
    total_bad = round(total * base_rate)
    total_good = total - total_bad

    cutoffs = [c["cutoff"] for c in curve]
    approval_rate = [c["approval_rate"] for c in curve]
    bad_rate = [c["approved_bad_rate"] for c in curve]

    cost_per_applicant = []
    for c in curve:
        approved = c["approval_rate"] * total
        approved_bad = c["approved_bad_rate"] * approved
        approved_good = approved - approved_bad
        declined_good = total_good - approved_good
        fn = approved_bad
        fp = declined_good
        cost = (fn * fn_cost + fp * fp_cost) / total
        cost_per_applicant.append(cost)

    fig, ax1 = plt.subplots(figsize=(6.2, 3.6))
    ax1.plot(cutoffs, approval_rate, color=MONO[0], marker="o", markersize=3.5, linewidth=1.2, label="Approval rate")
    ax1.plot(cutoffs, bad_rate, color=MONO[1], marker="s", markersize=3.5, linewidth=1.2, linestyle="--", label="Bad rate among approved")
    ax1.axvline(0.25, color=MONO[2], linewidth=1.0, linestyle=":")
    ax1.set_xlabel("Cutoff")
    ax1.set_ylabel("Rate")
    ax1.set_ylim(0, 1)

    ax2 = ax1.twinx()
    ax2.plot(cutoffs, cost_per_applicant, color=MONO[0], marker="^", markersize=3.5, linewidth=1.0, linestyle="-.", label="Cost per applicant")
    ax2.set_ylabel("Cost per applicant")
    ax2.grid(False)

    handles1, labels1 = ax1.get_legend_handles_labels()
    handles2, labels2 = ax2.get_legend_handles_labels()
    ax1.legend(handles1 + handles2, labels1 + labels2, loc="upper center", frameon=False, fontsize=8, ncol=2)
    ax1.set_title("Cutoff trade-off (deployed cutoff = 0.25)")
    savefig(fig, "fig-3-14-cutoff.png")


# ---------------------------------------------------------------------------
# Fig 3.15, Benchmark dot + error bar, tuned model as a star
# ---------------------------------------------------------------------------
def chart_benchmark() -> None:
    bench = portfolio["benchmark"]
    order = ["logistic_regression", "random_forest", "gradient_boosting", "xgboost", "gradient_boosting_tuned"]
    labels = {
        "logistic_regression": "Logistic\nregression",
        "random_forest": "Random\nforest",
        "gradient_boosting": "Gradient\nboosting",
        "xgboost": "XGBoost",
        "gradient_boosting_tuned": "GB tuned",
    }

    fig, ax = plt.subplots(figsize=(6.2, 3.6))
    for i, key in enumerate(order):
        entry = bench[key]
        mean = entry["roc_auc_mean"]
        std = entry.get("roc_auc_std")
        if key == "gradient_boosting_tuned":
            ax.scatter([i], [mean], marker="*", s=220, color=MONO[0], zorder=3)
        else:
            ax.errorbar([i], [mean], yerr=[std], fmt="o", color=MONO[0], ecolor=MONO[1], capsize=4, markersize=6)

    ax.set_xticks(range(len(order)))
    ax.set_xticklabels([labels[k] for k in order], fontsize=9)
    ax.set_ylabel("ROC-AUC (5-fold CV)")
    ax.set_title("Benchmark: ROC-AUC ± std by model")
    ax.set_ylim(0.70, 0.82)
    ax.yaxis.set_major_formatter(mticker.FormatStrFormatter("%.2f"))
    savefig(fig, "fig-3-15-benchmark.png")


def main() -> None:
    chart_roc()
    chart_calibration()
    chart_importance()
    chart_deciles()
    chart_cutoff()
    chart_benchmark()


if __name__ == "__main__":
    main()
