<section class="front-page synopsis-cover">

<p class="institute">SRI GURU TEG BAHADUR INSTITUTE OF<br>MANAGEMENT AND INFORMATION TECHNOLOGY</p>

<p class="dept">Department of BCA</p>

<p class="synopsis-label">SYNOPSIS REPORT</p>

<p class="on-label">ON</p>

<p class="brand-name">CREDOSCORE</p>

<p class="proj-title"><span class="quote">&ldquo;</span>LOAN DEFAULT RISK PREDICTOR<span class="quote">&rdquo;</span></p>

<p class="submitted-note">Submitted in partial fulfilment of the requirement for<br><span class="str-line">Software Training Report (STR), BCA &ndash; Vth Semester</span></p>

<div class="cover-two-col">
<div class="col">

<p class="label">Submitted by:</p>

<p class="name">GURSIMRAN KAUR</p>

<p class="detail">Roll No.: 02490202024</p>

<p class="detail">Section: BCA 5A</p>

</div>
<div class="col">

<p class="label">Under the Guidance of:</p>

<p class="detail">Coordinator: <span class="name">Ms. Nehu Gumber</span></p>

<p class="detail">HOD (BCA): Dr. Raj Kumar</p>

</div>
</div>

</section>

<section class="synopsis-body page-start">

<p class="front-title">CERTIFICATE</p>

Certificate of Completion issued by GRAStech to GURSIMRAN KAUR for successfully completing the six-week online internship program in Machine Learning Using Python. Date of issue: 31 July 2026. Signed by Mohammad Qayam Ali, Founder and Program Head.

<figure class="cert-figure"><img src="../assets/brand/company-certificate.png" alt="Scanned company certificate of completion issued by GRAStech to Gursimran Kaur"></figure>

</section>

<section class="synopsis-body page-start">

## A. Title of the Project

**Loan Default Risk Predictor: An Explainable Machine Learning Web Application for Credit Risk Assessment.**

Loan default is a common problem for any lender that extends unsecured credit, and the decision to approve, decline or place conditions on an application has to be made from the information on hand, at the time of application, in a way that is consistent across officers and defensible afterwards. The Loan Default Risk Predictor is a web application that scores a loan applicant's probability of default with three calibrated models (Gradient Boosting, XGBoost and Random Forest), compares their results, explains the primary Gradient Boosting score factor by factor, and lets the lender see how moving the approval cutoff changes the approval rate, the bad rate and the expected cost. The project was undertaken to study whether historical application data can be used to replace an inconsistent, unexplained decision with a consistent, calibrated and explainable one.

## B. Statement about the Problem

A lender approving an unsecured loan cannot know, at the time of the decision, whether the applicant will eventually repay or default; that outcome is settled only months or years later. Left to individual judgement, two applicants with a similar credit history can receive different outcomes depending on who reviews the file, and the reasoning behind a decline is rarely written down in a form the applicant can be shown. A missed default and a wrongly declined applicant also carry different costs to the lender, and few manual or automated processes make that difference explicit. The problem addressed by this project is therefore whether an applicant's loan, employment and credit-history details can be used to compute a calibrated probability of default, a lending recommendation and a factor-by-factor reason for that recommendation, in a way a loan officer can defend and an applicant can understand.

## C. Why the Particular Topic is Chosen? (Present State of the Art)

The topic was chosen for the following reasons:

- Credit risk assessment is a practical, widely studied problem across lending and fintech, and a well-documented public dataset (the UCI Statlog German Credit data) exists to build and benchmark a real model against.
- Machine learning models can capture interactions between an applicant's attributes, such as a short employment history combined with a long loan duration, that a simple weighted scorecard cannot.
- Gradient boosting was chosen over a plain logistic-regression scorecard because it reached a higher ROC-AUC and PR-AUC under identical cross-validation folds, while still allowing an exact, additive explanation of every prediction, which a black-box ensemble normally does not offer.
- The project exercises the complete life cycle of an applied machine learning product: data understanding, preprocessing and feature engineering, model benchmarking and tuning, probability calibration, per-applicant explanation, a dependency-free production API, a front end, and testing, giving broad practical exposure within a single six-week internship.

