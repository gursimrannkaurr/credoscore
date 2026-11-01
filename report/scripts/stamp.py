import json
import sys

import pymupdf

src, pages_json, out = sys.argv[1:4]
doc = pymupdf.open(src)
info = json.load(open(pages_json))
FONT = "C:/Windows/Fonts/times.ttf"
X_CENTRE = 595.32 / 2  # symmetric 72pt margins: page centre = text-box centre
for idx, num in info["numbers"].items():
    page = doc[int(idx)]
    s = str(num)
    width = pymupdf.get_text_length(s, fontname="tiro", fontsize=12)
    page.insert_text((X_CENTRE - width / 2, 804), s, fontsize=12, fontname="TimesNR", fontfile=FONT, color=(0, 0, 0))
doc.set_metadata({"title": "Loan Default Risk Predictor: Summer Training Report", "author": "Gursimran Kaur", "subject": "BCA Summer Training Report", "keywords": "credit risk, gradient boosting, explainable AI"})
doc.save(out, garbage=3, deflate=True)
print("stamped", len(info["numbers"]), "pages ->", out)
