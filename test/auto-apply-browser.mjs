// All employer traffic is synthetic and intercepted. No real accounts or applications.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdtemp,rm,readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createAutoApply,questionKey} from '../companion/auto-apply.mjs';
const directory=await mkdtemp(join(tmpdir(),'jobbies-auto-'));let browser,worker,accounts=0,sends=0,uploads=0,generatedPassword;
const employer='https://fixture.wd5.myworkdayjobs.com';
const page=body=>'<html><body>'+body+'</body></html>';
const fixtures={
 '/careers/job/123':page('<h1>Travel telecom technician</h1><a href="/login">Apply</a>'),
 '/login':page('<h1>Sign in</h1><label>Email Address<input name="email"></label><label>Password<input type="password"></label><a href="/register">Create Account</a><button>Sign In</button>'),
 '/register':page('<h1>Create Account</h1><form method="POST" action="/account"><label>Email Address<input name="email" required type="email"></label><label>Password<input name="password" required type="password"></label><label>Verify Password<input name="confirmation" type="password" required></label><label><input type="checkbox" name="privacy" required>I agree to the account privacy terms</label><button>Create Account</button></form>'),
 '/details':page('<h1>My Information</h1><form method="POST" action="/details"><label>First Name<input name="first" required></label><label>Last Name<input name="last" required></label><label>Email<input name="email" type="email" required></label><label>Resume<input name="resume" type="file" required></label><button>Save and Continue</button></form>'),
 '/questions':page('<h1>Application Questions</h1><form action="/review" method="POST"><label for="travel">Travel percentage *</label><button type="button" id="travel" role="combobox" aria-haspopup="listbox" aria-required="true" onclick="document.getElementById(\'options\').hidden=false">Select One</button><div id="options" role="listbox" hidden><div role="option" onclick="document.getElementById(\'travel\').innerText=\'100%\';document.getElementById(\'options\').hidden=true">100%</div><div role="option">50%</div></div><label>Current security clearance<input name="clearance" required></label><button>Save and Continue</button></form>'),
 '/review':page('<h1>Review your application</h1><form method="POST" action="/submit"><button>Submit Application</button></form>')
};
const launch=async()=>{browser=await chromium.launch();const create=browser.newContext.bind(browser);browser.newContext=async options=>{const context=await create(options);await context.route('**/*',async route=>{
 const request=route.request(),path=new URL(request.url()).pathname;
 if(request.method()==='POST'){
  if(path==='/account'){accounts++;generatedPassword=new URLSearchParams(request.postData()).get('password');assert.match(generatedPassword,/^Jb!9/);return route.fulfill({contentType:'text/html',body:fixtures['/details']});}
  if(path==='/details'){uploads++;return route.fulfill({contentType:'text/html',body:fixtures['/questions']});}
  if(path==='/review')return route.fulfill({contentType:'text/html',body:fixtures['/review']});
  if(path==='/submit'){sends++;return route.fulfill({contentType:'text/html',body:page('<h1>Thank you for your application</h1>')});}
  throw Error('Unexpected POST '+path);
 }
 return route.fulfill({contentType:'text/html',body:fixtures[path]||page('Not found')});
 });return context;};return browser;};
const input={job:{id:'workday:123',url:employer+'/careers/job/123',title:'Travel telecom technician',company:'Fixture',location:'United States'},version:3,email:'candidate@example.com',fields:[{id:'travel',label:'Travel percentage *',required:true}],values:{travel:'100%'},facts:{first_name:'Test',last_name:'Applicant'},files:{resume:{name:'resume.txt',type:'text/plain',purpose:'resume',base64:Buffer.from('Synthetic applicant resume').toString('base64')}},evidence:[],authorization:{reviewed:true,version:3,createEmployerAccount:true}};
const wait=async(id,states)=>{for(let i=0;i<300;i++){const t=worker.get(id);if(states.includes(t.status))return t;await new Promise(r=>setTimeout(r,100));}throw Error(JSON.stringify(worker.get(id)));};
try{
 worker=await createAutoApply({directory,launch,resolveHost:async()=>[{address:'93.184.216.34'}]});
 await assert.rejects(worker.apply({...input,authorization:{reviewed:false,version:3}}),/Yes, apply/);assert.equal(accounts,0);assert.equal(sends,0);
 let task=await worker.apply(input);task=await wait(task.id,['needs_input','blocked','unknown','submitted']);assert.equal(task.status,'needs_input',JSON.stringify({...task,preview:undefined}));assert.equal(task.questions.length,1);assert.match(task.questions[0].label,/clearance/);assert.equal(accounts,1);assert.equal(uploads,1);assert.equal(sends,0);
 assert.equal((await worker.apply(input)).id,task.id,'Repeated approval must reuse its existing task');
 await worker.resume(task.id,{answers:{[task.questions[0].id]:'None'}});task=await wait(task.id,['submitted','blocked','unknown']);assert.equal(task.status,'submitted',JSON.stringify({...task,preview:undefined}));assert.equal(sends,1);assert.equal(accounts,1);assert(task.receipt.answers.some(a=>a.answer==='100%'));assert(task.receipt.answers.some(a=>a.answer==='None'));
 const publicIndex=await readFile(join(directory,'tasks.json'),'utf8');assert(!publicIndex.includes(generatedPassword));assert(!JSON.stringify({...task,preview:undefined}).includes(generatedPassword));
 for(const name of await readdir(join(directory,'vault')))if(name.endsWith('.vault'))assert(!(await readFile(join(directory,'vault',name))).includes(Buffer.from(generatedPassword)));
 await worker.close();worker=await createAutoApply({directory,launch:()=>{throw Error('Duplicate must not launch browser');}});assert.equal((await worker.apply(input)).status,'submitted');assert.equal(sends,1);
 console.log('PASS: one approval creates an account, saves credentials privately, fills multi-page forms and custom dropdowns, uploads the resume, asks only for an unknown declaration, resumes, submits once, and preserves the receipt across restart. All employer traffic was synthetic.');
}finally{await worker?.close();await browser?.close();await rm(directory,{recursive:true,force:true});}
