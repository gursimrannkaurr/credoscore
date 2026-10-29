# Loan Default Risk Predictor

A credit risk assessment tool trained on the UCI Statlog German Credit
dataset (1,000 real loan applications). Given an applicant's income,
credit history, loan terms, and employment, it returns a calibrated
probability of default, a risk band, and an exact, factor-by-factor
explanation of the score — computed by a gradient boosting ensemble that
is deployed with **zero third-party dependencies at runtime**.

## Quickstart

```bash
# 1. Frontend
npm install

# 2. Two servers, both needed for local development
py -3.12 ml/dev_server.py   # terminal 1 — the API, on ports 8001/8002
npm run dev                 # terminal 2 — Next.js, on port 3000
```

Open http://localhost:3000. See [docs/07-deployment.md](docs/07-deployment.md)
for retraining the model and deploying to Vercel.

## What's here

| Path | What it is |
|---|---|
| `app/` | The Next.js frontend — landing page, assessment form, portfolio dashboard, methodology page |
| `components/` | UI primitives, charts, and page-level components |
| `api/predict.py` | The scoring endpoint — one file, zero dependencies |
| `api/portfolio.py` | The portfolio dashboard's data endpoint — one file, zero dependencies |
| `model/` | The exported model artifacts the two API files read |
| `ml/train.py` | The full training pipeline — data cleaning, model comparison, tuning, calibration, export |
| `data/` | The cleaned, feature-engineered dataset |
| `notebook.ipynb` | Thirteen tests against the real production code — see [docs/06-testing.md](docs/06-testing.md) |
| `docs/` | Full documentation — start at [docs/00-overview.md](docs/00-overview.md) |

## The one-sentence pitch

Every input on the assessment page maps directly to a real column in the
training data (with one derived — see [docs/01-data.md](docs/01-data.md)
for how income was recovered from a field that doesn't obviously contain
it), the model was chosen after a fair, identically-cross-validated
comparison against three other approaches
([docs/02-modelling.md](docs/02-modelling.md)), and every prediction comes
with a contribution breakdown that is provably exact — not a
visualization built to look plausible
([docs/03-backend.md](docs/03-backend.md)).

## Documentation

1. [Overview](docs/00-overview.md)
2. [The data](docs/01-data.md)
3. [Modelling](docs/02-modelling.md)
4. [Backend](docs/03-backend.md)
5. [Frontend dependencies](docs/04-frontend.md)
6. [Python libraries](docs/05-python-libraries.md)
7. [Testing](docs/06-testing.md)
8. [Deployment](docs/07-deployment.md)
9. [Limitations](docs/08-limitations.md)

## Not for real lending decisions

This is a portfolio project. See [docs/08-limitations.md](docs/08-limitations.md).
