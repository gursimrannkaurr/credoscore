<section class="front-page cover">

<p class="b11">A PROJECT REPORT</p>

<p class="b11">ON</p>

<p class="cover-brand">CREDOSCORE</p>

<p class="b12">LOAN DEFAULT RISK PREDICTOR: AN EXPLAINABLE MACHINE<br>LEARNING WEB APPLICATION FOR CREDIT RISK ASSESSMENT</p>

<p class="i10">Submitted in partial fulfilment of the requirements</p>

<p class="i10">for the award of the degree</p>

<p class="b11">OF</p>

<p class="b11">BACHELOR OF COMPUTER APPLICATIONS (BCA)</p>

<p class="b11">To</p>

<p class="b11">GURU GOBIND SINGH INDRAPRASTHA UNIVERSITY, DELHI</p>

<p class="b10">SUBMITTED BY:</p>

<p class="b11">GURSIMRAN KAUR</p>

<p class="b10">02490202024</p>

<p class="r9">UNDER THE SUPERVISION</p>

<p class="r9">OF</p>

<p class="r9">Ms. Nisha Choudhary</p>

<p class="r9">(Assistant Professor)</p>

<img class="logo" src="../assets/brand/college-logo.png" alt="Institute logo">

<p class="b11">SRI GURU TEGH BAHADUR INSTITUTE OF MANAGEMENT AND</p>

<p class="b11">INFORMATION TECHNOLOGY</p>

<p class="i9">(24, GT Karnal Rd, Gurdwara Nanak Piao Campus, Kirpal Bagh, Gujranwala Town, New Delhi, Delhi, 110033)</p>

<p class="b9">(2024-2027)</p>

</section>

<section class="front-page">

<p class="front-title">CERTIFICATE</p>

This is to certify that the Summer Training Report entitled "Loan Default Risk Predictor: An Explainable Machine Learning Web Application for Credit Risk Assessment" is a bonafide work carried out by GURSIMRAN KAUR, Enrolment No. 02490202024, a student of Bachelor of Computer Applications (BCA), Semester V, Section 5A, at Sri Guru Tegh Bahadur Institute of Management and Information Technology, in partial fulfilment of the requirements for the award of the degree of Bachelor of Computer Applications.

The work was carried out under my guidance during the six-week summer training, and to the best of my knowledge it is original and has not been submitted elsewhere for any degree or diploma.

<div class="signature">

____________________

Ms. Nisha Choudhary

Mentor / Guide

</div>

<p class="date-place">Date: ____________ Place: ____________</p>

</section>

<section class="front-page">

<p class="front-title">COMPANY'S CERTIFICATE</p>

Certificate of Completion issued by GRAStech to GURSIMRAN KAUR for successfully completing the six-week online internship program in Machine Learning Using Python. Date of issue: 31 July 2026. Signed by Mohammad Qayam Ali, Founder and Program Head.

<figure class="cert-figure"><img src="../assets/brand/company-certificate.png" alt="Scanned company certificate of completion issued by GRAStech to Gursimran Kaur"></figure>

</section>

<section class="front-page">

<p class="front-title">CANDIDATE'S DECLARATION</p>

I, GURSIMRAN KAUR, Enrolment No. 02490202024, a student of BCA, Semester V, Section 5A, Sri Guru Tegh Bahadur Institute of Management and Information Technology, hereby declare that the Summer Training Report entitled "Loan Default Risk Predictor: An Explainable Machine Learning Web Application for Credit Risk Assessment" is my own original work, carried out during the six-week online internship in Machine Learning Using Python at GRAStech, and that it has been written in my own words.

I further declare that this report has not been copied from any book, website or another student, that wherever the work of others has been used it has been acknowledged in the references, and that this report has not been submitted to any other institute or university for the award of any degree or diploma.

<div class="signature">

GURSIMRAN KAUR

Enrolment No.: 02490202024

</div>

<p class="date-place">Date: ____________ Place: ____________</p>

</section>

<section class="front-page">

<p class="front-title">ACKNOWLEDGEMENT</p>

