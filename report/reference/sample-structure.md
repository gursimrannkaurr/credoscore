# Sample report structure

## Table of Contents (from doc.get_toc())

- CHAPTER 1: PROBLEM FORMULATION (p.12)
  - 1.1 Introduction about the Company (p.12)
  - 1.2 Introduction about the Problem (p.12)
  - 1.3 Present State of the Art (p.13)
  - 1.4 Need of Computerization (p.14)
  - 1.5 Proposed Software / Project (p.15)
    - 1.5.1 Objectives of the Project (p.15)
    - 1.5.2 Scope of the Project (p.16)
  - 1.6 Importance of the Work (p.16)
- CHAPTER 2: SYSTEM ANALYSIS (p.19)
  - 2.1 Feasibility Study (p.19)
    - Technical Feasibility (p.19)
    - Economic Feasibility (p.19)
    - Operational Feasibility (p.19)
    - Schedule Feasibility (p.19)
    - Legal and Security Feasibility (p.20)
  - 2.2 Analysis Methodology (p.20)
    - 2.2.1 Requirement Gathering (p.21)
    - 2.2.2 Users of the System (p.21)
    - 2.2.3 Functional Requirements (p.21)
    - 2.2.4 Non-Functional Requirements (p.22)
    - 2.2.5 Role-Permission Matrix (p.23)
  - 2.3 Choice of the Platforms (p.23)
    - 2.3.1 S/W used (p.23)
    - 2.3.2 H/W used (p.24)
    - 2.3.3 Software Requirement Summary (p.24)
- CHAPTER 3: SYSTEM DESIGN (p.26)
  - 3.1 Design Methodology (p.26)
    - 3.1.1 System Architecture (p.26)
    - 3.1.2 Module Hierarchy (p.27)
    - 3.1.3 Project Structure (p.27)
  - 3.2 Database Design (p.28)
    - 3.2.1 ERD (p.28)
    - Collection Structure (p.29)
    - Validations, Verifications and Normalization (p.30)
    - 3.2.2 DFD (p.31)
    - Use Case Diagram (p.32)
    - Process Flowcharts (p.33)
  - 3.3 Input Design (p.34)
  - 3.4 Output Design (p.35)
  - 3.5 Code Design and Development (p.36)
    - 3.5.1 REST API Design (p.36)
    - 3.5.2 Security Design (p.37)
    - 3.5.3 Important Code Segments (p.38)
- CHAPTER 4: TESTING AND IMPLEMENTATION (p.41)
  - 4.1 Testing Methodology (p.41)
    - Test Environment (p.41)
  - 4.2 Test Data & Test Cases (p.42)
  - 4.3 Test Reports and Debugging (p.45)
    - 4.3.1 Test Report (p.45)
    - 4.3.2 Defects Found and Debugging (p.45)
  - 4.4 Implementation (p.46)
    - 4.4.1 Local Setup Steps (p.46)
    - 4.4.2 Deployment (p.47)
    - 4.4.3 User Manual (Brief) (p.48)
    - 4.4.4 Maintenance (p.48)
- CHAPTER 5: CONCLUSION AND REFERENCES (p.50)
  - 5.1 Summary of the Work Done (p.50)
  - 5.2 Conclusion (p.50)
  - 5.3 Limitations of the System (p.50)
  - 5.4 Future Scope for Modification (p.51)
  - 5.5 References / Bibliography (p.52)
- CHAPTER 6: ANNEXURES (p.54)
  - A-1 Sample Inputs (p.54)
  - A-2 Sample Outputs (p.56)
  - A-3 Coding (p.58)
    - A-3.1 models/user.js (p.58)
    - A-3.2 models/Job.js (p.59)
    - A-3.3 models/Application.js (p.59)
    - A-3.4 routes/authRoutes.js (registration and login) (p.59)
    - A-3.5 routes/jobRoutes.js (update with ownership check) (p.60)
    - A-3.6 routes/applicationRoutes.js (status update) (p.60)
    - A-3.7 routes/adminRoutes.js (platform overview) (p.60)

## Tables
- Table 1.1 Comparison of existing approaches and CareerConnect (p.14)
- Table 2.1 Iterations followed during development (p.20)
- Table 2.2 Actors and their responsibilities (p.21)
- Table 2.3 Functional requirements (p.21)
- Table 2.4 Role-permission matrix (p.23)
- Table 2.5 Software used (p.23)
- Table 2.6 Hardware used (p.24)
- Table 3.1 Folder and file structure (p.27)
- Table 3.2 Structure of the users collection (p.29)
- Table 3.3 Structure of the jobs collection (p.29)
- Table 3.4 Structure of the applications collection (p.30)
- Table 3.5 Description of Level 1 processes (p.32)
- Table 3.6 Use case description: Apply for Job (p.33)
- Table 3.7 Registration form (p.34)
- Table 3.8 Login form (p.35)
- Table 3.9 Post Job / Edit Job form (Recruiter) (p.35)
- Table 3.10 Search and filter form (p.35)
- Table 3.11 Profile and resume form (p.35)
- Table 3.12 REST API endpoints (p.36)
- Table 4.1 Test cases for authentication (p.42)
- Table 4.2 Test cases for job management (p.42)
- Table 4.3 Test cases for applications (p.43)
- Table 4.4 Test cases for profile, resume and admin (p.44)
- Table 4.5 Test cases for front-end and API access control (p.44)
- Table 4.6 Test summary (p.45)
- Table 4.7 Defects found and corrections made (p.45)
- Table 4.8 Using the system (p.48)

