// Renders each report/diagrams/*.mmd to a black-and-white PNG via mermaid
// (loaded from node_modules) inside a blank puppeteer page.

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIAGRAMS_DIR = path.join(ROOT, "diagrams");
const OUT_DIR = path.resolve(ROOT, "assets/figures");
const MERMAID_JS = path.resolve(ROOT, "node_modules/mermaid/dist/mermaid.min.js");
const CHROME_PATH = "C:/Program Files/Google/Chrome/Application/chrome.exe";

await mkdir(OUT_DIR, { recursive: true });

const mermaidSource = await readFile(MERMAID_JS, "utf-8");

async function run() {
  const files = (await readdir(DIAGRAMS_DIR)).filter((f) => f.endsWith(".mmd")).sort();
  if (!files.length) {
    console.error("No .mmd files found in", DIAGRAMS_DIR);
    process.exitCode = 1;
    return;
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--force-color-profile=srgb"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 3 });
  await page.setContent("<!doctype html><html><body></body></html>");
  await page.addScriptTag({ content: mermaidSource });
  await page.evaluate(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      themeVariables: {
        fontFamily: "Times New Roman",
        fontSize: "16px",
        primaryColor: "#EEF2F8",
        primaryBorderColor: "#444444",
        primaryTextColor: "#111111",
        lineColor: "#444444",
        secondaryColor: "#FFF5DC",
        tertiaryColor: "#F2F2F2",
        background: "#ffffff",
        mainBkg: "#EEF2F8",
        clusterBkg: "#FAFAFA",
        clusterBorder: "#999999",
        actorBkg: "#EEF2F8",
        actorBorder: "#444444",
        actorTextColor: "#111111",
        signalColor: "#444444",
        signalTextColor: "#111111",
        // Gantt-specific pastel section/task colours (fig-2-1-gantt.mmd has
        // no per-task classDef support, so it relies on these directly).
        sectionBkgColor: "#DCE6F1",
        sectionBkgColor2: "#FDE9D9",
        altSectionBkgColor: "#E2EFDA",
        taskBkgColor: "#DCE6F1",
        taskBorderColor: "#2F5597",
        taskTextColor: "#1F1F1F",
        activeTaskBkgColor: "#FDE9D9",
        activeTaskBorderColor: "#C55A11",
        gridColor: "#BFBFBF",
        todayLineColor: "#C55A11",
      },
      flowchart: { htmlLabels: false, curve: "linear", nodeSpacing: 22, rankSpacing: 30, padding: 10 },
      er: { entityPadding: 12, nodeSpacing: 30, rankSpacing: 35 },
      sequence: { actorMargin: 25, messageMargin: 20, diagramMarginX: 10, diagramMarginY: 10, useMaxWidth: false },
    });
  });

  const results = [];

  for (const file of files) {
    const name = file.replace(/\.mmd$/, "");
    const source = await readFile(path.join(DIAGRAMS_DIR, file), "utf-8");
    try {
      const svg = await page.evaluate(async (src, id) => {
        const { svg } = await mermaid.render(id, src);
        return svg;
      }, source, `graph-${name.replace(/[^a-z0-9]/gi, "")}`);

      await page.evaluate((svgMarkup) => {
        document.body.innerHTML = "";
        const div = document.createElement("div");
        div.id = "render-target";
        div.style.background = "#ffffff";
        div.style.padding = "16px";
        div.style.display = "inline-block";
        div.innerHTML = svgMarkup;
        document.body.appendChild(div);
      }, svg);

      const target = await page.waitForSelector("#render-target");
      const outPath = path.join(OUT_DIR, `${name}.png`);
      await target.screenshot({ path: outPath });
      results.push([name, "ok"]);
      console.log(`  ok: ${name}.png`);
    } catch (err) {
      results.push([name, `FAILED: ${err.message}`]);
      console.error(`  FAIL: ${name}: ${err.message}`);
    }
  }

  await browser.close();

  console.log("\nSummary:");
  for (const [name, status] of results) console.log(`  ${status === "ok" ? "OK  " : "FAIL"}  ${name}`);
  const failed = results.filter(([, s]) => s !== "ok");
  if (failed.length) {
    console.error(`\n${failed.length} of ${results.length} diagrams failed.`);
    process.exitCode = 1;
  }
}

run();
