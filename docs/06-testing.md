# Testing — `notebook.ipynb`

Every test below imports and calls the real production code —
`api/predict.py` and `api/portfolio.py` — in-process. For the two tests
that need to exercise the actual HTTP handler contract (tests 3, 9, 10,
12), the notebook drives the real `BaseHTTPRequestHandler` subclasses
through a mock socket built from `io.BytesIO`, rather than testing a
simplified stand-in. This is the same code that ships to Vercel.

Run with:

```
py -3.12 -m jupyter nbconvert --to notebook --execute --inplace notebook.ipynb
```

All thirteen passed on the run this documentation describes. Results below
are the actual recorded output, not illustrative numbers.

## Theme 1 — Fidelity

**Test 1 — Artifact integrity.** Confirms `model/model.json` loads, has a
valid version string, contains trees, and every stored coefficient and
node value is finite (no `NaN`/`Inf` leaked from training).
→ **PASS** — 250 trees, base value −0.8473, all node values finite.

**Test 2 — Parity.** Every one of the 1,000 training rows is scored two
ways: once through the pure-Python tree walker in `api/predict.py`, once
through the live, refitted scikit-learn pipeline. The two must agree to
within `1e-9`.
→ **PASS** — maximum observed difference **3.33 × 10⁻¹⁶**, at the
floating-point precision limit itself.

## Theme 2 — Behavioural correctness

**Test 3 — Handler smoke test.** A valid request through the real
`BaseHTTPRequestHandler.do_POST()` returns `200` with every expected key
present.
→ **PASS**.

**Test 4 — Strong applicant.** A 50-year-old manager with 10 years'
tenure, 7,000 DM monthly income, and a small 1,500 DM loan should land in
the Low band, below the 25% cutoff.
→ **PASS** — PD 6.73%, Low band.

**Test 5 — Weak applicant.** A 22-year-old, unemployed non-resident
applicant with a 15,000 DM loan over 48 months and a history of delayed
payments should land in the High band.
→ **PASS** — PD 96.45%, High band, decision "decline".

**Test 6 — Directional sanity.** Holding every other field fixed, raising
the loan amount from 2,000 DM to 15,000 DM should never lower the
predicted probability of default.
→ **PASS** — PD rose from 39.54% to 85.03%.

**Test 7 — Additivity.** For 100 randomly sampled applicants, does
`base_value + sum(all path contributions)` equal the raw model margin
exactly? This test caught a real bug during development: an early version
of the contribution walk started each tree's attribution from its actual
root value rather than zero, silently dropping every tree's root value
from the explanation (see [03-backend.md](./03-backend.md) for the fix).
→ **PASS** (after the fix) — maximum discrepancy **5.77 × 10⁻¹⁵**.

**Test 8 — Independent cross-check against TreeSHAP.** For the same 100
applicants, do the top 5 factors identified by the runtime's path
contributions overlap (at least 3 of 5) with the top 5 factors identified
by `shap.TreeExplainer`, an independently implemented and peer-reviewed
method?
→ **PASS** — agreement on **93 of 100** applicants (93%).

## Theme 3 — Robustness

**Test 9 — Validation.** A missing field, an unrecognized category value,
and a wrong-typed field should each return `400` with a specific,
actionable message — not a generic error and not a `500`.
→ **PASS** — all three returned `400` with field-level messages, e.g.
`"'housing' must be one of ['free', 'own', 'rent'], got 'mansion'."`

**Test 10 — Boundary values.** Six edge cases — minimum income, minimum
loan amount, maximum duration, zero existing credits, a negative loan
amount, and an absurdly long duration — should each resolve to either a
clean `200` or a clean `400`, never a `500`.
→ **PASS** — statuses `[400, 200, 200, 200, 400, 400]`; the two rejected
cases were the negative amount and the out-of-range duration, exactly as
intended.

## Theme 4 — Quality

**Test 11 — Quality gate.** The out-of-fold ROC-AUC must be at least 0.75
and the KS statistic at least 0.35 for the model to be considered good
enough to deploy.
→ **PASS** — ROC-AUC 0.7928, KS 0.4776, Brier 0.1601 (vs. 0.21 for a
model that just predicts the base rate for everyone).

**Test 12 — Calibration and portfolio consistency.** The weighted mean
absolute gap between predicted and observed default rate, across ten
probability bins, should be under 2 percentage points; the portfolio's
risk-band counts should sum to exactly 1,000; and `GET /api/portfolio`
should return data matching the artifact on disk.
→ **PASS** — weighted gap **1.95 percentage points**, band counts sum to
1,000, endpoint consistent. The full decile table:

| Decile | Applicants | Mean predicted PD | Observed default rate |
|---|---|---|---|
| 1 | 100 | 4.49% | 7.00% |
| 2 | 100 | 8.10% | 7.00% |
| 3 | 100 | 11.95% | 12.00% |
| 4 | 100 | 16.09% | 17.00% |
| 5 | 100 | 20.77% | 18.00% |
| 6 | 100 | 26.96% | 23.00% |
| 7 | 100 | 34.08% | 36.00% |
| 8 | 100 | 44.73% | 46.00% |
| 9 | 100 | 57.69% | 58.00% |
| 10 | 100 | 75.12% | 76.00% |

**Test 13 — Latency.** 1,000 sequential predictions through the real
handler, timed individually.
→ **PASS** — mean **0.76 ms**, p95 **1.15 ms**, max 4.02 ms. Comfortably
within any reasonable Vercel function timeout, and fast enough that the
tree-walk approach was never a performance concern relative to running a
full scikit-learn pipeline in the function.

## Summary

```
 Test  Status  Name
------------------------------------------------------------
    1  PASS    Artifact integrity
    2  PASS    Parity (stdlib vs. sklearn, all 1000 rows)
    3  PASS    Handler smoke test
    4  PASS    Strong applicant -> Low band, PD below cutoff
    5  PASS    Weak applicant -> High band
    6  PASS    Directional sanity (loan amount)
    7  PASS    Additivity of path contributions
    8  PASS    Runtime contributions agree with offline TreeSHAP
    9  PASS    Validation errors return 400 with a useful message
   10  PASS    Boundary values handled without a 500
   11  PASS    Quality gate (out-of-fold ROC-AUC >= 0.75, KS >= 0.35)
   12  PASS    Calibration within 2pp (weighted) + portfolio endpoint consistency
   13  PASS    Latency (1000 predictions)
------------------------------------------------------------
13/13 tests passed.
```
