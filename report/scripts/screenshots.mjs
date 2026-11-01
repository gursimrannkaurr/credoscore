// Captures the ~16 report screenshots from the live Next.js site.
// Both dev servers (next dev on :3000, ml/dev_server.py on :8001/:8002) must
// already be running, see AGENTS.md / the execution plan's global rules.

import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../assets/screens");
const CHROME_PATH = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE_URL = "http://localhost:3000";

await mkdir(OUT_DIR, { recursive: true });

function outPath(name) {
  return path.join(OUT_DIR, `${name}.png`);
}

async function withTheme(page, theme) {
  await page.evaluateOnNewDocument((t) => {
    try {
      localStorage.setItem("theme", t);
    } catch {}
  }, theme);
}

async function clickByText(page, text) {
  const [handle] = await page.$$(`::-p-text(${text})`);
  if (!handle) throw new Error(`No element with text "${text}"`);
  await handle.click();
  return handle;
}

async function shotElement(page, selector, name, opts = {}) {
  const el = await page.waitForSelector(selector, { timeout: 15000 });
  if (!el) throw new Error(`Selector not found: ${selector}`);
  await el.screenshot({ path: outPath(name), ...opts });
  console.log(`  ok: ${name}.png`);
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: null,
    args: ["--force-color-profile=srgb", "--hide-scrollbars"],
  });

  const results = [];
  async function attempt(label, fn) {
    try {
      await fn();
      results.push([label, "ok"]);
    } catch (err) {
      results.push([label, `FAILED: ${err.message}`]);
      console.error(`  FAIL: ${label}: ${err.message}`);
    }
  }

  // ---- Light-theme pages -------------------------------------------------
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 2 });
  await withTheme(page, "light");

  await attempt("a1-landing-hero", async () => {
    await page.goto(BASE_URL, { waitUntil: "networkidle0" });
    await shotElement(page, "main", "a1-landing-hero", { clip: { x: 0, y: 0, width: 1366, height: 768 } });
  });

  await attempt("a2-landing-full", async () => {
    await page.goto(BASE_URL, { waitUntil: "networkidle0" });
    const buffer = await page.screenshot({ fullPage: true });
    // Crop to 2400px tall via a second screenshot pass at a fixed clip.
    await page.screenshot({
      path: outPath("a2-landing-full"),
      clip: { x: 0, y: 0, width: 1366, height: Math.min(2400, (await page.evaluate(() => document.body.scrollHeight))) },
    });
    void buffer;
  });

  await attempt("a3-assess-empty", async () => {
    await page.goto(`${BASE_URL}/assess`, { waitUntil: "networkidle0" });
    await shotElement(page, "main", "a3-assess-empty");
  });

  await attempt("a4-assess-strong-form", async () => {
    await page.goto(`${BASE_URL}/assess`, { waitUntil: "networkidle0" });
    await clickByText(page, "Strong file");
    await new Promise((r) => setTimeout(r, 300));
    await shotElement(page, "form", "a4-assess-strong-form");
  });

  await attempt("a5-assess-validation-error", async () => {
    await page.goto(`${BASE_URL}/assess`, { waitUntil: "networkidle0" });
    await clickByText(page, "Strong file");
    await page.click("#age", { clickCount: 3 });
    await page.keyboard.press("Backspace");
    await page.click('button[type="submit"]');
    await new Promise((r) => setTimeout(r, 500));
    await shotElement(page, "form", "a5-assess-validation-error");
  });

  await attempt("a6-assess-low-risk", async () => {
    await page.goto(`${BASE_URL}/assess`, { waitUntil: "networkidle0" });
    await clickByText(page, "Strong file");
    await page.click('button[type="submit"]');
    await page.waitForSelector('[aria-live="polite"] article', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 500));
    await shotElement(page, '[aria-live="polite"]', "a6-assess-low-risk");
  });

  await attempt("a7-assess-high-risk", async () => {
    await page.goto(`${BASE_URL}/assess`, { waitUntil: "networkidle0" });
    await clickByText(page, "Stretched file");
    await page.click('button[type="submit"]');
    await page.waitForSelector('[aria-live="polite"] article', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 500));
    await shotElement(page, '[aria-live="polite"]', "a7-assess-high-risk");
  });

  await attempt("a8-waterfall-closeup", async () => {
    await page.goto(`${BASE_URL}/assess`, { waitUntil: "networkidle0" });
    await clickByText(page, "Stretched file");
    await page.click('button[type="submit"]');
    await page.waitForSelector('[aria-live="polite"] article', { timeout: 15000 });
    await new Promise((r) => setTimeout(r, 500));
    await shotElement(page, 'section[aria-labelledby="drivers-title"]', "a8-waterfall-closeup");
  });

  await attempt("a9-cutoff-whatif-40", async () => {
    await page.goto(`${BASE_URL}/assess`, { waitUntil: "networkidle0" });
    await clickByText(page, "Stretched file");
    await page.click('button[type="submit"]');
    await page.waitForSelector('[aria-live="polite"] article', { timeout: 15000 });
    const slider = await page.waitForSelector('[aria-label="Approval cutoff"]');
    await slider.focus();
    // Default cutoff 0.25 -> 0.40 at step 0.01: 15 presses.
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("ArrowRight");
    }
    await new Promise((r) => setTimeout(r, 300));
    const container = await page.evaluateHandle((el) => el.closest("div.rounded-xl"), slider);
    await container.asElement().screenshot({ path: outPath("a9-cutoff-whatif-40") });
    console.log("  ok: a9-cutoff-whatif-40.png");
  });

  await attempt("a10-portfolio-bands-cutoff", async () => {
    await page.goto(`${BASE_URL}/portfolio`, { waitUntil: "networkidle0" });
    const sections = await page.$$("section");
    if (sections.length < 2) throw new Error("expected at least 2 portfolio sections");
    await sections[0].screenshot({ path: outPath("a10a-portfolio-bands") });
    await sections[1].screenshot({ path: outPath("a10-portfolio-bands-cutoff") });
    console.log("  ok: a10-portfolio-bands-cutoff.png");
  });

  await attempt("a11-portfolio-deciles", async () => {
    await page.goto(`${BASE_URL}/portfolio`, { waitUntil: "networkidle0" });
    const sections = await page.$$("section");
    if (sections.length < 3) throw new Error("expected at least 3 portfolio sections");
    await sections[2].screenshot({ path: outPath("a11-portfolio-deciles") });
    console.log("  ok: a11-portfolio-deciles.png");
  });

  await attempt("a12-portfolio-segments", async () => {
    await page.goto(`${BASE_URL}/portfolio`, { waitUntil: "networkidle0" });
    const sections = await page.$$("section");
    if (sections.length < 4) throw new Error("expected at least 4 portfolio sections");
    await sections[3].screenshot({ path: outPath("a12-portfolio-segments") });
    console.log("  ok: a12-portfolio-segments.png");
  });

  await attempt("a13-model-benchmark", async () => {
    await page.goto(`${BASE_URL}/model#benchmark`, { waitUntil: "networkidle0" });
    await shotElement(page, "#benchmark", "a13-model-benchmark");
  });

  await attempt("a14-model-calibration", async () => {
    await page.goto(`${BASE_URL}/model#calibration`, { waitUntil: "networkidle0" });
    await shotElement(page, "#calibration", "a14-model-calibration");
  });

  await attempt("a15-model-limitations", async () => {
    await page.goto(`${BASE_URL}/model#limitations`, { waitUntil: "networkidle0" });
    await shotElement(page, "#limitations", "a15-model-limitations");
  });

  await page.close();

  // ---- Mobile viewport ----------------------------------------------------
  await attempt("a16-mobile-assess", async () => {
    const mp = await browser.newPage();
    await mp.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await withTheme(mp, "light");
    await mp.goto(`${BASE_URL}/assess`, { waitUntil: "networkidle0" });
    await mp.screenshot({ path: outPath("a16-mobile-assess") });
    await mp.close();
    console.log("  ok: a16-mobile-assess.png");
  });

  // ---- Dark mode ------------------------------------------------------------
  await attempt("a17-dark-landing-hero", async () => {
    const dp = await browser.newPage();
    await dp.setViewport({ width: 1366, height: 768, deviceScaleFactor: 2 });
    await withTheme(dp, "dark");
    await dp.goto(BASE_URL, { waitUntil: "networkidle0" });
    await dp.screenshot({ path: outPath("a17-dark-landing-hero"), clip: { x: 0, y: 0, width: 1366, height: 768 } });
    await dp.close();
    console.log("  ok: a17-dark-landing-hero.png");
  });

  await browser.close();

  console.log("\nSummary:");
  for (const [label, status] of results) console.log(`  ${status === "ok" ? "OK  " : "FAIL"}  ${label}${status !== "ok" ? ", " + status : ""}`);
  const failed = results.filter(([, s]) => s !== "ok");
  if (failed.length) {
    console.error(`\n${failed.length} of ${results.length} shots failed.`);
    process.exitCode = 1;
  }
}

run();
