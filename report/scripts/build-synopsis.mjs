import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import MarkdownIt from "markdown-it";
import puppeteer from "puppeteer-core";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = join(ROOT, "..");
const DIST = join(ROOT, "dist");
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const FINAL = join(REPO, "Loan_Default_Risk_Predictor_Synopsis.pdf");
mkdirSync(DIST, { recursive: true });

const md = new MarkdownIt({ html: true, linkify: false, typographer: false });

function render() {
  const src = readFileSync(join(ROOT, "synopsis", "synopsis.md"), "utf8");
  const html = md.render(src);
  const doc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Loan Default Risk Predictor — Synopsis Report</title><link rel="stylesheet" href="../styles/synopsis.css"></head><body>${html}</body></html>`;
  writeFileSync(join(DIST, "synopsis.html"), doc);
}

async function print(out) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--allow-file-access-from-files"] });
  const page = await browser.newPage();
  await page.goto(pathToFileURL(join(DIST, "synopsis.html")).href, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false, outline: true, tagged: true });
  await browser.close();
}

render();
await print(FINAL);
copyFileSync(FINAL, join(DIST, "synopsis.pdf"));
console.log("Wrote", FINAL);
