# Indian bank and CIBIL model

The Assess page now uses the **Leading Indian Bank & CIBIL Real-World Dataset** pair mirrored in [rounak97's public repository](https://github.com/rounak97/Credit-Risk-Modelling-Using-Machine-Learning). The two workbooks each contain 51,336 rows joined one-to-one on `PROSPECTID`. The raw workbooks are not checked into this repository; run `py ml/train_cibil.py --download` to fetch them into the ignored `data/cibil/` directory.

## What the target means

The target is `Approved_Flag`, whose values are `P1`, `P2`, `P3`, and `P4`. It represents the bank's historical priority/risk grouping. It is **not** a verified future repayment result, a 90-days-past-due outcome, or an approval probability. The app therefore reports the predicted class and the model's class probability; it does not report probability of default or recommend accepting/rejecting a real applicant. Probability here means the fitted classifier's relative confidence among its four target classes; it has not been calibrated as a real-world frequency.

## Join, feature extraction, and leakage controls

The training code verifies that both `PROSPECTID` columns are unique and that all rows join one-to-one. The identifier is dropped before fitting. The source uses `-99999` as a missing-value marker; preprocessing converts it to missing and fills numeric values with training medians and categorical values with their most common training value. Product and education categories are one-hot encoded. The form exposes a documented subset of applicant and bureau fields. Derived features include active-account share, missed-payment count per trade line, and unsecured-account share. Tree models do not require numeric scaling.

The two workbooks also contain gender and marital-status fields. These are deliberately **excluded** from all three model feature matrices. The Assess page shows those fields in a controlled what-if that leaves the model result unchanged by construction, and it reports their P1–P4 label mix on the stratified holdout. That summary can reveal a group difference in the historical label, but it is not by itself a formal fairness test or proof of discrimination. Other model inputs may correlate with protected attributes.

## Training and evaluation

`ml/train_cibil.py` makes a reproducible stratified 80/20 holdout with seed 42. It fits Gradient Boosting, XGBoost, and Random Forest; inverse-frequency sample weights are used for the two boosting learners, and the forest uses balanced subsampling. The script saves joblib pipelines and a JSON metadata file under `model/cibil/`. The metadata includes accuracy, balanced accuracy, macro F1, log loss, per-class precision/recall/F1, and holdout group label shares. Macro F1 and per-class results are important because P2 is much more common than P1, P3, or P4.

These figures measure reproduction of the source's priority label on a random holdout from the same dataset. The sample is a single bank/source and the label may have been constructed from many of the bureau signals available to the model. Strong scores therefore do not establish that the model predicts future defaults, transfers to another lender, or is suitable for lending decisions. Temporal and external validation against a clearly defined repayment horizon would be needed for that claim.

## Run and deploy

```powershell
py ml/train_cibil.py --download
py ml/train_cibil.py
py ml/dev_server.py
```

The local development server exposes `POST /api/predict-cibil` on port 8004. Training and export use `ml/requirements-cibil.txt`. The fitted estimators are flattened to a compressed JSON tree artifact; the deployed scorer uses only the Python standard library and does not install pandas, scikit-learn, or XGBoost in the serverless function.
