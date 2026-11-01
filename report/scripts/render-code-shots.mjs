// Renders syntax-highlighted, line-numbered, dark "VS Code"-style code
// screenshots for the report's in-chapter code figures. Mirrors the launch
// pattern of render-diagrams.mjs: puppeteer-core driving the system Chrome
// install (no Chromium download), screenshotting one cropped element rather
// than the full page.
//
// Usage: node report/scripts/render-code-shots.mjs
//
// Each entry below is {id, lang, code, caption}. `caption` is NOT baked into
// the image — it is metadata only, echoed to the console so a later wave can
// copy it into the report Markdown as an ordinary "Figure N.N: ..." caption
// below the <id>.png image, matching the report's existing convention.
//
// The real production list of entries (drawn from api/predict.py,
// api/predict-compare.py, lib/api.ts, etc.) is filled in by a later wave.
// The entries below are 3 real, working examples that prove the pipeline
// end-to-end.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import puppeteer from "puppeteer-core";
import hljs from "highlight.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.resolve(ROOT, "assets/code");
const CHROME_PATH = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const HLJS_THEME_CSS = path.resolve(ROOT, "node_modules/highlight.js/styles/atom-one-dark.min.css");

// ---------------------------------------------------------------------------
// Production entries: real, working snippets pulled directly from the live
// project (api/predict.py, components/assess/assess-form.tsx). `caption` is
// copied verbatim into the corresponding "Figure N.N: ..." in the Markdown,
// so keep the two in sync if either changes.
// ---------------------------------------------------------------------------
const ENTRIES = [
  {
    id: "score-tree-walk",
    lang: "python",
    caption: "Figure 3.16: score() — walking the tree ensemble to accumulate the raw margin and its factor contributions",
    code: `def score(vector: list[float], model: dict[str, Any]) -> tuple[float, dict[str, float]]:
    # sklearn routes a tie left on "<="; XGBoost's histogram splitter places
    # thresholds exactly on real values, so it needs a strict "<" instead.
    strict_less = model.get("model_type") == "xgboost"
    contributions: dict[int, float] = {}
    raw = model["base_value"]

    for tree in model["trees"]:
        node = 0
        attributed_value = 0.0
        while tree["left"][node] != -1:
            feature_idx = tree["feature"][node]
            threshold = tree["threshold"][node]
            go_left = (
                vector[feature_idx] < threshold
                if strict_less
                else vector[feature_idx] <= threshold
            )
            next_node = tree["left"][node] if go_left else tree["right"][node]
            next_value = tree["value"][next_node]

            delta = (next_value - attributed_value) * model["learning_rate"]
            contributions[feature_idx] = contributions.get(feature_idx, 0.0) + delta

            node = next_node
            attributed_value = next_value

        raw += attributed_value * model["learning_rate"]

    return raw, contributions`,
  },
  {
    id: "decision-rule",
    lang: "python",
    caption: "Figure 3.17: decision_for() and score_to_display() — the cutoff rule and the 300-850 score mapping",
    code: `def decision_for(probability: float, cutoff: float) -> str:
    if probability < cutoff * 0.6:
        return "approve"
    if probability < cutoff:
        return "approve_with_conditions"
    if probability < cutoff * 1.6:
        return "refer_for_review"
    return "decline"


def score_to_display(probability: float) -> int:
    # Maps [0, 1] probability of default onto a familiar 300-850 band,
    # inverted so a lower default probability yields a higher score.
    return round(850 - probability * (850 - 300))`,
  },
  {
    id: "score-forest",
    lang: "python",
    caption: "Figure 3.19: score_forest() — averaging leaf probabilities across 300 trees instead of additive boosting",
    code: `def score_forest(vector: list[float], model: dict[str, Any]) -> tuple[float, dict[str, float]]:
    """Returns (mean_probability, {}) for a Random Forest artifact.

    No learning rate, no accumulation across the nodes on a path -- only
    the leaf each tree lands on matters, and the result is the mean of
    those leaf values across all trees. Random Forest gets no driver
    breakdown in this phase, by design.
    """
    total = 0.0
    trees = model["trees"]

    for tree in trees:
        node = 0
        while tree["left"][node] != -1:
            feature_idx = tree["feature"][node]
            threshold = tree["threshold"][node]
            go_left = vector[feature_idx] <= threshold
            node = tree["left"][node] if go_left else tree["right"][node]
        total += tree["value"][node]

    return total / len(trees), {}`,
  },
  {
    id: "synopsis-frontend-validate",
    lang: "typescript",
    caption: "components/assess/assess-form.tsx — client-side field validation before a request is sent to the scoring API",
    code: `function validate(form: FormState): Errors {
  const errors: Errors = {};
  for (const f of NUMERIC_FIELDS) {
    const raw = form[f].trim();
    const { min, max } = BOUNDS[f];
    if (raw === "") errors[f] = "Required.";
    else if (!Number.isFinite(Number(raw))) errors[f] = "Enter a number.";
    else if (Number(raw) < min || Number(raw) > max)
      errors[f] = \`Enter a value from \${min} to \${max}.\`;
  }
  if (!errors.loan_amount && !errors.duration_months && !errors.monthly_income) {
    const instalment = Number(form.loan_amount) / Number(form.duration_months);
    if (instalment > 4 * Number(form.monthly_income)) {
      errors.loan_amount = "The monthly instalment can't be more than four times monthly income.";
    }
  }
  return errors;
}`,
  },
  {
    id: "synopsis-backend-validate",
    lang: "python",
    caption: "api/predict.py — server-side validation of the twelve required fields before the model is scored",
    code: `for field in model["numeric_features"]:
    if field not in payload:
        raise ValidationError(field, f"'{field}' is required.")
    raw = payload[field]
    if isinstance(raw, bool) or not isinstance(raw, (int, float)):
        raise ValidationError(field, f"'{field}' must be a number.")
    value = float(raw)
    if math.isnan(value) or math.isinf(value):
        raise ValidationError(field, f"'{field}' must be a finite number.")
    lo, hi = NUMERIC_BOUNDS.get(field, (float("-inf"), float("inf")))
    if value < lo or value > hi:
        raise ValidationError(field, f"'{field}' must be between {lo} and {hi}.")
    cleaned[field] = value`,
  },
];

