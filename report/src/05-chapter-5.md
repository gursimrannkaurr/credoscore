<section class="chapter-opener">
<p class="op-num">CHAPTER 5</p>
<p class="op-title">CONCLUSION AND REFERENCES</p>
<p class="op-lo">Learning Objectives</p>

- Summarise the work done and conclude
- State the limitations of the system
- Suggest future scope for modification
- List references and bibliography

</section>

# CHAPTER 5: CONCLUSION AND REFERENCES

## 5.1 Summary of the Work Done

During the six-week summer training the trainee studied the problem of estimating a loan applicant's probability of default, prepared a requirement document, and built the Loan Default Risk Predictor on the UCI Statlog German Credit dataset. The work covered the full life cycle of a small machine learning application: cleaning and feature-engineering the 1,000-row dataset into twelve usable fields, benchmarking four candidate models under identical five-fold cross-validation, tuning a gradient boosting model with a randomized search over 40 parameter combinations, calibrating its output with Platt scaling fitted on out-of-fold margins, and exporting the fitted ensemble as a dependency-free JSON artifact that a stand-alone Python function could score without scikit-learn. On top of that artifact the trainee built a dependency-free scoring API with full input validation, a client explanation mechanism based on per-tree path contributions, and a Next.js front end covering an assessment workbench, a portfolio analytics page and a methodology page, styled as an editorial fintech site in the project's green. The work closed with 58 test cases across the model, the API and the interface, correction of the ten defects described in Table 4.7, and deployment of the application to Vercel.

## 5.2 Conclusion

The Loan Default Risk Predictor meets the objectives set out in Chapter 1. It takes the twelve fields a lender would reasonably be able to ask an applicant for and returns a calibrated probability of default, a risk band, a 300-to-850 score and a cutoff-based recommendation, each one accompanied by a per-factor explanation that sums exactly to the predicted probability rather than only approximating it. The tuned gradient boosting model reached an out-of-fold ROC-AUC of 0.7928 and a KS statistic of 0.4776, ahead of the plain logistic-regression baseline at 0.7737 and in line with the untuned random forest and XGBoost candidates evaluated under the same folds. Its Brier score of 0.1601, against a flat-guess baseline of 0.2100, and a weighted calibration gap of 0.0195 across ten probability bins, both say the same thing in different ways: the number the model returns can be read as an actual probability, not merely used to rank applicants. The top-decile applicants defaulted 10.9 times more often than the bottom-decile applicants, which is the separation a lender would need before a cutoff is worth setting at all. None of this came at the cost of transparency: every prediction's path contributions are exactly additive by construction, and they agreed with an independent, offline TreeSHAP ranking on at least three of five top factors for 93 of 100 sampled applicants.

The project also gave the trainee practical experience that a course alone would not. Training a model honestly, with a manual per-fold cross-validation loop written because a library scorer could not be trusted across every candidate, is a different exercise from reporting a single train-test split. Exporting that model into a hand-written tree walk that reproduces scikit-learn's output to within 3.33 &times; 10&#8315;&sup1;&#8310; taught more about how a gradient boosting ensemble actually scores a row than fitting the model once and calling `.predict()` ever would. Writing an API with no third-party dependencies at all, so that it could run inside Vercel's 500 MB Python function limit without the roughly 100 MB that scikit-learn alone would add, forced a close reading of exactly what the trained model needs at inference time and what it does not. Building the explanation panel on an exact decomposition, rather than an approximate one, meant the trainee had to prove the additivity property in the notebook before trusting it in the interface. Throughout, excluding the protected personal-status-and-sex attribute, keeping the API stateless, and evaluating only on out-of-fold predictions were treated as non-negotiable rather than as afterthoughts.

## 5.3 Limitations of the System