## D. Objective and Scope of the Project

### Objectives

1. To collect the twelve applicant, loan and credit-position fields needed to score a loan application, with client-side and server-side validation.
2. To benchmark four candidate models, deploy three of them to production (gradient boosting, XGBoost and random forest), score them together on every request so an officer can compare their results, and calibrate each deployed model's default-probability estimate.
3. To return, for every scored applicant, a probability of default, a risk band, a credit-style score and a lending recommendation.
4. To explain the primary Gradient Boosting prediction through factor contributions that sum to its probability minus its starting probability, displayed as a score-driver waterfall.
5. To let a user move the approval cutoff and see the resulting approval rate, bad rate and expected cost change in real time.
6. To deploy the system on a free hosting platform so that it can be accessed publicly through a web link, without a heavy machine learning runtime at request time.

### Scope

The project covers capturing the twelve fields shared by all three models and validating them on both the browser and the server, scoring an applicant and returning a probability of default together with a risk band (low, medium or high), a 300-to-850 score and a lending decision (approve, approve with conditions, refer for review or decline), comparing the three models' probabilities, risk bands and decisions, explaining the Gradient Boosting score with a factor-by-factor waterfall, a what-if cutoff control for that primary model, and portfolio-level analytics such as the band split, the cutoff trade-off and the decile-wise lift. Using the tool for real lending decisions, a formal fairness audit, user accounts and retraining the model from within the interface are outside the present scope and are listed as future scope below.

## E. Analysis, Design, Development &amp; Testing Methodology

### 1. Analysis

The dataset used is the UCI Statlog German Credit Data (Prof. Dr. Hans Hofmann, Universit&auml;t Hamburg, 1994): 1,000 applicants, 700 good and 300 bad, described by 20 original attributes (7 numeric, 13 categorical). Twelve of these were retained for the project: six numeric fields (age, employment years, monthly income, loan amount, duration in months, existing credits) and six categorical fields (job type, housing, purpose, credit history, checking status, savings status). The personal-status-and-sex attribute was excluded as a protected attribute, and several other original attributes were dropped to keep the application form short.

### 2. Design &ndash; Data Preprocessing

The six categorical fields were one-hot encoded and the six numeric fields were passed through unscaled, since tree-based models do not require feature scaling; together this expands the twelve input fields to 37 columns. Two engineered features were added: the employment-duration buckets in the source data (coded A71&ndash;A75) were mapped to representative years of 0, 0.5, 2.5, 5.5 and 10, and monthly income was derived from the loan amount, the duration and the instalment rate, since the source data does not record income directly. The data was split for evaluation using a stratified 5-fold cross-validation with a fixed random seed, so every candidate model was benchmarked on identical folds.

### System Design

The browser submits one applicant to `POST /api/predict-compare`. The server validates and encodes the input once, then scores the three JSON model artifacts. It returns separate model results rather than averaging them into a new ensemble. `POST /api/predict` remains available for the primary model; `GET /api/portfolio` serves aggregate analytics. No applicant records are stored.

![Figure E.1 Three-layer architecture with a separate offline training path](../assets/figures/fig-3-1-architecture.svg)

![Figure E.2 Three-model scoring and comparison workflow](../assets/figures/fig-synopsis-model-comparison.svg)

The officer assesses an applicant and examines the drivers; an analyst explores portfolio risk; a maintainer retrains and exports the models offline. Drawn actors and oval use cases identify these roles.

![Figure E.3 Actors and use cases of the system](../assets/figures/fig-3-6-usecase.svg)

The following conceptual entity diagram describes the in-memory request and response objects, not persisted database tables. One application receives one prediction from each model. Contributions are available for the boosting models; the Random Forest result has no contribution list.

