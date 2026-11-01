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

During the six-week summer training the trainee studied the problem of estimating a loan applicant's probability of default and built the Loan Default Risk Predictor on the UCI Statlog German Credit dataset, covering the full life cycle of a small machine learning application: feature-engineering the 1,000-row dataset into twelve usable fields, benchmarking four candidate models under identical five-fold cross-validation, tuning a gradient boosting model by randomized search, calibrating its output with Platt scaling fitted on out-of-fold margins, and exporting the fitted ensemble as a dependency-free JSON artifact a stand-alone Python function could score without scikit-learn. Two further models, XGBoost and random forest, were later refit and deployed alongside it, so every applicant is checked against three independently trained models at once. On top of these artifacts the trainee built a dependency-free scoring API with full input validation, a per-tree explanation mechanism, and a Next.js front end covering an assessment workbench, a portfolio analytics page and a methodology page, styled as an editorial fintech site in the project's green. The work closed with 62 test cases across the model, the API and the interface, correction of the eleven defects in Table 4.7, and deployment to Vercel.

## 5.2 Conclusion

The Loan Default Risk Predictor meets the objectives set out in Chapter 1. It takes twelve fields a lender could reasonably ask an applicant for and returns a calibrated probability of default, a risk band, a 300-to-850 score and a cutoff-based recommendation, each accompanied by a per-factor explanation that sums exactly to the predicted probability rather than approximating it. The deployed gradient boosting model reached an out-of-fold ROC-AUC of 0.7928 and a KS statistic of 0.4776, ahead of the logistic-regression baseline at 0.7737 and corroborated by the two further models now cross-checking it in production (XGBoost 0.7869, random forest 0.7833 ROC-AUC). Its Brier score of 0.1601, against a flat-guess baseline of 0.2100, and a weighted calibration gap of 0.0195 both support the same reading: the number returned can be treated as an actual probability, not merely used to rank applicants. Top-decile applicants defaulted 10.9 times more often than bottom-decile applicants, and every prediction's path contributions are exactly additive by construction, agreeing with an independent TreeSHAP ranking on at least three of five top factors for 93 of 100 sampled applicants.

The project also gave the trainee practical experience a course alone would not. Training honestly, with a manual per-fold cross-validation loop written because a library scorer could not be trusted across every candidate, differs from reporting a single train-test split. Exporting the models into hand-written tree walks that reproduce the fitted pipelines' output to within 1e-9 or better, and discovering and fixing XGBoost's strict-inequality routing bug along the way, taught more about how these ensembles actually score a row than calling `.predict()` ever would. Writing an API with no third-party dependencies, so it runs inside Vercel's 500 MB limit without scikit-learn's roughly 100 MB, forced a close reading of exactly what a trained model needs at inference time. Throughout, excluding the protected personal-status-and-sex attribute, keeping the API stateless, and evaluating only on out-of-fold predictions were treated as non-negotiable.

## 5.3 Limitations of the System

- The dataset is 1,000 applicants from a single German bank in 1994: well suited to a full modelling pipeline, but old and small, and results should not be assumed to generalise to current lending conditions.
- The personal-status-and-sex attribute was excluded, but no formal fairness audit or proxy-discrimination analysis was carried out on the fields that remain.
- The deployed functions carry no machine learning runtime, so retraining and drift monitoring both require the separate, offline training pipeline.
- Evaluation is five-fold cross-validation on one static dataset split; there is no independent holdout set or live monitoring against actual outcomes after deployment.
- The path-contribution explanation is exact for the raw margin, but only an approximation of the TreeSHAP method it was checked against (93 of 100 applicants agreed); random forest gets no driver breakdown at all.
- Loan and income amounts are in Deutsche Mark, the original dataset's currency, not converted to a current one.
- There are no officer accounts, login or audit trail; any visitor can run any assessment.
- Monthly income is a derived, not directly measured, feature, carrying whatever approximation error that derivation introduces.
- The cutoff explorer only has data for the twelve values computed during training (0.05 to 0.60 in steps of 0.05).

## 5.4 Future Scope for Modification

- A formal fairness audit, including proxy-discrimination analysis of fields such as housing and employment history.
- Retraining on more recent data, with reject inference for the fact that a historical dataset only records approved outcomes.
- Richer explanations using full SHAP interaction values, and a driver breakdown for random forest as well.
- Monotonic constraints on the boosted trees, so increasing income can never raise the predicted default probability.
- Model monitoring in production, with drift detection across all three deployed models.
- Batch scoring through a CSV upload, so a lender could score a whole book of applicants in one pass.
- Officer accounts with role-based access and an audit log of every assessment run.
- PDF export of a risk slip, and comparing two or more cutoffs side by side.

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
