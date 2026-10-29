# Overview

## What this is

A loan default risk predictor: given twelve facts about a loan applicant —
their age, income, employment history, the loan they're asking for, and
their existing credit position — the model returns a probability that they
will default, a risk band, a recommended decision, and an exact breakdown
of which factors drove that number.

It's built on the UCI Statlog German Credit dataset (1,000 real loan
applications from a German bank, 1994), and the model behind it is a
gradient boosting ensemble, tuned and calibrated, benchmarked against
three other model families before it was chosen.

## Who this is for

This project exists as a portfolio piece — something to show after finishing
an ML internship that demonstrates the full path from a raw dataset to a
model to a deployed, explainable product. It's deliberately scoped as a
small, complete thing rather than an unfinished attempt at something large:
one dataset, one model family comparison, one deployed API, one interface.

## What it does and does not claim

It claims to be a careful, honestly-evaluated demonstration of applied
machine learning: real cross-validation, a real model comparison, a real
calibration step, and a genuinely explainable prediction for every
individual applicant (see [03-backend.md](./03-backend.md) for how the
explanation is computed exactly rather than approximated).

It does not claim to be production-ready credit infrastructure. The
training data is three decades old, from one country, and covers only
1,000 applicants. No fairness or disparate-impact audit has been run.
See [08-limitations.md](./08-limitations.md) for the complete list of
what this project is not.

## How the pieces fit together

- **`ml/train.py`** does all of the machine learning: it cleans the raw
  dataset, benchmarks four models, tunes and calibrates the winner, and
  exports it as a plain JSON file.
- **`api/predict.py`** and **`api/portfolio.py`** are the two files that
  actually run in production. Between them they have zero third-party
  dependencies — see [03-backend.md](./03-backend.md) for why.
- **`app/`** is the Next.js frontend: a landing page, an assessment form,
  a portfolio dashboard, and a methodology page.
- **`notebook.ipynb`** is a runnable proof that the production code works:
  thirteen tests exercising the real handler classes, not a rewritten copy
  of them. See [06-testing.md](./06-testing.md) for what each test checks
  and what it found.

## Where to go next

- [01-data.md](./01-data.md) — the dataset, its schema, and how income was
  recovered from a field that doesn't obviously contain it.
- [02-modelling.md](./02-modelling.md) — the four-model comparison, the
  tuning, the calibration, and why gradient boosting was chosen.
- [03-backend.md](./03-backend.md) — how a tree ensemble is deployed with
  no machine learning library running in production.
- [04-frontend.md](./04-frontend.md) and
  [05-python-libraries.md](./05-python-libraries.md) — every dependency in
  the project and exactly where it's used.
- [07-deployment.md](./07-deployment.md) — running it locally and deploying
  it to Vercel.
