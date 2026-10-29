"""
Convert the sample STR report PDF to Markdown + a structure outline.

Usage (must use PY312, the only interpreter with pymupdf installed):
    PY312 -I report/scripts/convert_sample.py "CareerConnect_STR_Report (3).pdf" report/reference

Outputs (relative to <out_dir>):
    sample-report.md       - full page-by-page Markdown conversion
    sample-structure.md    - TOC tree, table/figure caption index, style contract
    images/p{page}-{n}.{ext} - every extracted image
    ../assets/brand/college-logo.png - the cover logo, cropped from page 1
"""

import sys
import os
import re
import io

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import pymupdf as fitz

BULLET_CHARS = {"", "•", ""}


def norm_text(s):
    # Normalize private-use-area bullet glyphs and curly punctuation safely.
    out = []
    for ch in s:
        if ch in BULLET_CHARS:
            out.append("•")
        else:
            out.append(ch)
    return "".join(out)


def is_bullet_line(text):
    t = text.strip()
    if not t:
        return False
    first = t[0]
    return first in BULLET_CHARS or t[:2] == "• " or first == "•"


NUM_LIST_RE = re.compile(r"^\s*(\d+)[\.\)]\s+")
SUBSECTION_RE = re.compile(r"^\s*\d+\.\d+\.\d+\b")
SECTION_RE = re.compile(r"^\s*\d+\.\d+\b")
CHAPTER_WORD_RE = re.compile(r"^CHAPTER\s+\d+", re.IGNORECASE)
TABLE_FIG_CAPTION_RE = re.compile(r"^(Table|Figure)\s+\d+\.\d+\b")


def get_line_spans(line):
    """Flatten a line's spans into (text, size, is_bold, is_courier, font, x0, x1)."""
    spans = []
    for sp in line.get("spans", []):
        text = norm_text(sp.get("text", ""))
        if text == "":
            continue
        font = sp.get("font", "")
        size = round(sp.get("size", 0), 1)
        flags = sp.get("flags", 0)
        is_bold = bool(flags & 2 ** 4) or "Bold" in font or "bold" in font
        is_courier = "Courier" in font
        bbox = sp.get("bbox", [0, 0, 0, 0])
        spans.append(
            {
                "text": text,
                "size": size,
                "bold": is_bold,
                "courier": is_courier,
                "font": font,
                "x0": bbox[0],
                "x1": bbox[2],
                "y0": bbox[1],
                "y1": bbox[3],
            }
        )
    return spans


def line_text(spans):
    return "".join(s["text"] for s in spans).strip()


def line_bbox_union(line):
    bbox = line.get("bbox")
    if bbox:
        return bbox
    return [0, 0, 0, 0]


def rects_overlap(bbox, table_bboxes):
    x0, y0, x1, y1 = bbox
    cy = (y0 + y1) / 2
    cx = (x0 + x1) / 2
    for (tx0, ty0, tx1, ty1) in table_bboxes:
        if tx0 - 2 <= cx <= tx1 + 2 and ty0 - 2 <= cy <= ty1 + 2:
            return True
    return False


def cluster_edges(edges, tol=8.0):
    edges = sorted(edges)
    clusters = []
    for e in edges:
        if clusters and e - clusters[-1][-1] <= tol:
            clusters[-1].append(e)
        else:
            clusters.append([e])
    return [sum(c) / len(c) for c in clusters]


def nearest_idx(canon, x):
    best_i, best_d = 0, abs(canon[0] - x)
    for i, c in enumerate(canon):
        d = abs(c - x)
        if d < best_d:
            best_d = d
            best_i = i
    return best_i


