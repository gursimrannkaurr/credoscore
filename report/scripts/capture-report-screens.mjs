// Fresh browser captures for the report. Never reads or copies old screenshots.
import puppeteer from 'puppeteer-core';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets/screens/fresh');
const BASE = 'https://credoscore-gk.vercel.app';
await mkdir(OUT, {recursive:true});
const browser = await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--force-color-profile=srgb','--hide-scrollbars']});
const page = await browser.newPage();
await page.setViewport({width:760,height:1050,deviceScaleFactor:3});
await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
await page.evaluateOnNewDocument(()=>localStorage.setItem('theme','light'));
const manifest=[];
async function settle(){await page.evaluate(()=>document.fonts.ready);await new Promise(r=>setTimeout(r,450));}
async function go(route){await page.goto(BASE+route,{waitUntil:'networkidle0'});await settle();}
async function click(text){
  const hit=await page.evaluate(text=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===text);b?.click();return !!b;},text);
  if(!hit)throw new Error(`Missing button: ${text}`);await settle();
}
async function rect(selector,index=0){
  return page.evaluate((selector,index)=>{const e=document.querySelectorAll(selector)[index];if(!e)throw new Error(selector);const r=e.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height};},selector,index);
}
async function capture(name,clip,state){
  await page.evaluate(y=>window.scrollTo(0,Math.max(0,y-110)),clip.y);await settle();
  const buffer=await page.screenshot({type:'png',clip,captureBeyondViewport:true});
  await writeFile(path.join(OUT,name+'.png'),buffer);
  manifest.push({name,url:page.url(),state,capturedAt:new Date().toISOString(),cssDimensions:{width:clip.width,height:clip.height},scale:3,sha256:createHash('sha256').update(buffer).digest('hex')});
  console.log('Captured',name,Math.round(clip.width)+'x'+Math.round(clip.height));
}
async function element(selector,name,state,index=0){await capture(name,await rect(selector,index),state);}
try {
  await go('/assess');
  let form=await rect('form'),first=await rect('fieldset',0);
  await capture('01-applicant-input',{...form,height:first.y+first.height-form.y+16},'Initial applicant fields and preset controls');
  await click('Strong file');
  form=await rect('form');let loan=await rect('fieldset',1);
  await capture('02-sample-loan',{x:form.x,y:loan.y-12,width:form.width,height:loan.height+24},'Strong sample: loan fields');
  const credit=await rect('fieldset',2);
  await capture('02b-sample-credit',{x:form.x,y:credit.y-12,width:form.width,height:form.y+form.height-credit.y+12},'Strong sample: credit fields and submit button');
  await page.click('#age',{clickCount:3});await page.keyboard.press('Backspace');await page.click('button[type=submit]');
  await page.waitForSelector('#age-error');
  await element('fieldset','03-validation','Age field rejected by frontend validation',0);

  await click('Stretched file');
  const response=page.waitForResponse(r=>r.url().includes('/api/predict-compare')&&r.request().method()==='POST');
  await page.click('button[type=submit]');
  const api=await response;if(api.status()!==200)throw new Error('Scoring API returned '+api.status());
  await page.waitForFunction(()=>document.querySelectorAll('[aria-live="polite"] article').length===2);
  await settle();
  await element('[aria-live="polite"] article','05-high-risk-verdict','Stretched sample, successful live prediction',0);
  const drivers=await rect('section[aria-labelledby="drivers-title"]');
  const row=await rect('section[aria-labelledby="drivers-title"] ol > li',5);
  const split=row.y+row.height;
  await capture('06-drivers-upper',{...drivers,height:split-drivers.y},'Score-driver explanation and first six factors');
  await capture('07-drivers-lower',{...drivers,y:split,height:drivers.y+drivers.height-split},'Remaining score drivers and strongest-factor summary');
  await element('[aria-live="polite"] article','10-model-comparison','Live three-model comparison for stretched sample',1);

  await go('/portfolio');
  const bands=await page.evaluate(()=>{
    const e=document.querySelector('main section > div'),r=e.getBoundingClientRect(),s=getComputedStyle(e);
    const top=parseFloat(s.paddingTop),bottom=parseFloat(s.paddingBottom),left=parseFloat(s.paddingLeft),right=parseFloat(s.paddingRight);
    return {x:r.x+scrollX+left,y:r.y+scrollY+top,width:r.width-left-right,height:r.height-top-bottom};
  });
  await capture('08-portfolio-bands',bands,'Risk-band distribution of all 1,000 applicants');
  // Capture the actual interactive controls and outcome summary, excluding the
  // two stacked charts that would make the screenshot unreadably tall in print.
  await element('main section:nth-of-type(2) .lg\\:col-span-4','09-cutoff-outcomes','Trained 25% cutoff and corresponding portfolio outcomes');

  await page.setViewport({width:1100,height:850,deviceScaleFactor:3});
  await go('/');await page.evaluate(()=>scrollTo(0,0));await settle();
  const hero=await rect('main section',0);
  const bottomPadding=await page.evaluate(()=>parseFloat(getComputedStyle(document.querySelector('main section > div.relative')).paddingBottom));
  await capture('04-landing',{x:0,y:0,width:1100,height:hero.y+hero.height-bottomPadding+18},'Complete live landing-page hero, navigation and model metrics');

  await page.setViewport({width:390,height:844,deviceScaleFactor:3});
  await go('/assess');form=await rect('form');first=await rect('fieldset',0);
  await capture('11-mobile-applicant',{...form,height:first.y+first.height-form.y+12},'Mobile applicant form and sample-file controls');
  await writeFile(path.join(OUT,'capture-manifest.json'),JSON.stringify(manifest,null,2));
  if(manifest.length!==12)throw new Error('Incomplete capture set');
} finally { await browser.close(); }
