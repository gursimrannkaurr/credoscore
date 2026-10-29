# Backend

## Why training and serving are split

Two facts about Vercel's Python runtime shaped this project's whole
architecture:

1. **Vercel gives a detected Python framework preset precedence over
   file-based functions in `/api`.** If `requirements.txt` names FastAPI,
   Flask, or Django, Vercel builds and routes the *entire project* through
   that framework — which would break the Next.js app sharing this
   repository. Keeping `api/predict.py` and `api/portfolio.py` as
   framework-free, dependency-free files is what lets them coexist with
   Next.js in one deployment.
2. **scikit-learn alone is roughly 100 MB unzipped**, before numpy and
   scipy are counted. Vercel's standard Python bundle limit is 500 MB
   uncompressed, so it's not impossible to ship scikit-learn — but a
   dependency that large means slow cold starts and, on a serverless
   platform charging for build size, no upside for what is fundamentally a
   few thousand arithmetic comparisons per request.

The resolution: **train with the full scikit-learn toolchain, offline, and
export the fitted model as data.** `ml/train.py` (which needs everything
in `ml/requirements-train.txt`) produces `model/model.json` — coefficients
and tree structure as nested lists, nothing scikit-learn-specific about
the format. The two files that actually run on Vercel, `api/predict.py`
and `api/portfolio.py`, read that JSON and do the rest with `json`, `math`,
and `http.server` from the standard library. There is no
`requirements.txt` anywhere Vercel's Python builder will see, so there is
no dependency footprint to manage at all.

## The model artifact — `model/model.json`

| Field | Meaning |
|---|---|
| `model_version` | Semantic version of the exported artifact |
| `numeric_features` | The six numeric input fields, in the exact order the model expects them |
| `categorical_features` | The six categorical input fields |
| `categories` | For each categorical field, its known values in the exact order used to build one-hot vectors |
| `learning_rate` | The Gradient Boosting ensemble's shrinkage factor |
| `base_value` | The ensemble's constant prior (verified constant across every training row to within 1e-6 before being trusted — see `ml/train.py`) |
| `platt_a`, `platt_b` | The calibration transform: `P(default) = sigmoid(platt_a · raw_margin + platt_b)` |
| `trees` | 250 trees, each as four parallel arrays: `feature`, `threshold`, `left`, `right` (child node indices), and `value` (the fitted output at every node) |
| `cutoff` | The deployed decision threshold (0.25) |
| `metrics`, `benchmark`, `hyperparameters` | Recorded for the `/model` page — see [02-modelling.md](./02-modelling.md) |

The whole artifact is about 130 KB for 250 trees of depth 3.

## Building the feature vector

`build_vector()` in `api/predict.py` reproduces the training-time
`ColumnTransformer`'s output order exactly: the six numeric values first
(in the order `model["numeric_features"]` lists them), then one one-hot
block per categorical field, each block ordered by `model["categories"]`.
Because that list is the literal `categories_` attribute captured from the
fitted `OneHotEncoder` at training time, the deployed code never has to
guess or re-derive an ordering — it just replays the one that was recorded.

## Walking the trees

`score()` in `api/predict.py` walks all 250 trees for a single applicant:

```python
raw = model["base_value"]
for tree in model["trees"]:
    node = 0
    while tree["left"][node] != -1:      # not a leaf yet
        go_left = vector[tree["feature"][node]] <= tree["threshold"][node]
        node = tree["left"][node] if go_left else tree["right"][node]
    raw += tree["value"][node] * model["learning_rate"]
probability = sigmoid(model["platt_a"] * raw + model["platt_b"])
```

This is a direct, literal implementation of what a fitted
`GradientBoostingClassifier.decision_function()` computes internally — no
approximation, no reduced precision. `notebook.ipynb` test 2 confirms this
by comparing every one of the 1,000 training rows' predictions against the
live scikit-learn pipeline: the maximum difference recorded was **3.33 ×
10⁻¹⁶**, at the limit of floating-point precision itself.

## Explaining a prediction: path contributions

While walking each tree, `score()` also records how much that tree's
output changed at each split, and attributes that change to whichever
feature the split tested — the Saabas decision-path method. The
implementation detail that makes this exact rather than approximate: each
tree's attribution walk starts from a **virtual value of zero**, not the
tree's actual root value. A tree's root output isn't zero in general (it's
the tree's own average fitted residual), and if contributions started from
there instead, the sum of per-split deltas would only reconstruct
`leaf − root`, silently dropping every tree's root value from the
explanation entirely. Starting from zero means each tree's full output is
attributed across the path taken through it, and the ensemble's one shared
prior lives entirely in `base_value`.

The payoff: for any applicant, `base_value + sum(all contributions) ==
raw_margin` **exactly** — not approximately. `notebook.ipynb` test 7
confirms this to a maximum discrepancy of **5.77 × 10⁻¹⁵** across 100
sampled applicants. Test 8 goes further and cross-checks the *ranking* of
top contributing factors against an independent method — TreeSHAP,
computed offline with the `shap` library — and found agreement (at least 3
of the top 5 factors matching) on 93 of 100 sampled applicants.

This is what powers the contribution waterfall on `/assess`: it is real
arithmetic recovered from the model's own decision path, not a
post-hoc visualization built to look plausible.

## `POST /api/predict`

Request:

```json
{
  "age": 35, "employment_years": 4, "job_type": "skilled", "housing": "own",
  "monthly_income": 2500, "loan_amount": 5000, "duration_months": 24,
  "purpose": "car_new", "credit_history": "paid_duly",
  "checking_status": "0_to_200", "savings_status": "under_100",
  "existing_credits": 1
}
```

Response:

```json
{
  "probability_of_default": 0.5718,
  "risk_band": "high",
  "score": 536,
  "decision": "decline",
  "cutoff": 0.25,
  "contributions": [
    { "feature": "loan_amount", "label": "Loan amount", "value": 5000.0, "contribution": 0.0746 }
  ],
  "base_rate": 0.3,
  "model_version": "1.0.0"
}
```

Validation (`validate_and_extract()`) runs before any scoring happens and
returns `400` with a field-level message for:

- a missing required field,
- a numeric field that isn't a number, is infinite/NaN, or is outside a
  sane range (see `NUMERIC_BOUNDS` in `api/predict.py`),
- a categorical field with a value not in `model["categories"]`,
- a loan amount and duration implying a monthly installment more than 4×
  the applicant's stated income (almost always a data-entry error rather
  than a real application).

Nothing in this handler returns `500` for bad input — the top-level
`do_POST` wraps everything in a broad `except Exception` that still
returns a clean `400`, on the reasoning that a client sending malformed
input should never see a server error for something the server can
diagnose.

## `GET /api/portfolio`

Serves `model/portfolio.json` — precomputed once at training time from
out-of-fold predictions across all 1,000 applicants — verbatim. This
endpoint does no computation, which is why it's cacheable
(`Cache-Control: public, max-age=3600`) and why it needs no dependencies
either.

## Local development

`ml/dev_server.py` runs the two *actual* handler classes from
`api/predict.py` and `api/portfolio.py`, unmodified, behind two small
`http.server.HTTPServer` instances on ports 8001 and 8002.
`next.config.ts` rewrites `/api/predict` and `/api/portfolio` to those
ports only when `NODE_ENV !== "production"` — in production on Vercel, the
two Python files are served directly at those paths, no rewrite needed.
See [07-deployment.md](./07-deployment.md).