def build_table_grid(tbl):
    """Rebuild the table grid from the physical cell geometry rather than
    trusting find_tables()'s own column split, which over-splits columns
    when a header wraps onto two lines and the body cells don't. Column
    boundaries from every row are clustered (tolerance 8pt) into a single
    canonical set of column edges, and each cell's text is placed at the
    canonical column nearest its left edge."""
    try:
        rows = tbl.rows
        data = tbl.extract()
    except Exception:
        return None
    if not rows or not data:
        return None

    edges = set()
    for row in rows:
        for cell in row.cells:
            if cell is not None:
                edges.add(round(cell[0], 1))
                edges.add(round(cell[2], 1))
    if len(edges) < 2:
        return None
    canon = cluster_edges(edges, tol=8.0)
    ncols = max(1, len(canon) - 1)

    out_rows = []
    for ridx, row in enumerate(rows):
        out_row = [""] * ncols
        for cidx, cell in enumerate(row.cells):
            if cell is None:
                continue
            text = data[ridx][cidx] if ridx < len(data) and cidx < len(data[ridx]) else None
            text = norm_text(str(text)).strip() if text is not None else ""
            if not text:
                continue
            li = min(nearest_idx(canon, cell[0]), ncols - 1)
            if out_row[li]:
                out_row[li] += " " + text
            else:
                out_row[li] = text
        out_rows.append(out_row)

    # Merge a sparse row into the previous row when every column it fills
    # is already non-empty there: this is a wrapped second line of the
    # same logical row (e.g. a multi-line header), not a new row.
    merged = []
    for row in out_rows:
        filled = [i for i, c in enumerate(row) if c.strip()]
        if merged and 0 < len(filled) < ncols and filled and all(merged[-1][i].strip() for i in filled):
            for i in filled:
                merged[-1][i] = (merged[-1][i] + " " + row[i]).strip()
        else:
            merged.append(row)
    return merged


def table_to_markdown(tbl):
    rows = build_table_grid(tbl)
    if rows is None:
        try:
            data = tbl.extract()
        except Exception:
            return ""
        if not data:
            return ""
        rows = [[norm_text(str(c)).strip() if c is not None else "" for c in row] for row in data]
    if not rows:
        return ""
    for r in rows:
        r[:] = [c.replace("\n", "<br>") for c in r]
    ncols = max(len(r) for r in rows)
    for r in rows:
        while len(r) < ncols:
            r.append("")
    # Drop rows that ended up fully empty (continuation artifacts).
    rows = [r for r in rows if any(c.strip() for c in r)]
    if not rows:
        return ""
    out = []
    header = rows[0]
    out.append("| " + " | ".join(header) + " |")
    out.append("| " + " | ".join(["---"] * ncols) + " |")
    for r in rows[1:]:
        out.append("| " + " | ".join(r) + " |")
    return "\n".join(out)


def classify_heading(spans, text, x0):
    """Return a markdown prefix/style tag for a heading-like line, or None."""
    if not spans:
        return None
    max_size = max(s["size"] for s in spans)
    all_bold = all(s["bold"] for s in spans if s["text"].strip())
    stripped = text.strip()

    if not stripped:
        return None

    if all_bold and 21.5 <= max_size <= 22.5:
        return "opener-chapter"
    if all_bold and 16.5 <= max_size <= 17.5:
        return "opener-title"
    if all_bold and 16 <= max_size <= 18:
        return "h1"
    if all_bold and 12.5 <= max_size <= 13.5:
        return "h2"
    if all_bold and 11.5 <= max_size <= 12.5 and 100 <= x0 <= 120:
        if SUBSECTION_RE.match(stripped):
            return "h3"
        if len(stripped) <= 60 and not stripped.endswith("."):
            return "h4"
    if all_bold and TABLE_FIG_CAPTION_RE.match(stripped):
        return "caption"
    return None


