import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import MarkdownIt from "markdown-it";
import puppeteer from "puppeteer-core";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = join(ROOT, "..");
const DIST = join(ROOT, "dist");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PY = "C:/Users/harsh/AppData/Local/Programs/Python/Python312/python.exe";
const FINAL = join(REPO, "Loan_Default_Risk_Predictor_STR_Report.pdf");
mkdirSync(DIST, { recursive: true });

const md = new MarkdownIt({ html: true, linkify: false, typographer: false });
const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const strip = (s) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

function render(pages) {
  const src = readdirSync(join(ROOT, "src")).filter((f) => f.endsWith(".md")).sort()
    .map((f) => readFileSync(join(ROOT, "src", f), "utf8")).join("\n\n");
  let html = md.render(src);
  const targets = [];

  html = html.replace(/<p><img src="([^"]+)" alt="([^"]*)"\s*\/?><\/p>/g, (_, src, alt) => {
    const m = alt.match(/^Figure\s+([A-Z]?-?[\d.]+)/i);
    const id = m ? `fig-${slug(m[1])}` : `fig-${targets.length}`;
    targets.push({ id, kind: "figure", text: strip(alt) });
    return `<figure id="${id}"><img src="${src}" alt="${alt}"><figcaption>${alt}</figcaption></figure>`;
  });

  html = html.replace(/<p class="table-caption">([\s\S]*?)<\/p>/g, (_, cap) => {
    const m = strip(cap).match(/^Table\s+([A-Z]?-?[\d.]+)/i);
    const id = m ? `tab-${slug(m[1])}` : `tab-${targets.length}`;
    targets.push({ id, kind: "table", text: strip(cap) });
    return `<p class="table-caption" id="${id}">${cap}</p>`;
  });

  html = html.replace(/<h([12])>([\s\S]*?)<\/h\1>/g, (_, lvl, inner) => {
    const id = `h-${slug(inner)}`;
    targets.push({ id, kind: `h${lvl}`, text: strip(inner) });
    return `<h${lvl} id="${id}">${inner}</h${lvl}>`;
  });

  const posOf = (t) => html.indexOf(`id="${t.id}"`);
  const ordered = [...targets].sort((a, b) => posOf(a) - posOf(b));
  const pg = (id) => (pages && pages[id] != null ? String(pages[id]) : "00");
  const line = (cls, label, id) =>
    `<p class="toc-line ${cls}"><span class="t">${label}</span><span class="dots"></span><span class="pg">${pg(id)}</span></p>`;
  const caption = (text) => text.replace(/^(Figure|Table)\s+(\S+)\s+/, (_, k, n) => `${k} ${n}   `);

  const toc = ordered.filter((t) => t.kind === "h1" || t.kind === "h2")
    .map((t) => line(t.kind === "h1" ? "lvl-1" : "lvl-2", t.text, t.id)).join("");
  const lof = ordered.filter((t) => t.kind === "figure").map((t) => line("lof-line", caption(t.text), t.id)).join("");
  const lot = ordered.filter((t) => t.kind === "table").map((t) => line("lot-line", caption(t.text), t.id)).join("");

  html = html.replace('<div class="toc"></div>', `<div class="toc">${toc}</div>`)
    .replace('<div class="lof"></div>', `<div class="lof">${lof}</div>`)
    .replace('<div class="lot"></div>', `<div class="lot">${lot}</div>`);

  const doc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Loan Default Risk Predictor: Summer Training Report</title><link rel="stylesheet" href="../styles/report.css"></head><body>${html}</body></html>`;
  writeFileSync(join(DIST, "report.html"), doc);
  writeFileSync(join(DIST, "targets.json"), JSON.stringify(ordered, null, 1));
}

async function print(out) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--allow-file-access-from-files"] });
  const page = await browser.newPage();
  await page.goto(pathToFileURL(join(DIST, "report.html")).href, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false, outline: true, tagged: true });
  await browser.close();
}

const py = (...args) => execFileSync(PY, ["-I", ...args], { stdio: "inherit" });

render(null);
await print(join(DIST, "pass1.pdf"));
py(join(ROOT, "scripts", "paginate.py"), join(DIST, "pass1.pdf"), join(DIST, "targets.json"), join(DIST, "pages.json"));
const info = JSON.parse(readFileSync(join(DIST, "pages.json"), "utf8"));
render(info.pages);
await print(join(DIST, "pass2.pdf"));
py(join(ROOT, "scripts", "paginate.py"), join(DIST, "pass2.pdf"), join(DIST, "targets.json"), join(DIST, "pages2.json"));
const info2 = JSON.parse(readFileSync(join(DIST, "pages2.json"), "utf8"));
if (JSON.stringify(info2.pages) !== JSON.stringify(info.pages)) {
  render(info2.pages);
  await print(join(DIST, "pass2.pdf"));
  py(join(ROOT, "scripts", "paginate.py"), join(DIST, "pass2.pdf"), join(DIST, "targets.json"), join(DIST, "pages2.json"));
}
py(join(ROOT, "scripts", "stamp.py"), join(DIST, "pass2.pdf"), join(DIST, "pages2.json"), FINAL);
py(join(ROOT, "scripts", "merge-report-cover.py"));
if (existsSync(FINAL)) copyFileSync(FINAL, join(DIST, "report.pdf"));
console.log("Wrote", FINAL);
