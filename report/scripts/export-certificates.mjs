import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export async function exportCertificates() {
  const source = readFileSync(path.join(ROOT, 'dist/institute-certificate.html'), 'utf8');
  const browser = await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true, args:['--allow-file-access-from-files']});
  try {
    for (const withHod of [true, false]) {
      let block = 0;
      const html = withHod ? source : source.replace(/<div class="certificate-signature">[\s\S]*?<\/div>/g,
        match => ++block === 1 ? match : '');
      if (!withHod && block !== 2) throw new Error('Expected mentor and HOD signature blocks');
      const suffix = withHod ? 'With_HOD' : 'Without_HOD';
      const input = path.join(ROOT, `dist/institute-certificate-${suffix}.html`);
      const output = path.join(ROOT, '..', `Loan_Default_Risk_Predictor_Institute_Certificate_${suffix}.pdf`);
      writeFileSync(input, html);
      const page = await browser.newPage();
      await page.goto(pathToFileURL(input).href, {waitUntil:'networkidle0'});
      await page.evaluate(()=>document.fonts.ready);
      await page.pdf({path:output, preferCSSPageSize:true, printBackground:true, displayHeaderFooter:false, tagged:true});
      await page.close();
      if (withHod) copyFileSync(output, path.join(ROOT, '..', 'Loan_Default_Risk_Predictor_Institute_Certificate.pdf'));
      console.log('Wrote', output);
    }
  } finally { await browser.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await exportCertificates();