![Figure E.4 Conceptual entities and model-prediction relationships](../assets/figures/fig-3-3-erd.svg)

<div class="synopsis-process-pair">

![Figure E.5 Offline training and export process](../assets/figures/fig-3-7-training-flow.svg)

![Figure E.6 Validation and live assessment process](../assets/figures/fig-3-8-predict-flow.svg)

</div>

![Figure E.7 Simplified API request and response sequence](../assets/figures/fig-3-predict-sequence.svg)

### 3. Development &ndash; Model Building

Four candidate models were benchmarked under the same five-fold cross-validation: logistic regression (ROC-AUC 0.7737), a random forest of 300 trees (ROC-AUC 0.7883), an untuned gradient boosting model (ROC-AUC 0.7859) and XGBoost (ROC-AUC 0.7893). Gradient boosting was selected for further tuning because it combined competitive ranking performance with an exact, additive per-prediction explanation. A randomized search over 40 parameter combinations, scored on ROC-AUC, selected 250 trees, a maximum depth of 3, a learning rate of 0.05, a subsample ratio of 0.8 and a minimum leaf size of 20, raising the cross-validated ROC-AUC to 0.7965. The tuned model's raw margins were then calibrated into estimated probabilities of default with Platt scaling fitted on out-of-fold predictions, so the output estimates default likelihood rather than only ranking applicants. Calibration is evaluated out of fold and does not guarantee performance on a new lending population.

Rather than deploying only the winning model, XGBoost and random forest were refit on the full dataset and exported alongside gradient boosting, so that every scored applicant is checked against three separately trained model families at once (`POST /api/predict-compare`). XGBoost reuses the same additive tree-walking function as gradient boosting, since both are log-odds boosting; the only real engineering wrinkle was that XGBoost's histogram splitter places thresholds exactly on real data values, so it needs a strict "less than" comparison where gradient boosting uses "less than or equal to", a genuine bug found and fixed during development. Random forest combines its 300 trees by averaging predicted leaf probabilities instead of additive boosting, so it runs its own scoring function, Platt-calibrated on the averaged probability rather than a margin. The deployed out-of-fold metrics are 0.7928 / 0.7869 / 0.7833 ROC-AUC for gradient boosting, XGBoost and random forest respectively, and all three models agreed on both the risk band and the lending decision for the three preset applicants tested. Agreement on those examples is a consistency check, not evidence that the models are independent or always agree.


<p class="table-caption">Table 1 Deployed model comparison (out-of-fold evaluation)</p>

| Model | Trees | ROC-AUC | Role in the interface |
| --- | --- | --- | --- |
| Gradient Boosting | 250 | 0.7928 | Primary risk slip, explanation and adjustable cutoff |
| XGBoost | 200 | 0.7869 | Comparison probability, risk band and decision |
| Random Forest | 300 | 0.7833 | Comparison probability, risk band and decision |

These deployed calibrated metrics differ from the earlier untuned benchmark and tuning-search scores because they describe different evaluation stages. The models are trained on the same dataset and share the same input features.

### 4. Testing

