<section class="chapter-opener">
<p class="op-num">CHAPTER 1</p>
<p class="op-title">PROBLEM FORMULATION</p>
<p class="op-lo">Learning Objectives</p>

- Understand the training background and the company behind the internship
- Identify the problem lenders face in assessing credit risk
- Study the present state of the art and the need for computerisation
- Define the objectives, scope and importance of the Loan Default Risk Predictor

</section>

# CHAPTER 1: PROBLEM FORMULATION

## 1.1 Introduction about the Company

GRAStech is an organisation that runs online internship programs in technology fields. The program undertaken by the trainee was the six-week online internship program in Machine Learning Using Python. The program is headed by Mohammad Qayam Ali, Founder and Program Head.

The compulsory six-week summer training was completed as an online internship in Machine Learning Using Python at GRAStech, and the company issued a Certificate of Completion dated 31 July 2026, signed by Mohammad Qayam Ali. A copy of this certificate is placed after the Institute's Certificate at the beginning of this report. The training was carried out under the guidance of the college mentor, Ms. Nisha Choudhary, Assistant Professor. During the internship the trainee learned the complete life cycle of a machine learning application: data understanding, data preparation, modelling, evaluation and deployment, along with the testing that every stage requires. The project titled Loan Default Risk Predictor was designed and developed individually by the trainee as the training project.

## 1.2 Introduction about the Problem

A lender that approves an unsecured loan is taking on a risk that is settled only months or years later, when the applicant has either repaid the loan or defaulted on it. The decision to approve, decline or ask for conditions has to be made at the time of application, from the information the applicant has provided and the lender's own records, and it has to be consistent across every officer who makes it. Where that decision is left entirely to individual judgement, two applicants with a similar credit history can receive different outcomes depending on who reviewed the file, and the reasoning behind a decline is rarely written down in a form the applicant can be shown.

A default is costly to the lender in a way that a cautious decline is not. Every unit of loan that is extended to an applicant who later defaults has to be weighed against the much smaller cost of asking a genuinely creditworthy applicant to wait or to provide additional conditions, so the two kinds of mistakes are not equally expensive and a sound decision rule has to account for that difference rather than treat every error alike. Statistical scorecards have been used for decades to make this judgement more consistent, but a scorecard built on a simple weighted sum of the applicant's attributes does not capture the way several factors interact, for instance how a short employment history matters far more when it is combined with a long loan duration than on its own. Machine learning models that are flexible enough to capture such interactions exist, but most are used as a black box: the model returns a number, and neither the applicant nor the loan officer can see which factors pushed the score up or down, which makes the decision difficult to explain, to audit or to contest.

The problem can therefore be summarised in one statement: there is no simple, free and explainable tool that turns an applicant's details into a calibrated probability of default, a lending recommendation and a factor-by-factor reason for that recommendation, in a way a loan officer can defend and an applicant can understand.

## 1.3 Present State of the Art

Credit risk assessment today is carried out through a mix of approaches. Purely manual, expert-judgement underwriting relies on an officer's experience and a checklist of documents, and remains common for small lenders, but it does not scale and is hard to make consistent. Traditional logistic-regression scorecards, of the kind described by Siddiqi, assign points to binned attributes and sum them into a score; they are easy to explain because each bin contributes a fixed number of points, but they are built around a linear combination of the inputs and need manual binning to approximate non-linear effects. Credit bureau scores aggregate a borrower's history across institutions and are useful where that history exists, but they are an external, general-purpose number rather than something a lender can tune to its own cost of a bad loan. Black-box machine learning models, typically gradient boosting or random forest ensembles, are now used by many larger lenders because they handle non-linear and interaction effects well, but deployed without a calibration step or an explanation layer, their raw output is an uninterpreted score rather than a probability, and individual decisions cannot easily be justified.

A comparison of these approaches with the proposed system is given in Table 1.1.

<p class="table-caption">Table 1.1 Comparison of existing approaches and the proposed system</p>

| Capability | Manual underwriting | Traditional scorecard | Black-box ML | Proposed system |
| --- | --- | --- | --- | --- |
| Probability output | No | Yes | Yes | Yes |
| Calibrated | No | Partial | Rarely | Yes |
| Explanation per applicant | Varies by officer | Yes | No | Yes |
| Handles non-linear effects | No | No | Yes | Yes |
| Cost-aware cutoff | No | Partial | Rarely | Yes |
| Deployment without a heavy runtime | Yes | Yes | No | Yes |
| Free and open | Varies | Varies | Varies | Yes |

