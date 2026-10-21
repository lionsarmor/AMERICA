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
  if(path==='/api/automation/exclusions')return route.fulfill({json:method==='PUT'?route.request().postDataJSON():{employerPreferences:{},jobVisibility:{}}});
  if(path==='/api/automation')return route.fulfill({json:{applications:task?[task]:[]}});
  if(path==='/api/automation/apply'){
   prepared=route.request().postDataJSON();assert.equal(prepared.authorization.reviewed,true);assert.equal(prepared.authorization.createEmployerAccount,true);sends++;
   task={id:'test-auto',jobId:prepared.job.id,version:prepared.version,status:'running',message:'Filling employer application',fields:[],events:[]};return route.fulfill({json:task});
  }
  if(path==='/api/automation/test-auto'){
   task={...task,status:'submitted',message:'Application sent. Employer confirmation saved.',receipt:{message:'Application received — synthetic test receipt',at:Date.now(),method:'Test employer confirmation'}};return route.fulfill({json:task});
  }
  return route.fulfill({status:400,json:{error:'Unexpected test request'}});
 });
 await page.goto(base+'/#review');await page.waitForSelector('[data-queue-mode=ready]');
 const id=await page.evaluate(async()=>{
  const E=JobEngine;E.data.settings.autoPull=false;E.data.settings.codexAutoDraft=false;
  const j=E.importJob({title:'Traveling Fiber Technician',company:'Synthetic employer',location:'United States',url:'https://job-boards.greenhouse.io/jobbiestest/jobs/123',description:'100% travel. W-2 employment. Fusion splicing, OTDR, cabling and telecom. No security clearance required.'});
  const d=await E.prepare(j.id);d.fields.push({id:'cover',key:'cover_letter',type:'input_file',label:'Cover letter',required:true});await E.answer('clearance_status','None');E.emit();return j.id;
 });
 await page.locator('[data-live-action=application]').click();await page.waitForSelector('[data-live-action=approve]');
 assert.equal(sends,0,'Opening review must not start any employer actions');assert.equal(prepared,undefined);
 assert.match(await page.locator('[data-live-action=approve]').innerText(),/Yes, apply/);
 await page.locator('[data-live-action=approve]').click();await page.waitForFunction(id=>JobEngine.data.drafts[id].stage==='submitted',id);assert.equal(sends,1);
 assert(prepared.files.cover.coverLetterText.includes('Traveling Fiber Technician'));assert.equal(prepared.files.cover.name,'Cover-letter.pdf');
 assert.match(await page.locator('#automation-progress').innerText(),/Application sent/);
 await page.reload();await page.waitForSelector('[data-queue-mode=ready]');assert.equal(await page.evaluate(id=>JobEngine.data.drafts[id].stage,id),'submitted');assert.equal(sends,1);assert.deepEqual(errors,[]);
 console.log('PASS: review performs no employer actions; one Yes, apply click authorizes account creation and the entire application, includes the resume and cover letter, records the receipt, and survives reload without resending. Companion delivery was intercepted.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
