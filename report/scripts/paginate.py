import json
import sys
import re

import pymupdf

raw, targets_path, out = sys.argv[1:4]
doc = pymupdf.open(raw)
targets = json.load(open(targets_path, encoding="utf-8"))
norm = lambda s: " ".join(s.replace(" ", " ").replace("’", "'").split()).lower()
texts = [norm(p.get_text()) for p in doc]

kinds, started = [], False
for t in texts:
    if re.match(r"chapter \d+:", t):
        kinds.append("body"); started = True
    elif t.startswith("chapter ") and "learning objectives" in t and len(t) < 1200:
        kinds.append("opener"); started = True
    elif not started:
        kinds.append("front")
    else:
        kinds.append("body")

numbers, n = {}, 0
for i, k in enumerate(kinds):
    if k == "body":
        n += 1
        numbers[i] = n

pages, cursor = {}, 0
for t in targets:
    needle = norm(t["text"])
    found = None
    for i in range(cursor, len(texts)):
        if kinds[i] == "body" and needle in texts[i]:
            found = i
            break
    if found is None:
        print("NOT FOUND:", t["id"], t["text"][:70])
        pages[t["id"]] = None
    else:
        pages[t["id"]] = numbers[found]
        cursor = found

json.dump({"kinds": kinds, "numbers": {str(k): v for k, v in numbers.items()}, "pages": pages, "page_count": len(doc)}, open(out, "w"), indent=1)
print(f"{len(doc)} pages: {kinds.count('front')} front, {kinds.count('opener')} openers, {n} numbered body pages")