## Figures
- Figure 2.1 Project schedule of the six-week training (p.20)
- Figure 3.1 Three-tier architecture of CareerConnect (p.26)
- Figure 3.2 Module hierarchy of CareerConnect (p.27)
- Figure 3.3 Entity Relationship Diagram of CareerConnect (p.28)
- Figure 3.4 Context Level DFD (Level 0) (p.31)
- Figure 3.5 Level 1 DFD (p.31)
- Figure 3.6 Use case diagram (p.32)
- Figure 3.7 Flowchart of the login process (p.33)
- Figure 3.8 Flowchart of the apply-for-job process (p.34)
- Figure 3.9 State diagram of an application's status (p.34)
- Figure 4.1 Deployment of CareerConnect (p.47)

## Style contract (from plan §R2.2, copied verbatim)

**Page and body text**
- A4 (595.3 x 841.9 pt).
- Margins: top 72pt, right 69pt, bottom 72pt, left 108pt.
- Times New Roman throughout, black only.
- Body: 12pt, line pitch 20.7pt (1.5 lines), justified, about 6pt after each paragraph. No first-line indent.

**Headings and front matter**
- Chapter title on the first body page: 16pt bold, centred, uppercase ("CHAPTER 1: PROBLEM FORMULATION"), starting a new page.
- Section "1.1 ...": 13pt bold, left. Subsection "1.5.1 ...": 12pt bold. Unnumbered sub-heads ("Technical Feasibility"): 12pt bold.
- Front-matter titles (CERTIFICATE, COMPANY'S CERTIFICATE, CANDIDATE'S DECLARATION, ACKNOWLEDGEMENT, ABSTRACT, LIST OF FIGURES, LIST OF TABLES, LIST OF ABBREVIATIONS): 16pt bold, centred, top of page.
- CONTENTS: 18pt bold, set as "C O N T E N T S".
- Front matter has no page numbers.

**Chapter openers** (own page, no number)
- "CHAPTER N", 22pt bold, centred, at about y = 193pt.
- Title 17pt bold, centred, uppercase, about 22pt below.
- About 35pt gap, then "Learning Objectives" 13pt bold, left, underlined.
- Then 4 bullets.

**Lists**
- Bullets: a bullet glyph at an 18pt indent, text at a 36pt hanging indent; item pitch about 24pt.
- Numbered lists: the number at 18pt, wrapped lines at 36pt.

**Tables and captions**
- Tables: full text width, 0.5pt black grid, header row fill #D9D9D9 with bold text, body 12pt (11.5pt allowed for dense tables) with about 15.5pt line pitch inside cells, cell padding about 3.5pt left. Header rows repeat on page breaks; rows don't split.
- Table captions: above the table, bold 12pt, centred, "Table 1.1 Comparison of ..." (no colon).
- Figure captions: below the figure, bold 12pt, centred, "Figure 3.1 Three-tier architecture of ...". Figures are centred.

**Code and numbering**
- Code: Courier New 9.5pt, 11pt pitch, on a #F2F2F2 band that starts 10.5pt in from the left margin and runs to the right margin.
- Page numbers: Arabic, bottom centre of the text block (x-centre approx 317pt, baseline approx 804pt), 12pt. Body pages count from 1 at Chapter 1's first page. Opener pages are neither numbered nor counted.

**Navigation pages**
- LIST OF FIGURES / TABLES: 11.5pt with the shape "Figure 2.1   Title ... 7" (dot leader, right-aligned number).
- CONTENTS lines: 11.5pt. Chapter lines are bold at the margin; section lines are regular at an 18pt indent.
- Abbreviations: a 2-column table with a grey header ("Abbreviation" | "Full Form"); the first column is about 110pt wide.

**Cover** (centred, all text black)

| y (pt) | Text | Style |
|---|---|---|
| 108 | "A PROJECT REPORT" | 11 bold |
| 135 | "ON" | 11 bold |
| 163 | the title in caps, about 2 lines | 12 bold |
| 219 | "Submitted in partial fulfilment of the requirements" | 10 italic |
| 239 | "for the award of the degree" | 10 italic |
| 265 | "OF" | 11 bold |
| 293 | "BACHELOR OF COMPUTER APPLICATIONS (BCA)" | 11 bold |
| 321 | "To" | 11 bold |
| 349 | "GURU GOBIND SINGH INDRAPRASTHA UNIVERSITY, DELHI" | 11 bold |
| 392 | "SUBMITTED BY:" | 10 bold |
| 412 | [STUDENT NAME] | 11 bold |
| 434 | [ENROLMENT NO.] | 10 bold |
| 475 | "UNDER THE SUPERVISION" | 9 |
| 494 | "OF" | 9 |
| 513 | [MENTOR NAME] | 9 |
| 532 | "([MENTOR DESIGNATION])" | 9 |
| 577 | logo, 77x85pt | -- |
| 699 | "SRI GURU TEGH BAHADUR INSTITUTE OF MANAGEMENT AND" | 11 bold |
| 714 | "INFORMATION TECHNOLOGY" | 11 bold |
| 745 | the address in brackets | 9 italic |
| 758 | "([SESSION])" | 9 bold |