def process_page(page, page_num, img_dir, img_rel_prefix):
    page_dict = page.get_text("dict")
    page_h = page.rect.height

    try:
        tables = page.find_tables()
        table_list = list(tables.tables) if hasattr(tables, "tables") else list(tables)
    except Exception:
        table_list = []

    table_bboxes = []
    table_md_by_bbox = []
    for tbl in table_list:
        bbox = tbl.bbox
        md = table_to_markdown(tbl)
        if md:
            table_bboxes.append(bbox)
            table_md_by_bbox.append((bbox, md))

    # Collect images and their vertical position (first occurrence on page).
    img_entries = []
    seen_xrefs = set()
    for img_info in page.get_images(full=True):
        xref = img_info[0]
        if xref in seen_xrefs:
            continue
        seen_xrefs.add(xref)
        try:
            rects = page.get_image_rects(xref)
        except Exception:
            rects = []
        y0 = rects[0].y0 if rects else 0
        img_entries.append({"xref": xref, "y0": y0, "rects": rects})

    img_entries.sort(key=lambda e: e["y0"])

    lines_out = []  # list of (y0, kind, content)
    prev_line_bottom = None
    prev_pitch = None
    prev_x0 = None
    paragraph_buf = []
    paragraph_x0 = None

    def flush_paragraph():
        if paragraph_buf:
            text = " ".join(t.strip() for t in paragraph_buf if t.strip())
            text = re.sub(r"\s+", " ", text).strip()
            if text:
                lines_out.append((paragraph_y0, "p", text))
            paragraph_buf.clear()

    paragraph_y0 = None

    # A bullet/numbered marker is often its own line, with the item's text
    # starting on the next (indented) line; both marker-only and
    # marker-plus-text starts accumulate wrapped continuation lines here
    # until the indentation returns to the body margin.
    active_list = {"kind": None, "y0": None, "buf": [], "margin_x0": None}

    def flush_active_list():
        if active_list["kind"] is not None:
            text = " ".join(t.strip() for t in active_list["buf"] if t.strip())
            text = re.sub(r"\s+", " ", text).strip()
            if text:
                lines_out.append((active_list["y0"], active_list["kind"], text))
            active_list["kind"] = None
            active_list["buf"] = []
            active_list["margin_x0"] = None

    for block in page_dict.get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            spans = get_line_spans(line)
            if not spans:
                continue
            bbox = line_bbox_union(line)
            text = line_text(spans)
            if not text:
                continue

            # Drop bare page-number lines (single numeric token near bottom).
            if re.fullmatch(r"\d+", text.strip()) and bbox[1] > 780:
                continue

            # Skip spans that fall inside a detected table bbox.
            if rects_overlap(bbox, table_bboxes):
                continue

            y0 = bbox[1]
            x0 = bbox[0]
            courier = any(s["courier"] for s in spans if s["text"].strip())
            heading_kind = classify_heading(spans, text, x0)

            if heading_kind:
                flush_paragraph()
                flush_active_list()
                lines_out.append((y0, heading_kind, text.strip()))
                prev_line_bottom = bbox[3]
                prev_x0 = x0
                continue

            if courier:
                flush_paragraph()
                flush_active_list()
                lines_out.append((y0, "code", text))
                prev_line_bottom = bbox[3]
                prev_x0 = x0
                continue

            if is_bullet_line(text):
                flush_paragraph()
                flush_active_list()
                cleaned = text.lstrip("".join(BULLET_CHARS)).strip()
                active_list["kind"] = "bullet"
                active_list["y0"] = y0
                active_list["buf"] = [cleaned] if cleaned else []
                active_list["margin_x0"] = x0
                prev_line_bottom = bbox[3]
                prev_x0 = x0
                continue

            if NUM_LIST_RE.match(text) and 115 <= x0 <= 135:
                flush_paragraph()
                flush_active_list()
                m = NUM_LIST_RE.match(text)
                cleaned = text[m.end():].strip()
                active_list["kind"] = "numbered"
                active_list["y0"] = y0
                active_list["buf"] = [cleaned] if cleaned else []
                active_list["margin_x0"] = x0
                prev_line_bottom = bbox[3]
                prev_x0 = x0
                continue

            # A continuation line of the active list item: meaningfully more
            # indented than the body margin (~108pt), i.e. it sits at the
            # 36pt hanging indent rather than back at the paragraph margin.
            if active_list["kind"] is not None and x0 > 115:
                active_list["buf"].append(text)
                prev_line_bottom = bbox[3]
                prev_x0 = x0
                continue

            flush_active_list()

            # Regular body text -> paragraph joining.
            gap = None
            if prev_line_bottom is not None:
                gap = y0 - prev_line_bottom
            pitch = prev_pitch if prev_pitch else 20.7
            new_para = False
            if paragraph_y0 is None:
                new_para = True
            elif gap is not None and gap > 1.15 * pitch:
                new_para = True
            elif prev_x0 is not None and abs(x0 - prev_x0) > 3 and (paragraph_x0 is None or abs(x0 - paragraph_x0) > 3):
                new_para = True

            if new_para:
                flush_paragraph()
                paragraph_y0 = y0
                paragraph_x0 = x0

            paragraph_buf.append(text)
            if gap is not None and gap > 0:
                prev_pitch = gap if gap < 40 else prev_pitch
            prev_line_bottom = bbox[3]
            prev_x0 = x0

    flush_paragraph()
    flush_active_list()

    # Insert table markdown blocks at the right vertical position.
    for bbox, md in table_md_by_bbox:
        lines_out.append((bbox[1], "table", md))

    # Insert image placeholders.
    extracted_images = []
    for entry in img_entries:
        xref = entry["xref"]
        try:
            img_data = page.parent.extract_image(xref)
        except Exception:
            continue
        ext = img_data.get("ext", "png")
        idx = len(extracted_images) + 1
        fname = f"p{page_num}-{idx}.{ext}"
        fpath = os.path.join(img_dir, fname)
        with open(fpath, "wb") as f:
            f.write(img_data["image"])
        extracted_images.append({"xref": xref, "fname": fname, "w": img_data.get("width"), "h": img_data.get("height")})
        lines_out.append((entry["y0"], "image", f"![image p{page_num}-{idx}]({img_rel_prefix}{fname})"))

    lines_out.sort(key=lambda t: t[0])

    md_chunks = []
    skip_next_blank_after_opener = False
    i = 0
    n = len(lines_out)
    while i < n:
        y0, kind, content = lines_out[i]
        if kind == "opener-chapter":
            md_chunks.append("<!-- opener -->")
            md_chunks.append(f"# {content}")
        elif kind == "opener-title":
            md_chunks.append(f"## {content}")
        elif kind == "h1":
            md_chunks.append(f"# {content}")
        elif kind == "h2":
            md_chunks.append(f"## {content}")
        elif kind == "h3":
            md_chunks.append(f"### {content}")
        elif kind == "h4":
            md_chunks.append(f"#### {content}")
        elif kind == "caption":
            md_chunks.append(f"**{content}**")
        elif kind == "code":
            # Group consecutive code lines into one fenced block.
            code_lines = [content]
            j = i + 1
            while j < n and lines_out[j][1] == "code":
                code_lines.append(lines_out[j][2])
                j += 1
            md_chunks.append("```\n" + "\n".join(code_lines) + "\n```")
            i = j - 1
        elif kind == "bullet":
            md_chunks.append(f"- {content}")
        elif kind == "numbered":
            md_chunks.append(f"1. {content}")
        elif kind == "table":
            md_chunks.append(content)
        elif kind == "image":
            md_chunks.append(content)
        else:
            md_chunks.append(content)
        i += 1

    return "\n\n".join(md_chunks), extracted_images