- The dataset is the UCI Statlog German Credit data: 1,000 applicants from a single German bank in 1994. It is well suited to demonstrating a full modelling pipeline, but it is old and small, and the model's behaviour should not be assumed to generalise to current lending conditions or to a different population of borrowers.
- The personal-status-and-sex attribute was excluded as a protected attribute, and several other original attributes were dropped to keep the input form short. This keeps the model from using sex directly, but no formal fairness audit or proxy-discrimination analysis was carried out on the fields that remain.
- The deployed function has no scikit-learn, or any other heavy machine learning runtime, bundled into it. That keeps the Vercel function small, but it also means the model cannot be retrained, or its predictions monitored for drift, from the production environment itself; both require the separate, offline training pipeline.
- Evaluation is five-fold cross-validation on one static dataset split. The out-of-fold metrics in Chapter 3 are honest in the sense that no row was ever scored by a model that had seen it during training, but there is no independent, more recent holdout set, and no live monitoring of how the model's predictions compare with actual outcomes after deployment.
- The path-contribution explanation is exact for what it decomposes, the model's own raw margin, but it is still only an approximation of the separate TreeSHAP method against which it was checked; the two agreed on most but not all of their top factors (93 of 100 sampled applicants).
- Loan and income amounts are stated in Deutsche Mark, the currency used in the original 1994 dataset, and are not converted to a current currency.
- There are no officer accounts, no login and no audit trail; any visitor to the site can run any assessment, and no record is kept of who ran what.
- Monthly income is a derived feature, computed from the loan amount, the duration and the instalment rate rather than measured directly from the applicant, so it carries whatever approximation error that derivation introduces.
- The cutoff explorer on the portfolio page only has data for the twelve cutoff values actually computed during training (0.05 to 0.60 in steps of 0.05); it cannot be queried at an arbitrary cutoff.

## 5.4 Future Scope for Modification

- A formal fairness audit, including a proxy-discrimination analysis of fields such as housing and employment history that could correlate with protected characteristics even though no protected attribute is used directly.
- Retraining on more recent lending data, together with reject inference to correct for the fact that a historical dataset only records outcomes for applicants who were actually approved.
- Richer explanations using full SHAP interaction values, rather than single-feature path contributions, to surface how pairs of factors jointly move a score.
- Monotonic constraints on the gradient boosting trees, so that, for example, increasing income can never be allowed to raise the predicted probability of default.
- Model monitoring in production, with drift detection on the incoming feature distributions and on the gap between predicted and observed default rates over time.
- Batch scoring through a CSV upload, so a lender could score a whole book of applicants in one pass instead of one at a time through the form.
- Officer accounts with role-based access and an audit log of every assessment run, addressing the lack of accountability noted in the limitations above.
- PDF export of an individual risk slip, so a result could be saved or attached to a file outside the application.
- Support for comparing two or more cutoffs side by side (an A/B view), rather than moving a single slider between them one at a time.

## 5.5 References / Bibliography

1. Hofmann, H. Statlog (German Credit Data). UCI Machine Learning Repository, 1994. https://archive.ics.uci.edu/dataset/144/statlog+german+credit+data
1. Friedman, J. H. Greedy function approximation: a gradient boosting machine. *Annals of Statistics*, 29(5), 2001.
1. Platt, J. Probabilistic outputs for support vector machines and comparisons to regularized likelihood methods. *Advances in Large Margin Classifiers*, MIT Press, 1999.
1. Lundberg, S. M. and Lee, S.-I. A unified approach to interpreting model predictions. *Advances in Neural Information Processing Systems* (NeurIPS), 2017.
1. Saabas, A. Interpreting random forests. *treeinterpreter* blog post, 2014.
1. Pedregosa, F. et al. Scikit-learn: Machine Learning in Python. *Journal of Machine Learning Research*, 12, 2011.
1. Chen, T. and Guestrin, C. XGBoost: A Scalable Tree Boosting System. *Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining* (KDD), 2016.
1. Siddiqi, N. *Credit Risk Scorecards: Developing and Implementing Intelligent Credit Scoring*. Wiley, 2006.
1. Niculescu-Mizil, A. and Caruana, R. Predicting good probabilities with supervised learning. *Proceedings of the 22nd International Conference on Machine Learning* (ICML), 2005.
1. Vercel Inc. Next.js Documentation. https://nextjs.org/docs
1. Meta Platforms, Inc. React Documentation. https://react.dev
1. Vercel Inc. Python Runtime Documentation. https://vercel.com/docs/functions/runtimes/python
1. Tailwind Labs Inc. Tailwind CSS Documentation. https://tailwindcss.com/docs
1. Recharts. Recharts Documentation. https://recharts.org
1. Mozilla Foundation. MDN Web Docs. https://developer.mozilla.org