The table shows that no single existing approach combines a calibrated probability, a per-applicant explanation, non-linear modelling and a cost-aware cutoff, all deployed without a heavy runtime and at no licensing cost. The Loan Default Risk Predictor is designed to occupy that space.

## 1.4 Need of Computerization

A computerised, explainable system is needed because the present mix of manual and black-box approaches suffers from the following drawbacks:

- Manual decisions are inconsistent, since two officers can read the same application differently.
- A plain score, whether from a scorecard or a black-box model, gives no reason the applicant or the officer can inspect.
- Black-box models are rarely checked for calibration, so a quoted probability of default may not match the true default rate at that score.
- The cost of a missed default and the cost of a wrongly declined applicant are different, and few manual or black-box processes make that trade-off explicit or adjustable.
- There is no easy way for an officer to ask "what would change if the cutoff moved", since re-running a scorecard or a black-box model by hand for every cutoff is impractical.
- Portfolio-level questions, such as how the bad rate is split across risk bands or whether the model ranks applicants well, are difficult to answer without a system that logs and aggregates every scored application.

A computerised and explainable system removes these drawbacks. It applies the same calibrated model to every applicant, produces a probability and a factor-by-factor reason for it in a fraction of a second, lets the cutoff be moved and its consequences inspected instantly, and aggregates every historical prediction into the portfolio-level view a risk analyst needs.

## 1.5 Proposed Software / Project

The Loan Default Risk Predictor is a web application that scores a loan applicant's probability of default with a calibrated gradient boosting model and explains the score factor by factor. It is a three-tier application consisting of a Next.js and React front end, a dependency-free Python scoring function deployed as a Vercel serverless function, and two JSON artifacts produced by an offline training pipeline. The live application is available at https://credoscore-gk.vercel.app.

### 1.5.1 Objectives of the Project

1. To collect the twelve applicant, loan and credit-position fields needed to score a loan application, with client-side and server-side validation.
2. To train and benchmark a gradient boosting model against logistic regression, random forest and XGBoost, and to calibrate its output into a genuine probability of default.
3. To return, for every scored applicant, a probability of default, a risk band, a credit-style score and a lending recommendation.
4. To explain every prediction with a factor-by-factor contribution that sums exactly to the predicted probability.
5. To let a user move the approval cutoff and see the resulting approval rate, bad rate among approved applicants and expected cost change in real time.
6. To provide portfolio-level analytics, namely the split of applicants by risk band, the cutoff trade-off, the decile-wise lift and the default rate by segment.
7. To deploy the system on a free hosting platform so that it can be accessed publicly through a web link, without requiring a heavy machine learning runtime at request time.

### 1.5.2 Scope of the Project

The scope of the project covers the following:

- Capturing the twelve fields used by the model and validating them on both the browser and the server.
- Loading one of several sample applicant files to fill the form quickly.
- Scoring an applicant and showing the probability of default, the risk band, the score and the recommendation.
- Explaining the score with a waterfall of individual factor contributions.
- A what-if control that recomputes the band, the score and the decision as the cutoff is moved.
- Portfolio analytics: band split, cutoff trade-off, deciles and segments.
- A methodology page describing the model, its benchmark against other candidate models, its calibration and its known limitations.
- A JSON REST API exposing the same scoring and portfolio functionality independently of the web interface.

The following are outside the present scope: using the tool for real lending decisions, a formal fairness audit of the model against protected characteristics, user accounts, storing submitted applications, and retraining the model from within the user interface. These are listed as future enhancements in Chapter 5.

## 1.6 Importance of the Work

The work is important on three counts. It tackles a problem that sits at the centre of consumer lending, namely turning an applicant's details into a decision that is both accurate and explainable, so the requirements were grounded in a real, well-studied dataset rather than an invented scenario. The project is also original and was built from the training data upward: the benchmarking, the tuning, the calibration and the explanation method were all carried out by the trainee rather than taken from an existing library untouched, giving the result genuine value as a teaching example of an explainable scoring system. It also provided practical exposure to the full life cycle of an applied machine learning product, covering feature engineering, model benchmarking and tuning, probability calibration, explanation, a dependency-free production API, a front end, testing and cloud deployment.

The project also demonstrates professional practices expected of a developer working on a credit model. The personal-status-and-sex attribute in the source data was excluded as a protected characteristic before any modelling began. The model's output was calibrated and evaluated honestly on out-of-fold predictions rather than on the data it was trained on. No applicant data is retained by the deployed API, which is stateless and keeps no secrets, and the report states plainly, in every place the tool is shown, that it is not meant for real lending decisions.