I express my sincere gratitude to everyone who helped me in completing this Summer Training Report and the project Loan Default Risk Predictor.

I am thankful to GRAStech and Mohammad Qayam Ali, Founder and Program Head, for providing the opportunity of a six-week online internship in Machine Learning Using Python, which gave me the practical exposure needed to build this project.

I am grateful to my mentor, Ms. Nisha Choudhary, Assistant Professor, for guiding me, reviewing the report and the working project, and giving valuable suggestions at every stage.

I thank the management and faculty of Sri Guru Tegh Bahadur Institute of Management and Information Technology for providing a good learning environment.

<div class="signature">

GURSIMRAN KAUR

</div>

</section>

<section class="front-page">

<p class="front-title">ABSTRACT</p>

Lenders that extend consumer credit must decide, quickly and consistently, whether an applicant is likely to repay a loan, in a way that is explainable to the applicant and defensible to a regulator. Manual underwriting varies between officers, traditional scorecards struggle to capture non-linear effects among income, loan amount and credit history, and the machine learning models that do capture such effects usually behave as a black box, giving a probability with no reason a loan officer can examine. A missed default and a wrongly declined applicant also carry different costs, and few tools let an institution weigh the two against each other.

Loan Default Risk Predictor is a web application, developed during the six-week summer training (an online internship in Machine Learning Using Python at GRAStech), that scores an applicant's probability of default and explains the score factor by factor. A user enters twelve fields covering the applicant, the loan and the existing credit position, or loads a sample file, and receives a calibrated probability of default, a risk band, a score and a lending recommendation, along with a waterfall of the contribution each factor made to the score. A what-if control lets the user move the approval cutoff and see how the approval rate, the bad rate and the expected cost change.

The model is a gradient boosting ensemble of 250 trees, trained on the UCI German Credit dataset of 1,000 applicants, benchmarked against logistic regression, random forest and XGBoost under five-fold cross-validation, tuned by randomized search and Platt-calibrated so its output reads as a true probability. Contributions are computed with a Saabas tree-path decomposition, rescaled to sum exactly to the predicted probability. The application runs Next.js and React on the front end and a dependency-free Python scoring function on the back end, deployed as a Vercel serverless function, and was verified with 13 notebook tests, 25 API tests and 18 interface tests, all passing.

The report covers the problem formulation, system analysis, system design including the ERD, DFD and use case diagrams, the model's evaluation, testing, implementation, limitations, future scope, and annexures of screen snapshots and source code. The live application is available at [LIVE URL].

Keywords: Credit Risk, Probability of Default, Gradient Boosting, Platt Scaling, Explainable AI, Next.js, Python, Vercel.

</section>

<section class="front-page">

<p class="front-title">LIST OF FIGURES</p>

<div class="lof"></div>

</section>

<section class="front-page">

<p class="front-title">LIST OF TABLES</p>

<div class="lot"></div>

</section>

<section class="front-page">

<p class="front-title">LIST OF ABBREVIATIONS</p>

| Abbreviation | Full Form |
| --- | --- |
| API | Application Programming Interface |
| AUC | Area Under the Curve |
| BCA | Bachelor of Computer Applications |
| CORS | Cross-Origin Resource Sharing |
| CSV | Comma-Separated Values |
| CV | Cross-Validation |
| DFD | Data Flow Diagram |
| DM | Deutsche Mark |
| ERD | Entity Relationship Diagram |
| FN | False Negative |
| FP | False Positive |
| GB | Gradient Boosting |
| JSON | JavaScript Object Notation |
| KS | Kolmogorov-Smirnov (statistic) |
| ML | Machine Learning |
| OOF | Out-of-Fold |
| PD | Probability of Default |
| PR-AUC | Precision-Recall Area Under the Curve |
| REST | Representational State Transfer |
| ROC | Receiver Operating Characteristic |
| STR | Summer Training Report |
| UCI | University of California, Irvine |
| UI | User Interface |
| XAI | Explainable Artificial Intelligence |

</section>

<section class="front-page">

<p class="contents-title">C O N T E N T S</p>

<div class="toc"></div>

</section>
