# Python libraries

Split into two lists that never overlap, which is the whole point of this
project's architecture — see [03-backend.md](./03-backend.md) for why.

## Training-time only (`ml/requirements-train.txt`) — never deployed

Vercel's Python builder never sees this file. It's used exclusively when a
human runs `py ml/train.py` or `notebook.ipynb` on their own machine.

| Library | Used for |
|---|---|
| `pandas` | Reading the whitespace-delimited raw dataset, all the cleaning and feature derivation in `load_clean_dataset()`, and the segment/decile aggregation in the portfolio export |
| `numpy` | Vectorized arithmetic throughout training: the income derivation, the sigmoid function, out-of-fold prediction arrays, calibration-bin math |
| `scikit-learn` | `ColumnTransformer` and `OneHotEncoder` for preprocessing; `LogisticRegression`, `RandomForestClassifier`, `GradientBoostingClassifier` as three of the four benchmarked models; `StratifiedKFold` for cross-validation; `RandomizedSearchCV` for hyperparameter tuning; `roc_auc_score`, `average_precision_score`, `roc_curve`, `brier_score_loss` for evaluation |
| `xgboost` | The fourth benchmarked model (`XGBClassifier`) — included specifically so the comparison covers the model family most likely to be asked about, even though it wasn't the one deployed |
| `shap` | `TreeExplainer` in `notebook.ipynb` (test 8) — an independent cross-check that the runtime's hand-rolled path-contribution method agrees with a published, peer-reviewed explanation method, rather than trusting a from-scratch implementation on its own claims |
| `matplotlib` | Available for ad-hoc diagnostic plotting while iterating on the notebook; the charts that actually ship in the product are all Recharts components in the frontend, described in [04-frontend.md](./04-frontend.md) |
| `requests` | One-time download of the UCI dataset archive during initial setup (see [07-deployment.md](./07-deployment.md)) |
| `jupyter`, `ipykernel` | Running `notebook.ipynb` |

## Runtime (`api/predict.py`, `api/portfolio.py`) — deployed to Vercel

```
json    — parsing request bodies, serializing responses, loading model.json
math    — exp() for the sigmoid function, isnan()/isinf() for input validation
pathlib — locating model.json and portfolio.json relative to the deployed function
http.server — BaseHTTPRequestHandler, the supported zero-dependency entrypoint
             for a file-based Python function in Vercel's /api directory
typing  — type hints only, erased at runtime
```

That's the complete list. There is no `requirements.txt` next to
`api/predict.py` or `api/portfolio.py` — Vercel's Python builder looks for
one, doesn't find it, and ships the two files with nothing but the
standard library that already ships inside the Python runtime itself. This
is what makes the two production files fast to cold-start and impossible
to break with a dependency conflict.
