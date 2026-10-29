# Modelling

## Preprocessing

Twelve features go into a single `ColumnTransformer`:

- Six numeric fields (`age`, `employment_years`, `monthly_income`,
  `loan_amount`, `duration_months`, `existing_credits`) pass through
  unscaled. Tree-based models split on thresholds, not distances, so
  scaling would change nothing about what the model learns — it would only
  add a step that has to be inverted at inference time for no benefit.
- Six categorical fields (`job_type`, `housing`, `purpose`,
  `credit_history`, `checking_status`, `savings_status`) are one-hot
  encoded with `handle_unknown="ignore"`.

This lives in `build_preprocessor()` in `ml/train.py`, and its exact
column order is what `api/predict.py` reproduces by hand at inference time
— see [03-backend.md](./03-backend.md).

## Cross-validation

Every comparison in this document uses the same 5-fold stratified
cross-validation (`StratifiedKFold(n_splits=5, shuffle=True,
random_state=42)`), so a model's number reflects genuine out-of-sample
performance and every model was judged on the identical folds.

Scoring was done with a manual per-fold loop rather than scikit-learn's
`scoring="..."` scorer strings. This wasn't a style choice: the installed
XGBoost sklearn wrapper doesn't fully implement the estimator-tag interface
that scikit-learn 1.9's generic scorers expect, and passed a shape error
partway through scoring. Cross-validating by hand — fit on the fold's
training split, call `predict_proba` on its held-out fold, pool the
out-of-fold probabilities — sidesteps that entirely and benchmarks all four
candidates identically.

## Four-model benchmark

| Model | ROC-AUC (mean ± std) | PR-AUC |
|---|---|---|
| Logistic Regression (balanced class weights) | 0.7737 ± 0.0212 | 0.5757 |
| Random Forest (300 trees, depth 6) | 0.7883 ± 0.0277 | 0.6329 |
| Gradient Boosting (150 trees, depth 3, untuned) | 0.7859 ± 0.0188 | 0.6243 |
| XGBoost (200 trees, depth 3) | 0.7893 ± 0.0193 | 0.6299 |

These are real numbers from the training run, not illustrative figures —
reproduce them with `py ml/train.py`. All four models land within about
1.5 points of ROC-AUC of each other; on a 1,000-row dataset with 5-fold
CV, that gap is comparable to the fold-to-fold noise (note the ±0.02–0.03
standard deviations), so this comparison should be read as "these
approaches are roughly tied on raw discrimination" rather than as a
decisive win for any one of them.

## Hyperparameter tuning

The Gradient Boosting family was carried forward into a randomized search
(`RandomizedSearchCV`, 40 iterations, same 5-fold CV, scored on ROC-AUC)
over:

```python
{
    "n_estimators": [80, 120, 150, 200, 250, 300],
    "max_depth": [2, 3, 4, 5],
    "learning_rate": [0.01, 0.03, 0.05, 0.08, 0.1, 0.15],
    "subsample": [0.7, 0.8, 0.9, 1.0],
    "min_samples_leaf": [5, 10, 20, 30],
}
```

Best configuration found:

```json
{
  "n_estimators": 250,
  "max_depth": 3,
  "learning_rate": 0.05,
  "subsample": 0.8,
  "min_samples_leaf": 20
}
```

Cross-validated ROC-AUC at this configuration: **0.7965** — a small but
real improvement over the untuned Gradient Boosting run (0.7859), and
enough to edge past XGBoost's untuned 0.7893.

## Why Gradient Boosting, not XGBoost

After tuning, Gradient Boosting and XGBoost are statistically
indistinguishable on this dataset — the gap that remains is inside the
cross-validation noise. Given that, the deciding factor was deployability,
not the leaderboard: scikit-learn's `GradientBoostingClassifier` exposes
its trees as plain NumPy arrays (`tree_.feature`, `tree_.threshold`,
`tree_.children_left`, `tree_.children_right`, `tree_.value`) that convert
directly into the JSON format `api/predict.py` walks with the standard
library. XGBoost's booster format is more involved to flatten equivalently
and offers no accuracy advantage here to justify it. See
[03-backend.md](./03-backend.md) for the full reasoning — it's a Vercel
deployment constraint, not a modelling one.

## Calibration

A model used to set a lending cutoff needs its probabilities to mean what
they say, not just rank applicants correctly. Rather than wrapping the
final model in scikit-learn's `CalibratedClassifierCV` (which, with
cross-validated folds, produces an ensemble of calibrators that doesn't
flatten into a single exportable transform), calibration here is done
explicitly and exported as two numbers:

1. Collect out-of-fold **raw margins** (`decision_function` output, before
   any sigmoid) for every applicant, using the same 5-fold split.
2. Fit a single one-feature logistic regression — Platt scaling — from
   those raw margins to the true outcomes: `P(default) = sigmoid(A · raw +
   B)`.
3. Store `A` and `B` in the model artifact. The deployed API applies this
   exact transform (see `api/predict.py`).

Fitted values: **A = 0.796129, B = −0.113198**.

## Out-of-fold performance (final, calibrated model)

These are the numbers that also appear on the `/model` page and drive the
portfolio dashboard — every one of them is computed from predictions made
without that row in the training data:

| Metric | Value |
|---|---|
| ROC-AUC | 0.7928 |
| PR-AUC | 0.6344 |
| KS statistic | 0.4776 |
| Brier score | 0.1601 |

For context, a model that predicted the base rate (30%) for every
applicant would score a Brier score of `0.3 × 0.7 = 0.21` — this model's
0.1601 is a meaningful improvement, and the calibration curve on `/model`
shows predicted and observed rates tracking within about 2 percentage
points across deciles (see `notebook.ipynb`, test 12, for the exact
per-decile numbers).

## Choosing the cutoff

The UCI documentation for this dataset publishes the bank's own cost
matrix:

|  | Predicted good | Predicted bad |
|---|---|---|
| **Actually good** | 0 | 1 |
| **Actually bad** | 5 | 0 |

Approving an applicant who defaults costs five times what declining a
creditworthy applicant costs. The deployed cutoff — **25%** predicted
probability of default — reflects that asymmetry: loose enough that most
of the book still gets approved (the base rate is 30%, so a 25% cutoff is
only mildly conservative relative to that), tight enough that the expected
cost of the approvals it does make stays controlled given the 5:1
asymmetry. The cutoff is adjustable live on `/assess`, and the
approval-rate-vs-bad-rate tradeoff across the full range of cutoffs is
plotted on `/portfolio`.
