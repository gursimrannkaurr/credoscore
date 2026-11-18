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

During the six-week summer training the trainee studied the problem of estimating a loan applicant's probability of default and built the Loan Default Risk Predictor on the UCI Statlog German Credit dataset. The pipeline prepares thirteen usable inputs from 1,000 records, benchmarks four candidate models with stratified five-fold cross-validation, tunes Gradient Boosting by randomized search, calibrates its outputs using held-out predictions, and exports three tree ensembles for dependency-free API scoring. The Assess interface compares Gradient Boosting, XGBoost and Random Forest, and includes a what-if selector for the dataset's combined personal-status/sex category. Because the dataset combines those traits, it cannot isolate their separate effects. The interface makes this limitation clear; no fairness audit has been completed.

## 5.2 Conclusion

The application accepts thirteen fields and returns calibrated estimates from three models. In the latest training run, the tuned Gradient Boosting configuration reached a mean cross-validation ROC-AUC of 0.7955 during model selection; its separate calibrated out-of-fold evaluation was ROC-AUC 0.7919, PR-AUC 0.6257, KS 0.4762 and Brier score 0.1603. XGBoost's out-of-fold ROC-AUC was 0.7899 and Random Forest's was 0.7849. These describe performance on a small historical dataset, not a guarantee about new applicants. The combined sex/personal-status field is included for a model-sensitivity demonstration, but cannot separate sex from personal-status effects. No fairness audit has been conducted, so the system is not suitable for real lending decisions.

The project also gave the trainee practical experience across data preparation, model comparison, probability calibration, model export, API design and deployment. Export checks compare the custom tree walkers with their training libraries. The API remains stateless. Model evaluation uses held-out folds so reported results are not simply measured on the rows used to fit each fold's model. The new demographic input makes model sensitivity visible while leaving a formal fairness audit as future work.

## 5.3 Limitations of the System

- The dataset is 1,000 applicants from a single German bank in 1994: well suited to a full modelling pipeline, but old and small, and results should not be assumed to generalise to current lending conditions.
- The combined personal-status-and-sex field is included for a sensitivity demonstration. No formal fairness or proxy-discrimination audit was carried out, and the source data cannot isolate its two characteristics.
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

The sources drawn on through this report are grouped below by kind: the source dataset and where it was used, the three papers that define the algorithms actually benchmarked and deployed, the one book, and the web documentation consulted while building the application, each noted against the part of the project it supported.

**Dataset**

1. Hofmann, H. Statlog (German Credit Data). UCI Machine Learning Repository, 1994. https://archive.ics.uci.edu/dataset/144/statlog+german+credit+data. Used as the sole training and evaluation data for all three deployed models (`ml/train.py`): 1,000 applicants, cleaned into the twelve input fields the application scores on, split five ways for cross-validated benchmarking, and held out again for the reported out-of-fold metrics.

**Papers**

1. Friedman, J. H. Greedy function approximation: a gradient boosting machine. *Annals of Statistics*, 29(5), 2001. The algorithm behind the deployed, tuned Gradient Boosting model.
1. Breiman, L. Random forests. *Machine Learning*, 45(1), 5 to 32, 2001. The algorithm behind the deployed Random Forest model.
1. Chen, T. and Guestrin, C. XGBoost: A Scalable Tree Boosting System. *Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining* (KDD), 2016. The algorithm behind the deployed XGBoost model.

**Books**

1. Siddiqi, N. *Credit Risk Scorecards: Developing and Implementing Intelligent Credit Scoring*. Wiley, 2006.

**Web sources / documentation**

1. Scikit-learn developers. Scikit-learn User Guide. https://scikit-learn.org/stable/user_guide.html. Used throughout `ml/train.py` for data preparation, the Logistic Regression and Random Forest estimators, and the cross-validation and hyperparameter search tooling; its calibration guide was the practical reference for the Platt scaling step.
1. XGBoost developers. XGBoost Documentation. https://xgboost.readthedocs.io. Used to train the XGBoost candidate and to understand `trees_to_dataframe()`, the method the export step relies on to flatten its trees into the dependency-free JSON artifact.
1. SHAP developers. SHAP Documentation. https://shap.readthedocs.io. Used for the TreeSHAP cross-check in `notebook.ipynb`, which verifies the hand-rolled factor contributions against an independent explanation method.
1. PyMuPDF developers. PyMuPDF Documentation. https://pymupdf.readthedocs.io. Used throughout the report build: stamping page numbers, embedding the scanned company certificate, and correcting text directly inside the literal cover and certificate PDFs.
1. Puppeteer developers. Puppeteer Documentation. https://pptr.dev. Used to render the report's diagrams, charts and code figures to PDF through a headless browser.
1. Mermaid developers. Mermaid Documentation. https://mermaid.js.org. Used for the sequence diagram and several of the report's other figures.
1. Vercel Inc. Next.js Documentation. https://nextjs.org/docs
1. Meta Platforms, Inc. React Documentation. https://react.dev
1. Vercel Inc. Python Runtime Documentation. https://vercel.com/docs/functions/runtimes/python
1. Tailwind Labs Inc. Tailwind CSS Documentation. https://tailwindcss.com/docs
1. Recharts. Recharts Documentation. https://recharts.org
