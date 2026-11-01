import puppeteer from 'puppeteer-core';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO=path.resolve(ROOT,'..');
mkdirSync(path.join(ROOT,'dist'),{recursive:true});
const raw=path.join(ROOT,'dist/viva-full-pages.pdf');
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try {
  const page=await browser.newPage();
  await page.setViewport({width:711,height:1050});
  await page.goto(pathToFileURL(path.join(ROOT,'onepager/onepager.html')).href,{waitUntil:'networkidle0'});
  await page.emulateMediaType('print');
  await page.evaluate(()=>document.fonts.ready);
  const heights=await page.evaluate(()=>[...document.querySelectorAll('.sheet')].map(e=>e.getBoundingClientRect().height*.75));
  if(heights.length!==3 || heights[0]>788 || heights[1]>788 || heights[2]>365) throw new Error('Viva guide exceeds two and a half pages: '+heights);
  await page.pdf({path:raw,preferCSSPageSize:true,printBackground:true,tagged:true});
} finally {await browser.close();}

// Preserve text/vector quality and make the third sheet physically half A4.
execFileSync('C:/Users/harsh/AppData/Local/Programs/Python/Python312/python.exe',['-I','-c',`
import pymupdf as f,shutil
from pathlib import Path
root=Path(${JSON.stringify(REPO)})
source=f.open(root/'report/dist/viva-full-pages.pdf')
assert len(source)==3
assert max(b[3] for b in source[2].get_text('blocks')) < source[2].rect.height/2
out=f.open()
out.insert_pdf(source,from_page=0,to_page=1)
r=source[2].rect
half=f.Rect(0,0,r.width,r.height/2)
last=out.new_page(width=half.width,height=half.height)
last.show_pdf_page(half,source,2,clip=half)
out.set_metadata({'title':'CredoScore - Beginner Viva Guide','author':'Gursimran Kaur','subject':'Three-model project explanation and viva preparation'})
target=root/'CredoScore_Viva_Guide.pdf'
out.save(target,garbage=3,deflate=True)
out.close();source.close()
shutil.copyfile(target,root/'CredoScore_One_Pager.pdf')
print('Wrote',target,'- two A4 pages plus one half-A4 page')
`],{stdio:'inherit'});
