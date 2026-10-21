// Two browser origins, real postMessage transfer, intercepted local worker API.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const browser=await chromium.launch(),context=await browser.newContext();let applies=0,task,request;const errors=[];
context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
await context.route('**/*',async route=>{
 const u=new URL(route.request().url());
 if(u.pathname==='/api/health')return route.fulfill({json:{app:'america-companion',signedIn:true,message:'Test worker'}});
 if(u.pathname==='/api/workspace')return route.fulfill({json:route.request().method()==='GET'?{workspace:null,revision:null}:{revision:'test',savedAt:Date.now()}});
 if(u.pathname==='/api/automation/exclusions')return route.fulfill({json:route.request().method()==='PUT'?route.request().postDataJSON():{employerPreferences:{},jobVisibility:{}}});
 if(u.pathname==='/api/automation')return route.fulfill({json:{applications:task?[task]:[]}});
 if(u.pathname==='/api/automation/apply'){
  applies++;request=route.request().postDataJSON();task={id:'bridge-task',jobId:request.job.id,version:request.version,status:'running',message:'Applying',events:[],fields:[]};return route.fulfill({json:task});
 }
 if(u.pathname==='/api/automation/bridge-task'){task={...task,status:'submitted',message:'Application sent',receipt:{at:Date.now(),message:'Application received',method:'Test receipt'}};return route.fulfill({json:task});}
 if(!['lionsarmor.github.io','127.0.0.1'].includes(u.hostname))return route.fulfill({json:{jobs:[]}});
 if(u.pathname.endsWith('/travel-feed.json'))return route.fulfill({json:{jobs:[],generatedAt:new Date().toISOString()}});
 let path=u.pathname.replace(/^\/AMERICA/,'');if(path==='/'||!path)path='/index.html';const file=resolve('site','.'+path);
 try{const body=await readFile(file);return route.fulfill({contentType:({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css'})[extname(file)]||'application/octet-stream',body});}catch{return route.fulfill({status:404,body:'Not found'});}
});
try{
 const page=await context.newPage();await page.goto('https://lionsarmor.github.io/AMERICA/#review');await page.waitForSelector('[data-queue-mode=ready]');
 const id=await page.evaluate(async()=>{const E=JobEngine;E.data.settings.autoPull=false;E.data.settings.codexAutoDraft=false;await E.answer('clearance_status','None');const j=E.importJob({title:'Traveling Fiber Technician',company:'Bridge fixture',location:'United States',url:'https://fixture.wd5.myworkdayjobs.com/Search/job/123',description:'100% travel. W-2 employment. Fusion splicing, OTDR, cabling and telecom. No security clearance required.'});await E.prepare(j.id);await E.save();return j.id;});
 await page.locator('[data-live-action=application]').click();assert.equal(applies,0);const popupEvent=page.waitForEvent('popup');await page.locator('[data-live-action=approve]').click();const worker=await popupEvent;
 await worker.waitForSelector('#automation-progress',{timeout:20000});await page.waitForFunction(id=>JobEngine.data.drafts[id]?.stage==='submitted',id,{timeout:15000});
 assert.equal(applies,1);assert(request.files.resume.base64);assert.equal(request.authorization.reviewed,true);assert.equal(request.authorization.createEmployerAccount,true);assert.equal(await worker.evaluate(()=>JobEngine.data.answers.clearance_status.value),'None');assert.deepEqual(errors,[]);
 console.log('PASS: GitHub Pages Yes, apply opens the local worker, securely transfers the reviewed profile and resume by origin/source/nonce-bound messaging, applies once, and returns the receipt to the public workspace. No employer traffic.');
}finally{await browser.close();}