def extract_cover_logo(doc, out_root):
    page = doc[0]
    target_w, target_h = 235, 258
    best = None
    for img_info in page.get_images(full=True):
        xref = img_info[0]
        try:
            rects = page.get_image_rects(xref)
        except Exception:
            rects = []
        for r in rects:
            w, h = r.width, r.height
            score = abs(w - target_w) + abs(h - target_h)
            if best is None or score < best[0]:
                best = (score, xref, w, h)
    if best is None:
        print("WARNING: no cover logo image found on page 1")
        return
    _, xref, w, h = best
    img_data = doc.extract_image(xref)
    brand_dir = os.path.join(out_root, "..", "assets", "brand")
    os.makedirs(brand_dir, exist_ok=True)
    out_path = os.path.join(brand_dir, "college-logo.png")
    ext = img_data.get("ext", "png")
    if ext != "png":
        # Re-encode through pixmap to guarantee PNG output.
        pix = fitz.Pixmap(img_data["image"]) if False else None
        with open(out_path.replace(".png", f".{ext}"), "wb") as f:
            f.write(img_data["image"])
        try:
            pix = fitz.Pixmap(out_path.replace(".png", f".{ext}"))
            pix.save(out_path)
        except Exception as e:
            print(f"WARNING: could not re-encode logo to PNG: {e}")
    else:
        with open(out_path, "wb") as f:
            f.write(img_data["image"])
    print(f"Cover logo saved: {out_path} (source size {w:.0f}x{h:.0f}pt, xref {xref})")


