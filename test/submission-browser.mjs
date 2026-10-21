import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createApplicationRunner} from '../companion/application-runner.mjs';
const directory=await mkdtemp(join(tmpdir(),'jobbies-browser-'));
let posts=0,sentPDF=false,browser,runner;
const fixture='<html><body><h1>Test role</h1><form enctype="multipart/form-data" method="post" action="/test/jobs/123/applications"><label>First name<input name="first_name" required></label><label>Email<input name="email" type="email" required></label><label>Cover letter<input type="file" name="cover" accept=".pdf" required></label><button type="submit">Submit application</button></form></body></html>';
const launch=async()=>{
 browser=await chromium.launch({headless:true});const create=browser.newContext.bind(browser);
 browser.newContext=async options=>{const context=await create(options);await context.route('**/*',route=>{if(route.request().method()==='POST'){posts++;sentPDF=route.request().postDataBuffer().includes(Buffer.from('%PDF-'));return route.fulfill({contentType:'text/html',body:'<html><body><h1>Thank you for applying</h1></body></html>'});}return route.fulfill({contentType:'text/html',body:fixture});});return context;};return browser;
};
const input={job:{id:'greenhouse:qa',url:'https://job-boards.greenhouse.io/test/jobs/123'},version:7,email:'candidate@example.com',fields:[{id:'first_name',label:'First name',required:true,type:'input_text'},{id:'email',label:'Email',required:true,type:'input_text'},{id:'cover',label:'Cover letter',key:'cover_letter',required:true,type:'input_file'}],values:{first_name:'Test',email:'candidate@example.com',cover:'Cover-letter.pdf'},files:{cover:{name:'Cover-letter.pdf',type:'application/pdf',coverLetterText:'Dear hiring team,\n\nI bring fiber installation experience.\n\nSincerely,\nTest'}}};
const wait=async(task,statuses)=>{for(let i=0;i<60;i++){const next=runner.get(task.id);if(statuses.includes(next.status))return next;await new Promise(r=>setTimeout(r,100));}throw Error('Task timed out: '+JSON.stringify(runner.get(task.id)));};
try{
 runner=await createApplicationRunner({directory,launch});let task=await runner.prepare(input);task=await wait(task,['ready','blocked']);assert.equal(task.status,'ready',task.error);assert.equal(posts,0,'Preview must never submit');assert.equal(task.fields.length,3);assert(task.preview);
 await assert.rejects(runner.submit(task.id,{fingerprint:task.fingerprint,reviewed:false}),/Review/);assert.equal(posts,0);
 await runner.submit(task.id,{fingerprint:task.fingerprint,reviewed:true});task=await wait(task,['submitted','unknown']);assert.equal(task.status,'submitted',task.error);assert.match(task.receipt.message,/Thank you/);assert.equal(posts,1);assert(sentPDF,'The submitted multipart body must contain the generated PDF');
 await runner.submit(task.id,{fingerprint:task.fingerprint,reviewed:true});assert.equal(posts,1,'Duplicate click must not resubmit');await runner.close();
 runner=await createApplicationRunner({directory,launch});await assert.rejects(runner.prepare(input),/already sent/);assert.equal(posts,1);
 console.log('PASS: actual browser autofill, preview without sending, mandatory review, one submit, employer receipt and durable duplicate prevention. All employer traffic was intercepted with synthetic forms.');
}finally{await runner?.close();await browser?.close();await rm(directory,{recursive:true,force:true});}
