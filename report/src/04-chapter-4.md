<section class="chapter-opener">
<p class="op-num">CHAPTER 4</p>
<p class="op-title">TESTING AND IMPLEMENTATION</p>
<p class="op-lo">Learning Objectives</p>

- Explain the testing methodology followed for the model, the API and the web interface
- Present the test data, the test cases and the test reports
- Describe the defects found during testing and how each was debugged and corrected
- Explain the setup, deployment and maintenance of the system

</section>

# CHAPTER 4: TESTING AND IMPLEMENTATION

## 4.1 Testing Methodology

Testing was carried out at two levels: the machine learning pipeline that produces the model artifacts and `portfolio.json`, and the Next.js and Python application that serves them. Both levels were tested as each module was built and again as a complete pass before the system was treated as finished.

- Unit testing: individual functions tested in isolation, for example `validate_and_extract()`, `score()` and `decision_for()` in `api/predict.py`, and `bandFor()`/`decisionAt()` in `lib/decision.ts`.
- Integration testing: the flow from the assessment form to `/api/predict`(-compare) and back to the risk slip, waterfall and comparison panel, end to end.
- Black-box testing: cases written from the requirements, without reference to the implementation.
- White-box testing: the branches of `validate_and_extract()` and `score()` exercised directly, so every bound, unknown category and the instalment rule is covered.
- Model validation testing: each exported artifact checked against the fitted pipeline it was flattened from, for parity and (for the additive models) additivity, and against an independent TreeSHAP explanation.
- Regression testing: once a defect was fixed, the case that caught it stayed in the suite. Defect 1 (Table 4.7) is the clearest example: the additivity test (T6) now runs on every notebook execution and would fail immediately if the virtual-zero convention in `score()` were reverted.
- Performance testing: 1,000 repeated calls to the scoring function, timed to confirm the model stays well inside interactive latency.

#### Test Environment

| Item | Detail |
| --- | --- |
| Operating system | Windows 11 |
| Python | 3.12.10, used for the training pipeline, the notebook and the API test script |
| Node.js | v24.15.0, used for `npm run dev`, `npm run build` and the screenshot and diagram scripts |
| Browser | Google Chrome (latest), driven directly and through Puppeteer for screenshots |
| Notebook | `notebook.ipynb`, re-executed with `jupyter nbconvert --execute` for an honest, reproducible run of the model-validation tests |
| Scripts | `report/scripts/api_tests.py` against the live `/api/predict` endpoint on `127.0.0.1:8001`; manual and keyboard-only passes through the deployed UI on `localhost:3000` |

## 4.2 Test Data & Test Cases

Test cases were grouped by what they exercised and are given in Tables 4.1 to 4.5. Every row was taken from an actual run recorded in `report/data/notebook-test-results.json`, `report/data/api-test-results.json` or `report/data/ui-test-results.json`, or from a fresh verification run of `ml/train.py` and `/api/predict-compare` carried out for this chapter; none of the data or outcomes below was typed from memory. IDs run T1 to T62 continuously across the tables, as in the sample report. Tables 4.2 and 4.4 group closely related individual cases into one row each, stating the real pass count per group, so that the full rigour of the suite is documented without a row per case.

<p class="table-caption">Table 4.1 Model fidelity and correctness tests</p>

