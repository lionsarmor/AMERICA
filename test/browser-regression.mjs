import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const site=resolve('site');
const server=http.createServer(async(req,res)=>{try{const path=resolve(site,'.'+new URL(req.url,'http://localhost').pathname.replace(/^\/$/,'/index.html'));if(!path.startsWith(site+'/'))throw Error();const body=await readFile(path);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[extname(path)]||'application/octet-stream');res.end(body);}catch{res.statusCode=404;res.end('Not found');}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();try{const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('BROWSER ERROR',e.message)});
await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.fulfill({json:{jobs:[]}}));
await context.route('**/travel-feed.json',r=>r.fulfill({json:{generatedAt:new Date().toISOString(),jobs:[]}}));
await page.goto(base+'/#wizard');await page.waitForSelector('#wizard-form');
await page.evaluate(async()=>{JobEngine.data.settings.autoPull=false;await JobEngine.save();});
await page.locator('#wizard-form input[value="Yes"]').check();
await page.waitForFunction(()=>JobEngine.resolveFact('us_citizen').value==='Yes'&&document.querySelector('#wizard-form')?.dataset.wizardId==='clearance_status');
assert.equal(await page.locator('#wizard-form').getAttribute('data-wizard-id'),'clearance_status');
await page.reload();await page.waitForSelector('#wizard-form');assert.equal(await page.evaluate(()=>JobEngine.resolveFact('us_citizen').value),'Yes');
await page.locator('#wizard-form input[value="None"]').check();
await page.waitForFunction(()=>JobEngine.resolveFact('clearance_status').value==='None');
await page.locator('#wizard-answer').fill('Rock Springs, WY, USA');
await page.locator('.nav-settings>summary').click();await page.locator('.nav-item[data-view="profile"]').click();await page.waitForURL('**/#profile');
assert.equal(await page.evaluate(()=>JobEngine.resolveFact('current_location').value),'Rock Springs, WY, USA');
await page.reload();await page.waitForSelector('.profile-panel');
await page.locator('.nav-item[data-live-view="wizard"]').click();await page.waitForSelector('#wizard-form');assert.equal(await page.locator('#wizard-form').getAttribute('data-wizard-id'),'start_date');
await page.evaluate(async()=>{
 const E=JobEngine;
 const j=E.importJob({title:'Traveling Fiber Technician',company:'Test contractor',url:'https://example.com/field',location:'United States',description:'100% travel. Fusion splicing, OTDR testing, Linux, cabling, telecom communications. W-2 or C2C accepted. Work on FAA facilities. No security clearance required.'});
 const fields=[{id:'citizen_1',key:'us_citizen',label:'Are you a US citizen?',required:true,type:'multi_value_single_select',options:[{value:'id-yes',label:'Yes'},{value:'id-no',label:'No'}]},{id:'why',key:'application_summary',label:'Why this company?',required:true,type:'textarea'},{id:'odd',label:'What is your favorite company product?',required:true,type:'input_text'}];
 E.data.drafts[j.id]={jobId:j.id,questionVersion:'2026-10-21-profile-first-v3',version:1,fields,values:{},fieldSources:{},stage:'needs_input',resumeTrack:'technician',history:[],missing:[]};await E.answer('us_citizen','Yes');
 if(E.data.drafts[j.id].values.citizen_1!=='id-yes')throw Error('Saved citizenship did not map to employer option');
 if(!E.data.drafts[j.id].values.why)throw Error('Resume did not draft application summary');
 const d=E.data.drafts[j.id];if(!d.coverLetter?.includes(j.title))throw Error('Automatic cover letter missing');
 const req=AmericaCompanion.requestFor(j.id);if(!req.fields.some(f=>f.id==='jobbies_cover_letter'))throw Error('Codex did not receive cover letter drafting work');
 const evidence=req.evidence.find(e=>e.id.startsWith('resume:'));
 E.applyCodexDraft(j.id,{summary:'Synthetic test',answers:[{fieldId:'jobbies_cover_letter',status:'supported',values:['QA cover letter grounded in supplied evidence.'],reason:'Resume support',evidence:[evidence]}]},{version:d.version,knowledgeRevision:E.data.knowledgeRevision||1});
 if(d.coverLetterSource!=='codex_draft'||!d.coverLetter.startsWith('QA cover'))throw Error('Codex cover letter not applied');
 E.setCoverLetter(j.id,'My reviewed cover letter');await E.answer('start_date','Two weeks after offer');
 if(d.coverLetter!=='My reviewed cover letter')throw Error('Manual cover letter was overwritten');
 d.fields.push({id:'cover',key:'cover_letter',label:'Cover letter',type:'input_file',required:true});await E.answer('start_date','Two weeks after offer');
 if(!d.attachments.cover||d.missing.includes('cover'))throw Error('Cover letter file was not prepared automatically');
 E.importJob({title:'Senior Software Engineer',company:'Wrong fit',url:'https://example.com/senior',location:'United States',description:'Remote. JavaScript Python Linux Docker AWS SQL. 12 years of software experience required.'});
});
await page.locator('.nav-item[data-view="opportunities"]').click();await page.waitForSelector('.live-job-card');assert.equal(await page.locator('.live-job-card').count(),1);
assert.match(await page.locator('.live-job-card').innerText(),/Fiber Technician/);
await page.locator('.tag-filters>summary').click();await page.locator('[data-filter-tag="otdr"]').click();await page.locator('[data-filter-tag="government"]').click();assert.equal(await page.locator('.live-job-card').count(),1);await page.reload();await page.waitForSelector('.live-job-card');assert.equal(await page.locator('[data-filter-tag="otdr"]').getAttribute('aria-pressed'),'true');
await page.locator('[data-job-category="travel_100"]').click();assert.equal(await page.locator('.live-job-card').count(),1);
await page.locator('.job-filters>summary').click();await page.locator('#live-arrangement').selectOption('c2c');assert.equal(await page.locator('.job-filters').evaluate(el=>el.open),true,'Selecting a filter must keep the filter panel open');await page.locator('#live-sector').selectOption('government');assert.equal(await page.locator('.live-job-card').count(),1);
await page.reload();await page.waitForSelector('.live-job-card');assert.equal(await page.locator('#live-arrangement').inputValue(),'c2c');
await page.locator('.nav-item[data-view="review"]').click();await page.waitForSelector('[data-queue-mode="input"]');await page.locator('[data-queue-mode="input"]').click();await page.locator('[data-live-action="application"]').click();assert.equal(await page.locator('#live-cover-letter').inputValue(),'My reviewed cover letter');await page.evaluate(()=>document.querySelector('#detail-dialog').close());
await page.goto(base+'/contracts.html#business');await page.waitForSelector('#business-profile-form');await page.locator('[name="name"]').fill('QA Contracting LLC');await page.locator('[name="services"]').fill('Fiber installation, OTDR diagnostics and telecom field services');await page.locator('#business-profile-form button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('#business-save-status')?.textContent.includes('Saved on'));
await page.reload();await page.waitForSelector('#business-profile-form');assert.equal(await page.locator('[name="name"]').inputValue(),'QA Contracting LLC');
// Exercise source intake: rejected jobs never enter storage; C2C leads never become employee drafts.
await page.route('https://boards-api.greenhouse.io/v1/boards/jobbiestest/jobs?content=true',route=>route.fulfill({json:{jobs:[
 {id:1,title:'Fiber Technician',location:{name:'United States'},absolute_url:'https://example.com/w2-accepted',content:'100% travel. W-2 employment. Fusion splicing, OTDR, cabling and telecom.'},
 {id:2,title:'Software Developer',location:{name:'New York office'},absolute_url:'https://example.com/office-rejected',content:'JavaScript Node.js Python Linux SQL APIs. On-site required.'},
 {id:3,title:'Fiber Technician',location:{name:'United States'},absolute_url:'https://example.com/travel-unknown',content:'W-2 employment. Fusion splicing, OTDR, cabling and telecom. Some travel.'},
 {id:4,title:'Fiber Installation Subcontractor',location:{name:'United States'},absolute_url:'https://example.com/business-only',content:'C2C accepted. Fusion splicing, OTDR, cabling and telecom. Local installation projects.'}
]}}));
await page.evaluate(async()=>{
 const E=JobEngine;for(const source of E.sources())E.setSource(source.id,false);
 E.data.customSources.push({id:'qa-feed',name:'QA feed',kind:'greenhouse',board:'jobbiestest',home:'https://example.com',interval:3600000,enabled:true});
 E.data.settings.autoPrepare=true;await E.pull({businessOnly:true});
 const urls=Object.values(E.data.jobs).map(j=>j.url);
 if(!urls.includes('https://example.com/w2-accepted')||urls.some(u=>/office-rejected|travel-unknown|business-only/.test(u)))throw Error('Job intake allowed an unsuitable listing');
 const leads=Object.values(E.data.businessLeads);if(leads.length!==1||!leads.some(j=>j.url.endsWith('business-only')))throw Error('Business routing failed');
 if(Object.keys(E.data.drafts).length!==1)throw Error('Contract browsing prepared employee applications');
});
await page.locator('.nav-item[data-live-view="contracts"]').click();await page.waitForSelector('[data-live-action="contract-review"]');
assert.equal(await page.locator('[data-live-action="contract-review"]').count(),1);
await page.locator('[data-live-action="contract-review"]').last().click();await page.locator('[data-live-action="draft-proposal"]').click();
assert.match(await page.locator('#contract-proposal').inputValue(),/QA Contracting LLC/);
await page.locator('#contract-stage').selectOption('draft');await page.locator('#contract-note').fill('Confirm schedule and scope with client');await page.locator('[data-live-action="save-contract"]').click();
await page.locator('.nav-item[data-live-view="contract_pipeline"]').click();await page.reload();await page.waitForSelector('[data-live-action="contract-review"]');
assert.equal(await page.evaluate(()=>Object.values(JobEngine.data.businessLeads).filter(j=>j.pipeline.stage==='draft').length),1);
await page.locator('.nav-item[data-live-view="contract_rules"]').click();await page.locator('[name="minimumTravel"]').selectOption('50');await page.locator('#discovery-rules-form [type=submit]').click();
await page.waitForFunction(()=>JobEngine.data.settings.businessDiscoveryRules.minimumTravel===50);
assert.equal(await page.evaluate(()=>JobEngine.data.settings.discoveryRules.minimumTravel),100,'Business rules changed employee rules');
await page.goto(base+'/contracts.html#business');await page.waitForSelector('#business-profile-form');
const second=await context.newPage();await second.goto(base+'/#profile');await second.waitForSelector('.profile-panel');
await page.evaluate(()=>JobEngine.answer('start_date','Two weeks after offer'));
await second.evaluate(()=>JobEngine.answer('weeks_away','4 weeks'));
await page.reload();await page.waitForSelector('#business-profile-form');assert.equal(await page.evaluate(()=>JobEngine.resolveFact('start_date').value),'Two weeks after offer');assert.equal(await page.evaluate(()=>JobEngine.resolveFact('weeks_away').value),'4 weeks');
for(const width of [1440,768,390,320]){await page.setViewportSize({width,height:900});for(const view of ['business','contracts','contract_pipeline','contract_rules']){await page.evaluate(v=>location.hash=v,view);await page.waitForTimeout(100);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),view+' overflow '+width);}}
await page.goto(base+'/#search_rules');await page.waitForSelector('#discovery-rules-form');for(const width of [1440,390,320]){await page.setViewportSize({width,height:900});for(const view of ['search_rules','wizard','opportunities','review','answers']){await page.evaluate(v=>location.hash=v,view);await page.waitForTimeout(100);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),view+' overflow '+width);}}
await page.evaluate(async()=>{
 const E=JobEngine,d=Object.values(E.data.drafts)[0],version=d.version;
 d.pendingSubmissionSnapshot={version,job:structuredClone(E.data.jobs[d.jobId]),values:structuredClone(d.values),fields:structuredClone(d.fields),note:'Reviewed version'};
 const original=JSON.stringify(d.values);d.version++;d.values={changed:'after review'};
 await E.recordSubmission(d.jobId,version,{at:Date.now(),message:'Synthetic employer confirmation'});
 if(d.stage!=='submitted'||d.version!==version||JSON.stringify(d.values)!==original)throw Error('Receipt did not preserve the version actually sent');
});
assert.deepEqual(errors,[]);console.log('PASS profile answers persist across reload and navigation, employer IDs map correctly, company questions stay out of wizard, recommendations and filters work, business profile persists, stale tabs preserve answers, responsive views.');}finally{await browser.close();await new Promise(r=>server.close(r));}