def build_toc_tree(doc):
    toc = doc.get_toc()
    lines = ["## Table of Contents (from doc.get_toc())", ""]
    if not toc:
        lines.append("_No TOC found in document outline._")
    for level, title, page in toc:
        indent = "  " * (level - 1)
        lines.append(f"{indent}- {title} (p.{page})")
    return "\n".join(lines)


def collect_captions(doc):
    # Keyed by (kind, number): a real caption line is "Table 1.1 <Title>"
    # on a single line of its own (space/tab only between the parts, no
    # newline), which rules out in-sentence cross-references such as
    # "...is given in Table\n1.1." that happen to wrap across two lines.
    seen = {}
    fallback = {}
    for pno in range(len(doc)):
        page = doc[pno]
        text = page.get_text()
        for m in re.finditer(r"(Table|Figure)[ \t]+(\d+\.\d+)[ \t]+([A-Z][^\n]*)", text):
            kind, num, rest = m.group(1), m.group(2), m.group(3)
            caption = norm_text(f"{kind} {num} {rest}").strip()
            # Strip a List-of-Tables/Figures dot-leader + page number tail.
            caption = re.sub(r"\s*\.{3,}\s*\d+\s*$", "", caption).strip()
            key = (kind, num)
            is_dot_leader = bool(re.search(r"\.{3,}", m.group(3)))
            target = fallback if is_dot_leader else seen
            if key not in target:
                target[key] = (caption, pno + 1)

    for key, val in fallback.items():
        seen.setdefault(key, val)

    tables_idx = []
    figures_idx = []
    for (kind, num), (caption, pno) in sorted(seen.items(), key=lambda kv: (kv[0][0], [int(x) for x in kv[0][1].split(".")])):
        entry = f"- {caption} (p.{pno})"
        if kind == "Table":
            tables_idx.append(entry)
        else:
            figures_idx.append(entry)
    return tables_idx, figures_idx


STYLE_CONTRACT = """## Style contract (from plan §R2.2, copied verbatim)

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
"""


def main():
    if len(sys.argv) < 3:
        print("usage: convert_sample.py <pdf_path> <out_dir>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    out_dir = sys.argv[2]
    img_dir = os.path.join(out_dir, "images")
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(img_dir, exist_ok=True)

    doc = fitz.open(pdf_path)
    print(f"Opened {pdf_path}: {len(doc)} pages")

    all_pages_md = []
    for pno in range(len(doc)):
        page = doc[pno]
        page_md, imgs = process_page(page, pno + 1, img_dir, "images/")
        all_pages_md.append(f"<!-- page {pno + 1} -->\n\n{page_md}")

    full_md = "\n\n".join(all_pages_md) + "\n"
    report_path = os.path.join(out_dir, "sample-report.md")
    with open(report_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(full_md)
    print(f"Wrote {report_path} ({len(full_md)} chars)")

    toc_tree = build_toc_tree(doc)
    tables_idx, figures_idx = collect_captions(doc)

    structure_parts = [
        "# Sample report structure\n",
        toc_tree,
        "",
        "## Tables",
        "\n".join(tables_idx) if tables_idx else "_None found._",
        "",
        "## Figures",
        "\n".join(figures_idx) if figures_idx else "_None found._",
        "",
        STYLE_CONTRACT,
    ]
    structure_path = os.path.join(out_dir, "sample-structure.md")
    with open(structure_path, "w", encoding="utf-8", newline="\n") as f:
        f.write("\n".join(structure_parts))
    print(f"Wrote {structure_path}")

    extract_cover_logo(doc, out_dir)

    doc.close()


if __name__ == "__main__":
    main()
