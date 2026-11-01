"""Publish the two standalone covers; the report itself starts at certificate."""
from pathlib import Path
import re
import pymupdf

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'report front page.pdf'
synopsis = (ROOT / 'report/synopsis/synopsis.md').read_text(encoding='utf-8')
hod = re.search(r'HOD \(BCA\):\s*([^<\n]+)', synopsis).group(1).strip()

for suffix, with_hod in [('Cover', False), ('Cover_With_HOD', True)]:
    with pymupdf.open(SOURCE) as source:
        out = pymupdf.open()
        out.insert_pdf(source, from_page=0, to_page=0)
        if with_hod:
            page = out[0]
            professor = page.search_for('(ASSISTANT PROFESSOR)')[0]
            center = (professor.x0 + professor.x1) / 2
            text = f'HOD {hod}, BCA'
            width = pymupdf.get_text_length(text, fontname='tiro', fontsize=10)
            page.insert_text((center - width/2, professor.y1 + 21), text,
                             fontsize=10, fontname='tiro', color=(0, 0, 0))
        target = ROOT / f'Loan_Default_Risk_Predictor_{suffix}.pdf'
        out.set_metadata({'title': f'CredoScore - {suffix.replace("_", " ")}', 'author': 'Gursimran Kaur'})
        out.save(target, garbage=3, deflate=True)
        out.close()
        print('Wrote', target)