The updated report documents 62 passing test cases: 7 model-fidelity cases, 4 multi-model deployment cases, 25 API-validation cases, 3 model-quality cases, 18 interface cases and 5 endpoint/integration cases. The saved notebook, API and interface results support the recorded outcomes. The notebook tests included a parity check between the hand-written scoring function and the original scikit-learn model (maximum difference 3.33 &times; 10&#8315;&sup1;&#8310;), an additivity check confirming that the primary model's factor contributions sum to its predicted probability minus its starting probability, and a quality gate requiring an out-of-fold ROC-AUC of at least 0.75 and a KS statistic of at least 0.35, both comfortably met.

## F. Hardware and Software Used

<p class="table-caption">Table 2 Hardware and software used</p>

| Category | Details |
| --- | --- |
| Operating System | Windows |
| Programming Languages | TypeScript, Python |
| Front-End Framework | Next.js, React, Tailwind CSS |
| Back-End Runtime | Python standard library (dependency-free serverless function) |
| IDE / Platform | Visual Studio Code |
| Model Training Libraries | pandas, numpy, scikit-learn, XGBoost, matplotlib, Jupyter |
| Deployment Platform | Vercel (serverless functions) |
| Hardware | Standard personal computer; no specialised or GPU hardware required |

## G. Testing Technologies Used

- Stratified 5-fold cross-validation, applying identical folds to every candidate model so the benchmark is fair.
- An automated quality gate requiring an out-of-fold ROC-AUC of at least 0.75 and a KS statistic of at least 0.35 before a model is accepted.
- Parity and additivity checks confirming the hand-written scoring function reproduces the trained model and that its factor contributions sum exactly to the predicted probability.
- An API validation and robustness test suite covering missing fields, out-of-range values, unknown categories and the cross-field instalment rule.
- Manual testing of the web interface across the assessment workbench, the portfolio analytics page and the methodology page.

## H. What Contribution / Value Addition Would the Project Make

- It explains every score factor by factor, rather than returning only a yes-or-no decision, so a loan officer can see exactly why an applicant was scored the way they were.
- It lets a user see the cost trade-off of moving the approval cutoff, instead of fixing a single threshold that cannot be inspected or adjusted.
- It compares calibrated default-probability estimates across three model families, while retaining a visible explanation of the primary model's result.
- It exports three fitted model artifacts and a separate portfolio artifact, which the dependency-free Python functions read without loading the original training libraries.
- It demonstrates a deployment pattern that needs no heavy machine learning runtime at request time, keeping the production function well within a serverless platform's size limit.

## I. Limitations / Constraints of the Project

- The dataset is small and dated: 1,000 applicants from a single German bank in 1994, so the model's behaviour should not be assumed to generalise to current lending conditions.
- No formal fairness audit or proxy-discrimination analysis was carried out beyond excluding the personal-status-and-sex attribute directly.
- The portfolio explorer uses twelve precomputed cutoffs from 0.05 to 0.60 in steps of 0.05. The individual assessment slider moves in steps of 0.01 across the same range and adjusts the Gradient Boosting decision only.
- Loan and income amounts are stated in Deutsche Mark, the currency used in the original dataset, and are not converted to a current currency.
- The deployed function carries no machine learning runtime, so the model cannot be retrained or monitored for drift from the production environment itself.

## J. Conclusion, Future Scope for Modification

The Loan Default Risk Predictor meets the objectives it set out to achieve. The tuned gradient boosting model reached an out-of-fold ROC-AUC of 0.7928 and a KS statistic of 0.4776, ahead of the logistic-regression baseline, with a Brier score of 0.1601 against a flat-guess baseline of 0.2100, and top-decile applicants defaulted 10.9 times more often than bottom-decile applicants. The visible Gradient Boosting explanation is additive by construction. XGBoost also returns contributions through the comparison API; Random Forest returns its probability, risk band, score and decision without a contribution breakdown. The three-model interface makes agreement and disagreement visible alongside the primary model's explanation. The project demonstrates that a small, well-studied dataset can be turned into a calibrated, explainable and cheaply deployable credit-scoring tool.

Future scope for modification includes:

- A formal fairness audit, including a proxy-discrimination analysis of fields such as housing and employment history.
- Retraining on more recent lending data, together with reject inference to correct for the fact that a historical dataset only records outcomes for applicants who were approved.
- Richer explanations using full SHAP interaction values, to surface how pairs of factors jointly move a score.
- Monotonic constraints on the gradient boosting trees, so increasing income can never raise the predicted probability of default.
- Model monitoring in production, with drift detection on incoming feature distributions and on the gap between predicted and observed default rates.
- Batch scoring through a CSV upload, so a lender could score a whole book of applicants in one pass.

## K. References and Bibliography

1. Hofmann, H. Statlog (German Credit Data). UCI Machine Learning Repository, 1994. https://archive.ics.uci.edu/dataset/144/statlog+german+credit+data
1. Friedman, J. H. Greedy function approximation: a gradient boosting machine. *Annals of Statistics*, 29(5), 2001.
1. Platt, J. Probabilistic outputs for support vector machines and comparisons to regularized likelihood methods. *Advances in Large Margin Classifiers*, MIT Press, 1999.
1. Lundberg, S. M. and Lee, S.-I. A unified approach to interpreting model predictions. *Advances in Neural Information Processing Systems* (NeurIPS), 2017.
1. Saabas, A. Interpreting random forests. *treeinterpreter* blog post, 2014.
1. Pedregosa, F. et al. Scikit-learn: Machine Learning in Python. *Journal of Machine Learning Research*, 12, 2011.
1. Siddiqi, N. *Credit Risk Scorecards: Developing and Implementing Intelligent Credit Scoring*. Wiley, 2006.
1. Chen, T. and Guestrin, C. XGBoost: A Scalable Tree Boosting System. Proceedings of KDD, 2016.
1. Breiman, L. Random Forests. Machine Learning, 45, 2001.
1. Vercel Inc. Next.js Documentation. https://nextjs.org/docs

</section>

<section class="synopsis-body page-start">

## CURRENT APPLICATION SCREENS

These are the fresh high-resolution captures used in the updated report, taken from the live deployed application. Each figure shows a focused section at a readable print size; no legacy screenshots are used.

<div class="synopsis-screen">

![Figure S.1 Applicant details and preset controls](../assets/screens/fresh/01-applicant-input.png)

</div>

<div class="synopsis-screen">

![Figure S.2 Required-field validation before submission](../assets/screens/fresh/03-validation.png)

</div>

<div class="synopsis-screen">

![Figure S.3 Gradient Boosting result for the Stretched file preset](../assets/screens/fresh/05-high-risk-verdict.png)

</div>

<div class="synopsis-screen">

![Figure S.4 The same applicant compared across all three deployed models](../assets/screens/fresh/10-model-comparison.png)

</div>

<div class="synopsis-screen">

![Figure S.5 Portfolio risk-band distribution for all 1,000 applicants](../assets/screens/fresh/08-portfolio-bands.png)

</div>

</section>

<section class="synopsis-body page-start">

## CURRENT FRONTEND CODE

The actual form submission handler validates the fields and calls `predictCompare`, which sends the request to `/api/predict-compare`. It then displays the three-model response or a field-level error.

```tsx
async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate(form);
    if (Object.keys(found).length) {
      setErrors(found);
      document.getElementById(Object.keys(found)[0])?.focus();
      return;
    }
    setLoading(true);
    onStart();
    try {
      onResult(await predictCompare(toPayload(form)));
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Something went wrong while scoring.";
      const field = err instanceof ApiRequestError && err.field in form ? (err.field as keyof PredictRequest) : "form";
      setErrors({ [field]: message });
      if (field !== "form") document.getElementById(field)?.focus();
      onError(message);
    } finally {
      setLoading(false);
    }
  }
```

## CURRENT BACKEND CODE

The current comparison function validates and encodes once, then applies the appropriate scorer to each exported model. Random Forest averages leaf probabilities; the boosting models accumulate tree margins.

```python
def predict_compare(payload: dict[str, Any]) -> dict[str, Any]:
    gb_model = load_model(GB_PATH)
    # All three models share the identical 12 input fields and 37-column
    # vector, so validation only needs to run once, against GB's
    # categories/bounds.
    cleaned = validate_and_extract(payload, gb_model)
    vector = build_vector(cleaned, gb_model)

    xgb_model = load_model(XGB_PATH)
    rf_model = load_model(RF_PATH)

    return {
        "gradient_boosting": _additive_result(vector, gb_model, cleaned),
        "xgboost": _additive_result(vector, xgb_model, cleaned),
        "random_forest": _forest_result(vector, rf_model),
        "cutoff": gb_model["cutoff"],
    }
```

</section>
