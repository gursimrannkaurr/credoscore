# Deployment

## Prerequisites

- Node.js 20+ and npm
- Python 3.11–3.14 for training (a **standard CPython build, not a
  free-threaded `t` build** — see the note below)
- No Python version constraint for the deployed functions, since they use
  only the standard library

### A note on free-threaded Python

If `py --version` reports something like `3.14.5 free-threading build`,
switch to a standard build before installing training dependencies
(`py -3.12 -m pip install -r ml/requirements-train.txt`, for example).
Free-threaded CPython builds don't yet have prebuilt wheels for
scikit-learn, scipy, or xgboost on most platforms, which means `pip` falls
back to compiling them from source — a process that can hang for a very
long time on a machine without the right compiler toolchain installed.
This doesn't affect the deployed app at all, since it has no dependencies
to install.

## Regenerating the model artifacts

The two files the app depends on — `model/model.json` and
`model/portfolio.json` — are committed to the repository, so this step
isn't required to run the app. It's needed only to retrain:

```bash
py -3.12 -m pip install -r ml/requirements-train.txt
py -3.12 ml/train.py
```

This downloads nothing at runtime — the raw dataset is committed at
`ml/raw/german.data`. Retraining takes under a minute on a laptop; most of
that time is the 40-iteration hyperparameter search.

## Running the test notebook

```bash
py -3.12 -m jupyter nbconvert --to notebook --execute --inplace notebook.ipynb
```

Or open it interactively in Jupyter/VS Code and run all cells. See
[06-testing.md](./06-testing.md) for what each test checks.

## Running the app locally

Two servers, both required:

```bash
# Terminal 1 — the Python API (ports 8001, 8002)
py -3.12 ml/dev_server.py

# Terminal 2 — the Next.js app (port 3000)
npm install
npm run dev
```

`next.config.ts` rewrites `/api/predict` and `/api/portfolio` to the two
ports `ml/dev_server.py` listens on whenever `NODE_ENV !== "production"`,
so the app behaves identically to production without needing the Vercel
CLI installed at all.

## Deploying to Vercel

No configuration beyond what's committed is required:

```bash
npm install -g vercel   # if not already installed
vercel                  # preview deployment
vercel --prod           # production deployment
```

Vercel detects the Next.js framework from `package.json` and builds the
app normally. It separately detects `api/predict.py` and
`api/portfolio.py` as file-based Python functions — since neither
`requirements.txt`, `pyproject.toml`, nor `Pipfile` exists anywhere in the
project, no Python framework preset is triggered, and Vercel serves the
two files exactly as written, each at its own route
(`api/predict.py` → `/api/predict`, `api/portfolio.py` → `/api/portfolio`).

### `vercel.json`

```json
{
  "functions": {
    "api/**/*.py": {
      "excludeFiles": "{ml/**,data/**,docs/**,notebook.ipynb,node_modules/**,.next/**}"
    }
  }
}
```

By default, Vercel's Python builder includes every file reachable from the
project root in each function's bundle — there's no automatic
tree-shaking for Python the way there is for JavaScript. Without this
`excludeFiles` pattern, both Python functions would ship with a copy of
`ml/raw/german.data`, the entire `ml/` training pipeline, this
documentation, and the training notebook bundled alongside them — none of
which the functions read at runtime. The `excludeFiles` glob keeps each
function's deployed bundle to what it actually needs: `predict.py` (or
`portfolio.py`) and the two `model/*.json` files.

## Verifying a deployment

```bash
curl https://<your-deployment>.vercel.app/api/portfolio | head -c 200
curl -X POST https://<your-deployment>.vercel.app/api/predict \
  -H "Content-Type: application/json" \
  -d '{"age":35,"employment_years":4,"job_type":"skilled","housing":"own","monthly_income":2500,"loan_amount":5000,"duration_months":24,"purpose":"car_new","credit_history":"paid_duly","checking_status":"0_to_200","savings_status":"under_100","existing_credits":1}'
```

Both should return the same JSON shapes documented in
[03-backend.md](./03-backend.md).
