"""Splice the literal, user-supplied front-page PDF in as page 1 of the final
report, replacing the HTML/CSS-generated cover. Runs as the last step after
build.mjs's two-pass pagination + stamp.py, so it never touches page numbering
on the body pages: it only swaps the one unnumbered front-matter cover page.
"""
import os

import pymupdf

ROOT = r"C:\Users\harsh\Desktop\HARSH\WEB-DEV-PROJECTS\ml-project"
COVER_SRC = rf"{ROOT}\FRONT PAGE RREPORT.pdf"
TARGET = rf"{ROOT}\Loan_Default_Risk_Predictor_STR_Report.pdf"
TMP = rf"{ROOT}\report\dist\report-with-real-cover.pdf"

doc = pymupdf.open(TARGET)
cover = pymupdf.open(COVER_SRC)

doc.delete_page(0)
doc.insert_pdf(cover, from_page=0, to_page=0, start_at=0)

doc.save(TMP, garbage=3, deflate=True)
doc.close()
cover.close()
os.replace(TMP, TARGET)
print(f"Replaced page 1 of {TARGET} with {COVER_SRC}'s page 1.")