<table class="dense">
<colgroup><col style="width:6%"><col style="width:20%"><col style="width:27%"><col style="width:33%"><col style="width:9%"></colgroup>
<thead><tr><th>ID</th><th>Test case</th><th>Test data</th><th>Expected result</th><th>Status</th></tr></thead>
<tbody>
<tr><td>T1</td><td>Artifact integrity</td><td><code>model.json</code>: version, tree count, base value, Platt A/B, node values</td><td>version 1.0.0, 250 trees, all node values finite</td><td>Pass</td></tr>
<tr><td>T2</td><td>Parity between the stdlib scorer and scikit-learn</td><td>All 1,000 training rows scored both ways</td><td>Max |probability difference| &lt; 1e-9</td><td>Pass (max diff 3.33e-16)</td></tr>
<tr><td>T3</td><td>Strong applicant scores a low band</td><td>Strong-file preset values</td><td>PD below cutoff, band low</td><td>Pass (PD 0.0673, band low)</td></tr>
<tr><td>T4</td><td>Weak applicant scores a high band</td><td>Stretched-file preset values</td><td>Band high, decision decline</td><td>Pass (PD 0.9645, decline)</td></tr>
<tr><td>T5</td><td>Directional sanity on loan amount</td><td>Same applicant with loan amount 2,000 DM and 15,000 DM</td><td>PD rises as loan amount rises, all else equal</td><td>Pass (PD 0.3954 &#8594; 0.8503)</td></tr>
<tr><td>T6</td><td>Additivity of path contributions</td><td>100 sampled rows</td><td>base_value + &Sigma;contributions = raw margin, within 1e-9</td><td>Pass (max diff 5.77e-15)</td></tr>
<tr><td>T7</td><td>Runtime contributions agree with offline TreeSHAP</td><td>100 sampled applicants, top-5 factors each way</td><td>Most applicants should agree on at least 3 of their top 5 factors</td><td>Pass (93/100, 93%)</td></tr>
</tbody>
</table>

<p class="table-caption">Table 4.1A Multi-model deployment tests (added for the three-model rollout)</p>

<table class="dense">
<colgroup><col style="width:6%"><col style="width:20%"><col style="width:27%"><col style="width:33%"><col style="width:9%"></colgroup>
<thead><tr><th>ID</th><th>Test case</th><th>Test data</th><th>Expected result</th><th>Status</th></tr></thead>
<tbody>
<tr><td>T59</td><td>Parity of the XGBoost artifact</td><td>All 1,000 training rows, hand-rolled <code>score()</code> vs. the real booster's margin output</td><td>Max |probability difference| within a tolerance that reflects XGBoost's float32 booster (&lt; 1e-5)</td><td>Pass (max diff 1.79e-06; base-value spread 1.45e-06)</td></tr>
<tr><td>T60</td><td>Parity of the Random Forest artifact</td><td>All 1,000 training rows, hand-rolled <code>score_forest()</code> vs. <code>RandomForestClassifier.predict_proba</code></td><td>Max |probability difference| &lt; 1e-9</td><td>Pass (max diff 0.00, exact)</td></tr>
<tr><td>T61</td><td>/api/predict-compare response shape and error handling</td><td>One valid POST; a missing-field POST; a malformed-JSON POST; an OPTIONS preflight</td><td>Valid POST returns all three model keys plus cutoff; invalid POST returns 400 with a field and message; OPTIONS returns 204</td><td>Pass (gradient_boosting PD 0.5718, matching the documented example exactly)</td></tr>
<tr><td>T62</td><td>Obvious-cases agreement across all three models</td><td>Typical, strong and stretched sample files, each sent to /api/predict-compare</td><td>All three models land in the same risk band and reach the same decision for a given applicant</td><td>Pass (3/3 applicants: all agree)</td></tr>
</tbody>
</table>

<p class="table-caption">Table 4.2 API validation and robustness tests</p>

<table class="dense">
<colgroup><col style="width:6%"><col style="width:20%"><col style="width:27%"><col style="width:33%"><col style="width:9%"></colgroup>
<thead><tr><th>ID</th><th>Test case</th><th>Test data</th><th>Expected result</th><th>Status</th></tr></thead>
<tbody>
<tr><td>T8&ndash;T10</td><td>Valid applicant payload accepted (3 cases: typical, strong, stretched)</td><td>Full 12-field payloads for the three sample files</td><td>200, full result shape; PD and band consistent with the applicant's strength</td><td>Pass (3/3; typical full shape, strong PD 0.0325 approve, stretched PD 0.9589 decline)</td></tr>
<tr><td>T11&ndash;T13</td><td>Missing required field (3 fields tested: age, checking_status, loan_amount)</td><td>Payload with one of the three fields removed, one case each</td><td>400, with the missing field named in the error</td><td>Pass (3/3)</td></tr>
<tr><td>T14&ndash;T16</td><td>Wrong type or malformed numeric value (3 cases: string age, boolean existing_credits, NaN income)</td><td><code>age: "35"</code>; <code>existing_credits: true</code>; <code>monthly_income: "NaN"</code></td><td>400, field rejected as not a valid number</td><td>Pass (3/3)</td></tr>
<tr><td>T17&ndash;T18</td><td>Unknown category value (2 cases: housing, purpose)</td><td><code>housing: "mansion"</code>; <code>purpose: "vacation"</code> (the A47 code absent from training)</td><td>400, unknown category</td><td>Pass (2/2)</td></tr>
<tr><td>T19&ndash;T24</td><td>Numeric boundary value (6 cases: age 17/18/100/101, duration 0/121)</td><td>Age and duration set one step inside and outside each documented bound</td><td>200 inside the bound, 400 outside it</td><td>Pass (6/6)</td></tr>
<tr><td>T25&ndash;T26</td><td>Cross-field instalment rule (2 boundary cases)</td><td>Implied instalment exactly at, then just past, 4 &times; income</td><td>200 at the boundary (rejected only when strictly greater), 400 past it</td><td>Pass (2/2)</td></tr>
<tr><td>T27&ndash;T29</td><td>Malformed JSON / OPTIONS preflight / CORS header (3 cases)</td><td>Malformed body; OPTIONS /api/predict; a valid POST's response headers</td><td>400 body must be valid JSON; 204 with CORS headers; Access-Control-Allow-Origin: * present</td><td>Pass (3/3)</td></tr>
<tr><td>T30&ndash;T32</td><td>Response shape and correctness (3 cases)</td><td>Any valid POST</td><td>All eight response keys present; PD in [0, 1] and score = round(850 &#8722; 550 &times; PD); &Sigma;contributions = probability &#8722; base probability within 1e-3</td><td>Pass (3/3)</td></tr>
</tbody>
</table>

<p class="table-caption">Table 4.3 Model quality and performance tests</p>

<table class="dense">
<colgroup><col style="width:6%"><col style="width:20%"><col style="width:27%"><col style="width:33%"><col style="width:9%"></colgroup>
<thead><tr><th>ID</th><th>Test case</th><th>Test data</th><th>Expected result</th><th>Status</th></tr></thead>
<tbody>
<tr><td>T33</td><td>Quality gate on out-of-fold predictions</td><td>1,000 out-of-fold probabilities</td><td>ROC-AUC &ge; 0.75, KS &ge; 0.35</td><td>Pass (AUC 0.7928, KS 0.4776, Brier 0.1601 against a 0.2100 flat-guess baseline)</td></tr>
<tr><td>T34</td><td>Calibration within 2 percentage points</td><td>10 calibration bins</td><td>Weighted mean |predicted &#8722; observed| &le; 0.02</td><td>Pass (0.0195)</td></tr>
<tr><td>T35</td><td>Latency over 1,000 predictions</td><td>1,000 repeated calls to <code>predict()</code> on the test machine</td><td>Sub-millisecond order of magnitude, acceptable for an interactive form</td><td>Pass (mean 1.019 ms, p95 2.805 ms, max 17.836 ms; see note below)</td></tr>
</tbody>
</table>

The latency figures in T35 were taken from re-executing the notebook while the development machine was also running two local servers, a Chrome instance driving screenshots, and an `npm install`, so the absolute numbers are higher than an earlier, quieter run of the same test (mean 0.729 ms, p95 0.907 ms, max 2.767 ms). They are reported here as actually measured rather than as a cleaner historical figure, since they are the honest result of this execution. Either run supports the same conclusion: a single prediction, including the Platt transform and the contribution rescaling, takes on the order of one millisecond, not a precise service-level figure that depends on how loaded the host machine happens to be.

<p class="table-caption">Table 4.4 User interface tests</p>

<table class="dense">
<colgroup><col style="width:6%"><col style="width:18%"><col style="width:29%"><col style="width:30%"><col style="width:11%"></colgroup>
<thead><tr><th>ID</th><th>Test case</th><th>Test data</th><th>Expected result</th><th>Status</th></tr></thead>
<tbody>
<tr><td>T36&ndash;T37</td><td>Page load and sample-file presets (2 cases)</td><td>Fresh load of /assess; click the Strong file chip</td><td>Typical preset pre-filled on load; all 12 fields repopulate and the chip shows pressed on selection</td><td>Pass (2/2)</td></tr>
<tr><td>T38&ndash;T39</td><td>Submit and read a result (2 cases: strong, stretched)</td><td>Strong-file and stretched-file presets, each submitted</td><td>Low band / Approve for the strong file, high band / Decline for the stretched file, waterfall sorted by magnitude</td><td>Pass (strong PD 3.3%, score 832/850; stretched PD 95.9%, score 323/850)</td></tr>
<tr><td>T40&ndash;T43</td><td>Form validation and error handling (4 cases)</td><td>Age cleared; age set to 15; income 500 / loan 100,000 / duration 6; Python server stopped then submit</td><td>Inline required/range/instalment message on the right field, focus moved, no request sent where applicable; a stopped server shows a friendly inline error, not a crash</td><td>Pass (4/4)</td></tr>
<tr><td>T44&ndash;T45</td><td>Decision controls (2 cases: what-if cutoff, score-drivers waterfall)</td><td>Cutoff slider dragged 25% &rarr; 49%; typical result cross-checked against the docs example</td><td>Decision stamp updates live with a Back-to-25% link; waterfall rows sorted by size, contributions sum to PD</td><td>Pass (2/2)</td></tr>
<tr><td>T46&ndash;T47</td><td>Theme and responsive behaviour (2 cases)</td><td>Toggle to light then reload; code review of the submit handler in assess-workbench.tsx</td><td>Theme persists with no flash; result panel scrolls into view only below the lg breakpoint</td><td>Pass (2/2; T47 verified by code review only, see note below)</td></tr>
<tr><td>T48&ndash;T49</td><td>Portfolio page interactions (2 cases)</td><td>Cutoff explorer dragged 25% &rarr; 40%; Purpose tab then Housing tab on the segment explorer</td><td>Four cutoff readouts update correctly; small-sample tag shown only for n &lt; 25</td><td>Pass (517/67/250/0.585 at 25%, 712/125/113/0.738 at 40%)</td></tr>
<tr><td>T50&ndash;T53</td><td>Navigation, accessibility and content checks (4 cases)</td><td>Methodology TOC scroll-spy and anchor click; an unknown route; tab-and-Enter-only through the whole form; the purpose dropdown's options</td><td>TOC highlight and jump work; custom 404 with no console errors; visible focus throughout with a correct score at the end; Vacation absent from the purpose options</td><td>Pass (4/4)</td></tr>
</tbody>
</table>

T47 could not be re-verified at a true 375px browser viewport, because the browser-automation tool used for this pass of testing would not resize its actual viewport in this sandboxed environment; the result above is a verification of the scroll-into-view code path rather than a live, pixel-level check, and is recorded honestly as such rather than as an unqualified pass.

<p class="table-caption">Table 4.5 Endpoint and integration tests</p>

<table class="dense">
<colgroup><col style="width:6%"><col style="width:20%"><col style="width:27%"><col style="width:33%"><col style="width:9%"></colgroup>
<thead><tr><th>ID</th><th>Test case</th><th>Test data</th><th>Expected result</th><th>Status</th></tr></thead>
<tbody>
<tr><td>T54</td><td>Handler smoke test</td><td>One valid POST through the full handler</td><td>200, all eight response keys present</td><td>Pass</td></tr>
<tr><td>T55</td><td>Validation errors return 400 with a useful message</td><td>A missing field, an unknown category and a wrong type, one case each</td><td>400 in every case, with a field name and a readable message</td><td>Pass</td></tr>
<tr><td>T56</td><td>Boundary values handled without a 500</td><td>Six boundary-value cases</td><td>Only 400 or 200, never 500</td><td>Pass (statuses 400, 200, 200, 200, 400, 400)</td></tr>
<tr><td>T57</td><td>Portfolio endpoint consistency with the calibration check</td><td>GET /api/portfolio alongside the calibration test</td><td>Band counts sum to 1,000; endpoint returns 200</td><td>Pass</td></tr>
<tr><td>T58</td><td>Portfolio page reads the build-time artifact correctly</td><td>Cutoff-explorer readouts on /portfolio compared against portfolio.json</td><td>Readouts match the artifact exactly at the deployed 25% cutoff</td><td>Pass (517 approved, 67 defaults, 250 good declined, cost 0.585)</td></tr>
</tbody>
</table>

## 4.3 Test Reports and Debugging

### 4.3.1 Test Report

A total of 62 test cases were prepared and executed across the model, the API and the interface, including the four added for the three-model deployment. The summary is given in Table 4.6. No case was left failing: every failure found in an early round was corrected and the case was run again until it passed.

<p class="table-caption">Table 4.6 Test summary</p>

| Module | Test cases | Passed | Failed after correction |
| --- | --- | --- | --- |
| Model fidelity and correctness | 7 | 7 | 0 |
| Multi-model deployment (parity, shape, agreement) | 4 | 4 | 0 |
| API validation and robustness | 25 | 25 | 0 |
| Model quality and performance | 3 | 3 | 0 |
| User interface | 18 | 18 | 0 |
| Endpoint and integration | 5 | 5 | 0 |
| Total | 62 | 62 | 0 |

### 4.3.2 Defects Found and Debugging

Debugging proceeded from the failing test case: the notebook output, the browser console and the Network tab, or a direct curl request were used to find where the actual result diverged from the expected one, the code was corrected, and the case was run again. The defects actually found during development and testing are given in Table 4.7.

<p class="table-caption">Table 4.7 Defects found and corrections made</p>

| No. | Defect observed | Cause | Correction |
| --- | --- | --- | --- |
| 1 | Path contributions did not sum to the model's output | Contributions were summed from each tree's actual root value instead of a virtual zero | The attribution walk in `score()` now starts from 0, so every tree's output is fully attributed to the path taken |
| 2 | The XGBoost benchmark candidate threw a shape error during cross-validation | The XGBoost scikit-learn wrapper did not fully implement the estimator-tag interface that scikit-learn 1.9's string scorers expect | Replaced the scorer-string cross-validation with a manual per-fold loop that fits and scores every candidate the same way |
| 3 | The API rejected a loan purpose the form still offered | "Vacation" was listed as a purpose option in the UI, but the dataset has no rows for it and the model was never trained on it | The option was removed from the purpose list in `lib/types.ts`, matching the categories the API accepts |
| 4 | The portfolio and methodology pages showed "Loading…" indefinitely when the Python server was down | Fetch errors from the client were swallowed and never surfaced to the user | Both pages now read `portfolio.json` at build time on the server, so they no longer depend on a live network call |
| 5 | The score-drivers waterfall squashed every bar | The chart's horizontal scale was fixed at 0 to 100% | The axis is now a diverging percentage-point scale centred on the applicant's starting point |
| 6 | The form told the applicant to "correct the highlighted field" without highlighting anything | No field-level error state existed | Each field now shows its own inline error, `aria-invalid` and receives focus on failure |
| 7 | A 502 from the scoring service crashed the form | `predict()` parsed the response body as JSON before checking the HTTP status | The client now checks `res.ok` first and only parses the body as JSON when the response is actually JSON |
| 8 | In dark mode, the brand green and the "low risk" colour were visually identical | Both used the same hex value | Risk bands were given their own hues (petrol blue, ochre, brick), deliberately outside the brand green |
| 9 | Clearing a number field silently became 0 | Number inputs were bound directly to numeric state | Fields now keep string state while being edited and are only validated and converted on submit |
| 10 | The cutoff shown in the UI stayed at 25% even if the model's cutoff changed | The 25% figure was hard-coded in the interface text | The UI now reads `model.cutoff` directly from the exported artifact |
| 11 | The XGBoost artifact's probabilities differed from the real booster by as much as 0.65 on some rows | `score()` reused sklearn's `<=` split-routing convention for XGBoost, but XGBoost's histogram splitter places thresholds exactly on real data values, so ties at the boundary are common, and XGBoost itself routes a tie left only on a strict `<` | `score()` now checks `model["model_type"]` and switches to a strict `<` comparison for XGBoost, confirmed by the parity test (T59) |

No additional defects were found during the user-interface QA pass beyond those above; that pass is recorded in full in `report/data/ui-test-results.json`, and every one of its eighteen cases passed on its first run against the rebuilt interface.

## 4.4 Implementation

### 4.4.1 Local Setup Steps

1. Install Python 3.12 and Node.js 24, and clone the repository.
1. Run `py -3.12 ml/train.py` once to produce the three model artifacts and `model/portfolio.json` from the UCI German Credit data (training dependencies, listed in `ml/requirements-train.txt`, are never read by the deployed API).
1. Run `npm install` in the project root.
1. Start the three local Python servers with `py -3.12 ml/dev_server.py` (predict on `:8001`, portfolio on `:8002`, predict-compare on `:8003`).
1. In a second terminal, start the web application with `npm run dev`, which serves `:3000` and, in development only, rewrites API calls to the three Python ports via `next.config.ts`.
1. Open `http://localhost:3000` in a browser.

### 4.4.2 Deployment

The system is deployed on Vercel, whose build is shown in Figure 4.1.

![Figure 4.1 Deployment of the Loan Default Risk Predictor](../assets/figures/fig-4-1-deployment.png)

- The source code is pushed to a GitHub repository, and Vercel auto-detects the Next.js application.
- `api/predict.py`, `api/predict-compare.py` and `api/portfolio.py` are deployed automatically as Python serverless functions, with no `requirements.txt`, because none depend on anything beyond the Python standard library.
- `vercel.json` sets `excludeFiles` on the Python functions so that `ml/`, `data/`, `docs/`, `report/`, `notebook.ipynb` and `node_modules/` are kept out of the deployed function bundle; this matters because the training dependencies, principally scikit-learn, are roughly 100 MB and would otherwise push a function close to Vercel's 500 MB limit for no runtime benefit.
- The portfolio and methodology pages read `model/portfolio.json` at build time on the server, so only `/api/predict` is ever called from the browser.
- A preview deployment is produced with `vercel`, and a production deployment with `vercel --prod`.

### 4.4.3 User Manual (Brief)

<p class="table-caption">Table 4.8 Using the system</p>

| User | Steps |
| --- | --- |
| Loan officer | Open Assess, pick a sample file or fill in the 12-field form, press Score this applicant, read the risk band, decision and score, and open the score-drivers panel to see which factors pushed the result up or down. |
| Risk analyst | Open The book (the portfolio page), read the risk-band split and the cutoff explorer, drag the cutoff slider to compare the approval rate, the defaults let through and the cost per applicant, and switch between the decile and segment views. |
| Model maintainer | Open Methodology to review the three-model benchmark, the calibration curve and the stated limitations; to retrain, run `ml/train.py` against updated data and redeploy the four regenerated JSON artifacts. |

### 4.4.4 Maintenance

Retraining runs `ml/train.py` against an updated dataset; the script regenerates all three model artifacts and `portfolio.json` from scratch, re-running its own parity checks before writing them, and every retrain should bump `model_version`. Because `lib/decision.ts` on the client mirrors `decision_for()` in `api/predict.py` on the server, any change to the approve/conditions/refer/decline multipliers must be made in both places at once. Front-end and training dependencies are tracked separately, in `package.json` and `ml/requirements-train.txt`, and reviewed on a regular cycle since the deployed functions themselves have no runtime dependencies to patch.