// ---------------------------------------------------------------------------
// Split a highlight.js HTML string into per-line HTML strings, keeping each
// line's <span> tags balanced (closing any still-open span at end of line,
// reopening the same spans at the start of the next line). hljs only ever
// emits <span class="..."> ... </span> wrappers, so this only needs to track
// those.
// ---------------------------------------------------------------------------
function splitHighlightedHtml(html) {
  const lines = [];
  let current = "";
  const openTags = [];
  let i = 0;
  while (i < html.length) {
    const ch = html[i];
    if (ch === "<") {
      const close = html.indexOf(">", i);
      const tag = html.slice(i, close + 1);
      if (tag.startsWith("</")) {
        openTags.pop();
      } else if (tag.startsWith("<span")) {
        openTags.push(tag);
      }
      current += tag;
      i = close + 1;
    } else if (ch === "\n") {
      for (let k = openTags.length - 1; k >= 0; k--) current += "</span>";
      lines.push(current);
      current = openTags.join("");
      i++;
    } else {
      current += ch;
      i++;
    }
  }
  lines.push(current);
  return lines;
}

function buildLinesHtml(code, lang) {
  const { value: highlighted } = hljs.highlight(code, { language: lang, ignoreIllegals: true });
  const lines = splitHighlightedHtml(highlighted);
  return lines
    .map((lineHtml, idx) => {
      const n = idx + 1;
      return `<div class="line"><span class="ln">${n}</span><span class="lc">${lineHtml || " "}</span></div>`;
    })
    .join("");
}

async function run() {
  await mkdir(OUT_DIR, { recursive: true });
  const hljsCss = await readFile(HLJS_THEME_CSS, "utf-8");

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--force-color-profile=srgb"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 3 });

  const baseCss = `
    * { box-sizing: border-box; }
    body { margin: 0; background: #ffffff; }
    #code-block {
      display: inline-block;
      background: #1e1e1e;
      font-family: "Consolas", "SFMono-Regular", Menlo, Monaco, monospace;
      font-size: 14px;
      line-height: 20px;
      border-radius: 6px;
      overflow: hidden;
      padding: 10px 0;
    }
    #code-block .line { display: flex; white-space: pre; }
    #code-block .ln {
      flex: 0 0 auto;
      min-width: 2.75em;
      text-align: right;
      color: #858585;
      background: #252526;
      padding: 0 12px;
      user-select: none;
    }
    #code-block .lc {
      flex: 1 1 auto;
      color: #d4d4d4;
      padding: 0 20px 0 16px;
      white-space: pre;
    }
  `;

  await page.setContent(`<!doctype html><html><head><style>${hljsCss}\n${baseCss}</style></head><body></body></html>`);

  const results = [];
  for (const entry of ENTRIES) {
    try {
      const linesHtml = buildLinesHtml(entry.code, entry.lang);
      await page.evaluate((html) => {
        document.body.innerHTML = `<div id="code-block">${html}</div>`;
      }, linesHtml);

      const target = await page.waitForSelector("#code-block");
      const outPath = path.join(OUT_DIR, `${entry.id}.png`);
      await target.screenshot({ path: outPath });
      results.push([entry.id, "ok", entry.caption]);
      console.log(`  ok: ${entry.id}.png  (${entry.caption})`);
    } catch (err) {
      results.push([entry.id, `FAILED: ${err.message}`, entry.caption]);
      console.error(`  FAIL: ${entry.id}: ${err.message}`);
    }
  }

  await browser.close();

  console.log("\nSummary:");
  for (const [id, status] of results) console.log(`  ${status === "ok" ? "OK  " : "FAIL"}  ${id}`);
  const failed = results.filter(([, s]) => s !== "ok");
  if (failed.length) {
    console.error(`\n${failed.length} of ${results.length} code shots failed.`);
    process.exitCode = 1;
  }
}

run();
