# Limitations

Stated plainly, in the order they matter most.

## This is not fit for real lending decisions

The model, the interface, and every number on it exist to demonstrate a
complete, honest machine learning workflow — not to price actual credit
risk for actual applicants. Nothing here has been reviewed by a credit
risk function, a compliance team, or a regulator, and it shouldn't be
treated as if it had been.

## The dataset is small and old

1,000 applicants from one German bank in 1994. Every cross-validation fold
in this project has roughly 200 held-out rows, which means every metric
reported — 0.7928 ROC-AUC, 0.4776 KS, and so on — carries real sampling
uncertainty that a single point estimate doesn't communicate on its own.
The benchmark table in [02-modelling.md](./02-modelling.md) shows this
directly: four different model families land within about 1.5 points of
ROC-AUC of each other, a gap comparable to the fold-to-fold standard
deviation. A larger, more current dataset would very plausibly rank the
four models differently.

The data also doesn't reflect three decades of change in lending
practice, credit scoring regulation, or the German (and world) economy.
Deutsche Marks aren't Euros, 1994 underwriting standards aren't 2026
standards, and none of the applicants in this dataset were affected by
anything that has happened in lending since.

## A counterintuitive, dataset-specific pattern

The model has learned that applicants with a credit history coded "all
paid back duly" score *worse* than applicants coded "critical account" —
the opposite of what intuition suggests those labels should mean. This
shows up directly in the contribution breakdowns on `/assess` for some
applicants, and it's documented in [01-data.md](./01-data.md) with a likely
explanation (a thin-file effect: "all paid" often describes a short,
easily-summarized history, while "critical" often describes a more
seasoned borrower who has managed a larger, more complex credit position
successfully). Whether or not that explanation is the true mechanism, the
pattern itself is real, present in the data, and worth surfacing rather
than smoothing over — it's a useful, concrete example of why small
historical samples can encode relationships that wouldn't hold in a
different population, and why "the model learned it" is never the same
claim as "the model learned something true in general."

## No fairness or disparate-impact audit

The original dataset's "personal status and sex" field was deliberately
excluded from the model's inputs (see [01-data.md](./01-data.md)), on the
reasoning that a credit model shouldn't be handed a protected attribute
without a specific, justified reason to. That is a precaution, not an
audit. No analysis has been run to check whether any of the twelve
retained fields act as a proxy for a protected characteristic, whether the
model's error rates differ meaningfully across demographic groups, or
whether the approval cutoff produces disparate impact by any legally
relevant category. A model intended for real use would need that analysis
before anything else.

## The calibration is good, but not certified

The calibration curve tracks observed default rates within about 2
percentage points across deciles (see [06-testing.md](./06-testing.md),
test 12) — good enough to trust the probabilities for the purposes of this
project, including choosing a cutoff from a stated cost matrix. It is not
the kind of formally validated, independently audited calibration that a
regulated financial institution would require before using a model's
output to set real terms.

## Where this leaves the project

Everything above is a reason this project is honest about being a
portfolio piece rather than a product — not a reason the modelling or
engineering work behind it is unrigorous. The cross-validation is real,
the calibration is real and measured, the model comparison is real and
reported even where it doesn't flatter the final choice, and the
explanation given for every prediction is exact, not approximate. The
limitations are about what a 1,000-row, three-decade-old dataset can and
can't support — not about shortcuts taken in the code.
