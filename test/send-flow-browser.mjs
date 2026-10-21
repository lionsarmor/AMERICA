// UI delivery flow with an intercepted companion; no network application is sent.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const site=resolve('site'),server=http.createServer(async(req,res)=>{try{const path=resolve(site,'.'+new URL(req.url,'http://localhost').pathname.replace(/^\/$/,'/index.html'));if(!path.startsWith(site+'/'))throw Error();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[extname(path)]||'application/octet-stream');res.end(await readFile(path));}catch{res.statusCode=404;res.end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();let sends=0,task,prepared;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.fulfill({json:{jobs:[]}}));
 await page.route('**/travel-feed.json',r=>r.fulfill({json:{jobs:[],generatedAt:new Date().toISOString()}}));
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname,method=route.request().method();
  if(path==='/api/health')return route.fulfill({json:{app:'america-companion',signedIn:true,message:'Synthetic connected companion'}});
  if(path==='/api/workspace')return route.fulfill({json:method==='GET'?{workspace:null,revision:null}:{revision:'test',savedAt:Date.now()}});
  if(path==='/api/applications/prepare'){
   prepared=route.request().postDataJSON();task={id:'test-preview',jobId:prepared.job.id,version:prepared.version,status:'ready',fingerprint:'test-fingerprint',preview:'',fields:prepared.fields.filter(f=>!f.internal).map(f=>({question:f.label,answer:prepared.values[f.id]||''}))};return route.fulfill({json:task});
  }
  if(path==='/api/applications/test-preview/submit'){
   assert.deepEqual(route.request().postDataJSON(),{fingerprint:'test-fingerprint',reviewed:true});sends++;task={...task,status:'submitted',receipt:{message:'Application received — synthetic test receipt',at:Date.now(),method:'Test employer confirmation'}};return route.fulfill({json:task});
  }
  return route.fulfill({status:400,json:{error:'Unexpected test request'}});
 });
 await page.goto(base+'/#review');await page.waitForSelector('[data-queue-mode=ready]');
 const id=await page.evaluate(async()=>{
  const E=JobEngine;E.data.settings.autoPull=false;E.data.settings.codexAutoDraft=false;
  const j=E.importJob({title:'Traveling Fiber Technician',company:'Synthetic employer',location:'United States',url:'https://job-boards.greenhouse.io/jobbiestest/jobs/123',description:'100% travel. W-2 employment. Fusion splicing, OTDR, cabling and telecom. No security clearance required.'});
  const d=await E.prepare(j.id);d.fields.push({id:'cover',key:'cover_letter',type:'input_file',label:'Cover letter',required:true});await E.answer('clearance_status','None');E.emit();return j.id;
 });
 await page.locator('[data-live-action=application]').click();await page.waitForSelector('[data-companion-action=send-application]');
 assert.equal(sends,0,'Opening review must not send');assert(prepared.files.cover.coverLetterText.includes('Traveling Fiber Technician'));assert.equal(prepared.files.cover.name,'Cover-letter.pdf');
 assert.match(await page.locator('#submission-review').innerText(),/I am applying for/);
 await page.locator('[data-companion-action=send-application]').click();await page.waitForFunction(id=>JobEngine.data.drafts[id].stage==='submitted',id);assert.equal(sends,1);
 await page.reload();await page.waitForSelector('[data-queue-mode=ready]');assert.equal(await page.evaluate(id=>JobEngine.data.drafts[id].stage,id),'submitted');assert.equal(sends,1);assert.deepEqual(errors,[]);
 console.log('PASS: opening a ready application prepares its preview without sending, cover letter is included, one Send click records the employer receipt, and submission survives reload. Companion delivery was intercepted.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
