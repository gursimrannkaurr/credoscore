# The data

## Source

The [UCI Statlog (German Credit Data)](https://archive.ics.uci.edu/dataset/144/statlog+german+credit+data)
dataset: 1,000 loan applications collected by Professor Hans Hofmann at the
University of Hamburg, published through the UCI Machine Learning
Repository under a CC BY 4.0 licence. It's one of the most widely used
credit risk datasets in academic machine learning, precisely because it's
small enough to reason about in full and comes with a documented cost
matrix rather than leaving that judgment call to whoever downloads it.

The raw file is committed at `ml/raw/german.data`, and the cleaned,
feature-engineered version this project actually trains on is written to
`data/german_credit.csv` by `ml/train.py`.

## Original schema

The dataset has twenty attributes plus the outcome. Seven are numeric;
thirteen are categorical, encoded as short codes (`A11`, `A34`, and so on)
that `ml/train.py` maps to readable values:

| # | Field | Type | Meaning |
|---|---|---|---|
| 1 | Status of existing checking account | categorical | `<0 DM`, `0–200 DM`, `≥200 DM`, or no account |
| 2 | Duration | numeric | Loan term, in months |
| 3 | Credit history | categorical | From no credit history to a delayed payment history |
| 4 | Purpose | categorical | Car, furniture, education, business, etc. |
| 5 | Credit amount | numeric | The loan amount, in Deutsche Marks |
| 6 | Savings account/bonds | categorical | Balance bracket, or no savings account |
| 7 | Present employment since | categorical | Unemployed up to 7+ years |
| 8 | Installment rate | numeric | The monthly installment as a percentage of disposable income |
| 9 | Personal status and sex | categorical | *Excluded from this project — see below* |
| 10 | Other debtors/guarantors | categorical | *Excluded* |
| 11 | Present residence since | numeric | *Excluded* |
| 12 | Property | categorical | *Excluded* |
| 13 | Age | numeric | In years |
| 14 | Other installment plans | categorical | *Excluded* |
| 15 | Housing | categorical | Rents, owns, or lives rent-free |
| 16 | Existing credits at this bank | numeric | Count |
| 17 | Job | categorical | Unskilled through management |
| 18 | Number of dependents | numeric | *Excluded* |
| 19 | Telephone | categorical | *Excluded* |
| 20 | Foreign worker | categorical | *Excluded* |
| — | Target | binary | 1 = good (no default), 2 = bad (default) |

## What was deliberately excluded, and why

The model trains on twelve of the twenty original fields. Eight were left
out:

- **Personal status and sex (#9)** is excluded on purpose. It's the one
  field in the dataset that functions as a protected attribute, and a
  project whose whole point is an honest credit model shouldn't hand it to
  the model without at least being asked to justify that choice — and
  nothing about the stated brief (income, credit history, loan amount,
  employment type) required it.
- **Other debtors, residence tenure, property type, other installment
  plans, dependents, telephone, and foreign-worker status (#10–12, 14,
  18–20)** were excluded because they add categorical surface area without
  changing the story the model tells: the twelve retained fields already
  cover applicant profile, loan terms, and credit position, which is what
  the brief actually asked for. Fewer, more legible inputs also make the
  assessment form on `/assess` something a person can fill in without a
  glossary.

This is a feature-selection decision, not a data-cleaning necessity — it's
recorded here so it's visible rather than silently baked into the code.

## Deriving income

The dataset has no income column. It does have attribute 8, defined in the
UCI documentation as *"installment rate in percentage of disposable
income"* — which is a ratio between two other quantities the dataset
already gives directly: the monthly loan installment (amount ÷ duration)
and the applicant's disposable income. That definition inverts exactly:

```
monthly_installment  = credit_amount / duration_months
disposable_income    = monthly_installment / (installment_rate / 100)
```

Worked example, using the dataset's first row (amount 1,169 DM, duration 6
months, installment rate 4):

```
monthly_installment = 1169 / 6        =  194.83 DM
disposable_income   = 194.83 / (4/100) = 4,870.83 DM
```

The installment rate in this dataset only ever takes the values 1, 2, 3, or
4 — it's a coarse ordinal bucket, not a continuous percentage — which means
derived income is only as precise as that bucket allows. It's a real,
algebraically exact recovery of a quantity the dataset defines, not an
invented feature, but it inherits the coarseness of the field it comes
from. This is disclosed rather than smoothed over: `monthly_income` in
`data/german_credit.csv` is this derived value, rounded to two decimal
places.

## Currency

All monetary values are in Deutsche Marks (DM), the currency of the
original 1994 dataset. The interface labels amounts as `DM` explicitly
rather than silently relabelling historical Deutsche Marks as euros or
dollars — the numbers are only meaningful in the context they came from.

## Cleaning steps

`ml/train.py`'s `load_clean_dataset()` function:

1. Reads the whitespace-delimited raw file with pandas, naming all
   twenty-one original columns.
2. Maps every categorical code (`A11`, `A34`, ...) to a readable snake_case
   value (`less_than_0`, `critical`, ...) used consistently through the
   backend, the frontend, and this documentation.
3. Maps the five employment-tenure buckets to representative numeric years
   (0, 0.5, 2.5, 5.5, 10) so `employment_years` can be a plain number in
   the assessment form rather than a category picker.
4. Derives `monthly_income` as described above.
5. Recodes the target from `{1, 2}` to `{0, 1}` (`default = 1` means the
   applicant defaulted).
6. Selects the twelve retained features plus the target and writes the
   result to `data/german_credit.csv`.

## What the data shows

The base default rate is exactly 30% (300 of 1,000 applicants). The
dataset is imbalanced but not severely so, which is part of why class
weighting rather than resampling (SMOTE, etc.) was the right tool — see
[02-modelling.md](./02-modelling.md).

One pattern worth flagging on its own, because the model has clearly
learned it: applicants coded as having *"all credits paid back duly"*
(credit history `all_paid`) default at a noticeably higher rate in this
sample than applicants coded `critical` (an existing account with other
credit lines, viewed less favourably on its face). This is almost
certainly a thin-file effect — `all_paid` is a small, easily-summarized
history, while `critical` describes a more seasoned borrower who has, in
practice, managed more credit successfully — but it is exactly the kind of
counterintuitive pattern that a 1,000-row historical sample can encode
without it generalizing to a different population. It's discussed again in
[08-limitations.md](./08-limitations.md) because it shows up directly in
the model's contribution breakdowns.
