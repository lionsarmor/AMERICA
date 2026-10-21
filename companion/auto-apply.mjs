import {chromium} from 'playwright';
import {randomBytes,createHash} from 'node:crypto';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {join} from 'node:path';
import {lookup} from 'node:dns/promises';
import {isIP} from 'node:net';
import {runInNewContext} from 'node:vm';
import {createApplicationVault} from './application-vault.mjs';
import {normalizeRequest} from './reasoner.mjs';
import '../site/employer-policy.js';
const P=globalThis.JobbiesEmployerPolicy;

const knowledgeContext={window:{}};runInNewContext(await readFile(new URL('../site/question-library.js',import.meta.url),'utf8'),knowledgeContext);
const knowledge=knowledgeContext.window.ApplicantKnowledge;
const hash=value=>createHash('sha256').update(value).digest('hex');
export const questionKey=label=>'employer_question:'+hash(normalizeLabel(label));
export const normalizeLabel=value=>String(value||'').toLowerCase().replace(/[\s*]+/g,' ').trim();
const knownATS=host=>/(?:^|\.)(?:greenhouse\.io|lever\.co|myworkdayjobs\.com|myworkdaysite\.com|ashbyhq\.com|smartrecruiters\.com|icims\.com|taleo\.net|jobvite\.com|applytojob\.com|paylocity\.com|ultipro\.com|oraclecloud\.com|dayforcehcm\.com)$/.test(host);
const privateIP=ip=>/^(?:127\.|10\.|192\.168\.|169\.254\.|0\.|224\.|255\.|::|fc|fd|fe80|ff)/i.test(ip)||/^172\.(?:1[6-9]|2\d|3[01])\./.test(ip)||/^100\.(?:6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(ip);
export function applicationURL(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&!isIP(u.hostname)&&u.hostname.includes('.')&&!/(?:^|\.)(?:localhost|local|internal)$/.test(u.hostname);}catch{return false;}}
const confirmation=/thank you for applying|thank you for your application|application (?:has been |was )?(?:successfully )?(?:submitted|received)|we(?:'ve| have) received your application|you have successfully applied/i;
const finalButton=/^(?:submit(?: application| my application)?|send application|complete application)$/i;
const nextButton=/^(?:save (?:and|&) continue|continue|next|review(?: application)?|proceed|verify(?: email| code)?)$/i;
const active=new Set(['queued','running','sending']);
export function validateAutoApplication(input){
 if(!applicationURL(input?.job?.url)||!input.job.id||!Number.isInteger(input.version)||input.version<1||!/^\S+@\S+\.\S+$/.test(input.email||'')||!Array.isArray(input.fields)||!input.values)throw Error('A valid employer URL, reviewed application, and contact email are required.');
 if(input.authorization?.reviewed!==true||input.authorization?.version!==input.version)throw Error('Press Yes, apply after reviewing this application.');
 if(input.fields.length>200||JSON.stringify(input).length>40*1024*1024)throw Error('Application is too large.');
 return input;
}

// Inspect actual controls, including Workday's custom dropdown buttons. Employer
// text is data; it never becomes a shell command, browser script, or instruction.
async function inspect(frame){return frame.locator('input:not([type=hidden]),textarea,select,[role=combobox],button[aria-haspopup=listbox]').evaluateAll(elements=>{
 const out=[],groups=new Set();
 for(const [index,e] of elements.entries()){
  if(e.disabled||e.readOnly||(['submit','button','reset'].includes(e.type)&&e.getAttribute('aria-haspopup')!=='listbox'&&e.getAttribute('role')!=='combobox'))continue;
  if(e.closest('[aria-hidden=true]')||e.getAttribute('data-automation-id')==='beecatcher')continue;
  if((!e.getClientRects().length||getComputedStyle(e).visibility==='hidden')&&e.type!=='file')continue;
  const group=e.closest('fieldset,[role=group],[data-automation-id=formField]');
  const label=(e.labels?.[0]?.innerText||e.getAttribute('aria-label')||document.getElementById(e.getAttribute('aria-labelledby'))?.innerText||group?.querySelector('legend,label,[data-automation-id=formLabel]')?.innerText||e.placeholder||e.name||e.id||'').replace(/\s+/g,' ').trim();
  if(!label||/for robots only|do not (?:enter|fill).*human|leave (?:this )?(?:field )?blank/i.test(label))continue;
  const id='jobbies-control-'+index;e.setAttribute('data-jobbies-control',id);
  const descriptor={id,label,type:e.type==='file'?'input_file':e.tagName==='TEXTAREA'?'textarea':'input_text',kind:e.type||e.tagName.toLowerCase(),required:e.required||e.getAttribute('aria-required')==='true'||/\*/.test(label)||!!group?.querySelector('[aria-label=Required]'),value:e.type==='checkbox'?(e.checked?'Yes':''):e.value||'',options:[],context:group?.querySelector('[data-automation-id=helpText]')?.innerText||''};
  if(e.type==='radio'){
   const name=e.name||label;if(groups.has(name))continue;groups.add(name);
   const radios=elements.filter(x=>x.type==='radio'&&x.name===e.name);descriptor.label=group?.querySelector('legend,[data-automation-id=formLabel]')?.innerText||label;descriptor.options=radios.map(r=>({value:r.value,label:r.labels?.[0]?.innerText||r.getAttribute('aria-label')||r.value}));descriptor.radioName=e.name;descriptor.value=radios.find(r=>r.checked)?.value||'';
  }
  if(e.tagName==='SELECT')descriptor.options=[...e.options].filter(o=>o.value).map(o=>({value:o.value,label:o.textContent}));
  if(e.getAttribute('role')==='combobox'||e.getAttribute('aria-haspopup')==='listbox'){descriptor.kind='combobox';descriptor.value=e.value||(/select|choose/i.test(e.innerText)?'':e.innerText)||'';}
  out.push(descriptor);
 }
 return out;
 });}

export function savedValue(field,input){
 const label=normalizeLabel(field.label).replace(/\s*\*\s*$/,''),facts=input.facts||{},scoped=questionKey(field.label)+'@'+new URL(input.job.url).origin;
 if(Object.hasOwn(facts,scoped))return facts[scoped];
 if(Object.hasOwn(facts,questionKey(field.label)))return facts[questionKey(field.label)];
 const match=(input.fields||[]).find(f=>normalizeLabel(f.originalLabel||f.label).replace(/\s*\*\s*$/,'')===label);
 if(match&&input.values[match.id]!==undefined&&input.values[match.id]!==''){
  const v=input.values[match.id];return Array.isArray(v)?v.map(x=>match.options?.find(o=>String(o.value)===String(x))?.label||x):match.options?.find(o=>String(o.value)===String(v))?.label||v;
 }
 const exact=knowledge.catalog.find(q=>q.aliases.some(a=>knowledge.normalize(a)===knowledge.normalize(field.label))||knowledge.normalize(q.label)===knowledge.normalize(field.label));
 if(exact&&facts[exact.key]!==undefined)return facts[exact.key];
 if(!globalThis.ApplicantAnswerPolicy.restricted(field)){const meaning=knowledge.match(field.label,input.job,field.options);if(meaning?.key&&facts[meaning.key]!==undefined&&!meaning.inverted)return facts[meaning.key];}
 const simple=[['first_name',/^(?:legal )?(?:first|given) name$/],['last_name',/^(?:legal )?(?:last|family) name$|^surname$/],['name',/^(?:full|legal|your) name$|^name$/],['email',/^(?:e-?mail(?: address)?|confirm e-?mail(?: address)?)$/],['phone',/^(?:phone|mobile|telephone|cell)(?: number)?$/],['linkedin',/^linkedin(?: (?:profile|url|link))?$/],['github',/^github(?: (?:profile|url|link))?$/],['cover_letter',/^cover letter$/],['current_location',/^current (?:location|city)$/],['start_date',/^start date$|^when can you start\??$/]];
 for(const [key,re] of simple)if(re.test(label)){if(key==='email')return input.email;if(key==='cover_letter')return input.coverLetter;return facts[key];}
 // Compound eligibility questions deliberately do not collapse to a simple yes/no.
 if(!/\band\b|clearance|residen|exclusiv|only|dual|passport|proof|born/.test(label)&&/^(?:are you (?:a |an )?|do you have )?(?:u\.?s\.?|united states) citizen(?:ship)?\??$/.test(label))return facts.us_citizen;
 if(/\b(?:us|usa|united states)\b/i.test(input.job.location||'')&&!/\band\b|clearance|criminal|degree|years|residen|licen[cs]e|not |without/.test(label)){
  if(/(?:legally )?authori[sz]ed to work (?:in the (?:united states|u\.?s\.?)|in (?:the )?us)\??$/.test(label))return facts.us_work_authorization;
  if(/(?:need|require).*(?:visa |immigration |employment )?sponsorship/.test(label))return facts.us_sponsorship;
 }
 return undefined;
}
function optionValue(field,value){
 if(!field.options.length)return value;
 const vals=Array.isArray(value)?value:[value],resolved=[];
 for(const v of vals){const exact=field.options.filter(o=>normalizeLabel(o.label)===normalizeLabel(v)||String(o.value)===String(v));if(exact.length!==1)return undefined;resolved.push(exact[0].value);}
 return Array.isArray(value)?resolved:resolved[0];
}

export async function createAutoApply({directory,reasoner,workingDirectory,launch=()=>chromium.launch({headless:true}),resolveHost=lookup,legacyLedgerPath}={}){
 await mkdir(directory,{recursive:true,mode:0o700});const vault=await createApplicationVault(join(directory,'vault'));
 const policyPath=join(directory,'exclusions.json');let policy=P.validate(JSON.parse(await readFile(policyPath,'utf8').catch(e=>{if(e.code==='ENOENT')return '{}';throw e;}))),policyTail=Promise.resolve();
 const indexPath=join(directory,'tasks.json');const records=JSON.parse(await readFile(indexPath,'utf8').catch(e=>{if(e.code==='ENOENT')return '{}';throw e;})),tasks=new Map();let browser,launching,writeTail=Promise.resolve(),stopping=false;
 for(const record of Object.values(records)){if(active.has(record.status)){record.status=record.status==='sending'?'unknown':'paused';record.message=record.status==='unknown'?'The worker restarted during submission. Check the receipt before any retry.':'The worker restarted. Resume to continue your approved application.';}tasks.set(record.id,record);}
 const persist=()=>{const data=JSON.stringify(Object.fromEntries([...tasks].map(([id,t])=>[id,{id:t.id,key:t.key,jobId:t.jobId,version:t.version,status:t.status,message:t.message,receipt:t.receipt,createdAt:t.createdAt,updatedAt:t.updatedAt,events:t.events,questions:t.questions,review:t.review,attempted:t.attempted}])));writeTail=writeTail.catch(()=>{}).then(async()=>{await writeFile(indexPath+'.tmp',data,{mode:0o600});await rename(indexPath+'.tmp',indexPath);});return writeTail;};
 const publicTask=t=>({id:t.id,jobId:t.jobId,version:t.version,status:t.status,message:t.message,error:['blocked','unknown'].includes(t.status)?t.message:undefined,receipt:t.receipt,questions:t.questions||[],fields:t.review||[],events:t.events||[],preview:t.preview,createdAt:t.createdAt});
 async function progress(t,message,status='running'){if(t.status==='cancelled'&&status!=='cancelled')throw Error('Application cancelled.');t.status=status;t.message=message;t.updatedAt=Date.now();t.events||=[];if(t.events.at(-1)?.message!==message)t.events.push({at:t.updatedAt,message});t.events=t.events.slice(-100);await persist();}
 async function checkpoint(t){if(t.context&&t.account){t.account.storage=await t.context.storageState();await vault.write(t.accountScope,t.account);}}
 async function pause(t,message,status='needs_input',questions=[]){t.questions=questions;t.preview=(await t.page.screenshot({type:'jpeg',quality:60}).catch(()=>Buffer.alloc(0))).toString('base64');await checkpoint(t);await progress(t,message,status);}
 const keyFor=input=>hash(new URL(input.job.url).origin+new URL(input.job.url).pathname+'\n'+input.email.trim().toLowerCase());
 async function apply(input){
  validateAutoApplication(input);checkAllowed(input);const key=keyFor(input);
  if(legacyLedgerPath){const legacy=JSON.parse(await readFile(legacyLedgerPath,'utf8').catch(e=>{if(e.code==='ENOENT')return '{}';throw e;}));if(legacy[key])throw Error('A previous submission already exists for this employer role. Check its receipt before retrying.');}
  const existing=[...tasks.values()].find(t=>t.key===key&&!['cancelled','blocked'].includes(t.status));
  if(existing)return publicTask(existing);
  const t={id:randomBytes(24).toString('hex'),key,jobId:input.job.id,version:input.version,input:structuredClone(input),createdAt:Date.now(),review:[],events:[],status:'queued',questions:[]};
  await vault.write('task:'+t.id,t.input);tasks.set(t.id,t);await progress(t,'Approved. Waiting for the application browser.','queued');void pump();return publicTask(t);
 }
 async function prepareContext(t){
  browser||=await (launching||=launch().catch(e=>{launching=null;throw e;}));
  t.input||=await vault.read('task:'+t.id);t.accountScope='account:'+new URL(t.input.job.url).origin+':'+t.input.email.trim().toLowerCase();t.account=await vault.read(t.accountScope);
  t.context=await browser.newContext({storageState:t.account.storage,viewport:{width:1100,height:850},acceptDownloads:false,serviceWorkers:'block'});
  const dnsCache=new Map(),initial=new URL(t.input.job.url).hostname;
  await t.context.route('**/*',async route=>{
   try{const r=route.request(),u=new URL(r.url());if(!['https:','data:','blob:'].includes(u.protocol))return route.abort();if(u.protocol!=='https:')return route.continue();
    if(r.isNavigationRequest()&&r.frame()===t.page?.mainFrame()&&u.hostname!==initial&&u.hostname.split('.').slice(-2).join('.')!==initial.split('.').slice(-2).join('.')&&!knownATS(u.hostname))return route.abort();
    if(!dnsCache.has(u.hostname))dnsCache.set(u.hostname,await resolveHost(u.hostname,{all:true}));if(dnsCache.get(u.hostname).some(a=>privateIP(a.address)))return route.abort();
    return route.fallback();
   }catch{return route.abort();}
  });
  t.page=await t.context.newPage();await t.page.goto(t.input.job.url,{waitUntil:'domcontentloaded',timeout:45000});await t.page.getByRole('button',{name:/apply|create account|sign in|continue|submit/i}).or(t.page.getByRole('link',{name:/apply|create account|sign in/i})).or(t.page.locator('input[type=email]')).filter({visible:true}).first().waitFor({timeout:45000});await t.page.waitForTimeout(1200);
 }
 async function fillFile(t,field,control){
  const source=t.input.fields.find(f=>normalizeLabel(f.label)===normalizeLabel(field.label));let file=t.input.files?.[source?.id];
  if(!file&&/resume|cv/i.test(field.label))file=Object.values(t.input.files||{}).find(f=>f.purpose==='resume')||t.input.files?.resume;
  if(!file&&/cover letter/i.test(field.label)&&t.input.coverLetter)file={name:'Cover-letter.pdf',type:'application/pdf',coverLetterText:t.input.coverLetter};
  if(!file)return false;
  let buffer;if(file.coverLetterText){const p=await t.context.newPage();await p.setContent('<main style="white-space:pre-wrap;font:12pt Arial;line-height:1.5"></main>');await p.locator('main').evaluate((e,v)=>e.textContent=v,String(file.coverLetterText).slice(0,10000));buffer=await p.pdf({format:'Letter',margin:{top:'0.7in',bottom:'0.7in',left:'0.8in',right:'0.8in'}});await p.close();}else buffer=Buffer.from(file.base64||'','base64');
  if(!buffer.length||buffer.length>10*1024*1024)throw Error('The resume or attachment is empty or exceeds 10 MB.');
  await control.setInputFiles({name:file.name.replace(/[/\\]/g,'_'),mimeType:file.type||'application/octet-stream',buffer});return file.name;
 }
 async function populate(t,frame){
  const fields=await inspect(frame),unresolved=[],pending=[];t.questions=[];
  for(const field of fields){
   const el=frame.locator(`[data-jobbies-control="${field.id}"]`);
   if(field.kind==='password')continue;
   if(field.value&&field.kind!=='checkbox')continue;
   if(field.kind==='combobox'){
    await el.click();await t.page.waitForTimeout(150);field.options=await frame.getByRole('option').evaluateAll(es=>es.filter(e=>e.getClientRects().length).map(e=>({value:e.textContent.trim(),label:e.textContent.trim()})));await el.press('Escape').catch(()=>{});
   }
   if(field.type==='input_file'){const filename=await fillFile(t,field,el);if(filename)t.review.push({question:field.label,answer:filename});else if(field.required)unresolved.push(field);continue;}
   let value=savedValue(field,t.input);
   if(field.kind==='checkbox'&&/account|privacy|terms of use/i.test(field.label)&&t.creatingAccount&&/agree|accept|consent/i.test(field.label))value='Yes';
   if(value===undefined||value===''){
    // Explicitly optional demographic fields can be left unanswered.
    if(globalThis.ApplicantAnswerPolicy.restricted(field)||field.kind==='checkbox'){if(field.required)unresolved.push(field);continue;}
    pending.push(field);continue;
   }
   const applied=await setField(t,frame,field,value);if(!applied&&field.required)unresolved.push(field);
  }
  if(pending.length&&reasoner){
   await progress(t,'Using your resume and saved answers to complete employer questions.');
   const request=normalizeRequest({job:t.input.job,evidence:t.input.evidence||[],fields:pending.map(f=>({...f,question:f.label}))});
   t.reasoningRuns=(t.reasoningRuns||0)+1;if(t.reasoningRuns>12)throw Error('This application needs more form analysis than the current worker limit. Progress is saved.');
   let result;try{result=await reasoner(request,{workingDirectory,signal:AbortSignal.timeout(180000)});}catch{throw Error('Codex could not finish the employer questions. Check the connection in Intelligence; application progress is saved.');}
   for(const field of pending){const answer=result.answers?.find(a=>a.fieldId===field.id&&a.status==='supported');if(!answer||!await setField(t,frame,field,field.type==='multi_value_multi_select'?answer.values:answer.values[0])){if(field.required)unresolved.push(field);}}
  }else unresolved.push(...pending.filter(f=>f.required));
  return unresolved;
 }
 async function setField(t,frame,field,value){
  value=optionValue(field,value);if(value===undefined||value===null)return false;
  const el=frame.locator(`[data-jobbies-control="${field.id}"]`);
  if(field.kind==='select-one'||field.kind==='select-multiple')await el.selectOption(value);
  else if(field.kind==='combobox'){
   await el.click();if((await el.evaluate(e=>e.tagName))==='INPUT')await el.fill(String(field.options.find(o=>o.value===value)?.label||value));
   const option=frame.getByRole('option',{name:field.options.find(o=>o.value===value)?.label||String(value),exact:true});if(await option.count()!==1){await el.press('Escape').catch(()=>{});return false;}await option.click();
  }else if(field.kind==='checkbox'){if(!/^(?:yes|true|no|false)$/i.test(String(value)))return false;await el.setChecked(/^(yes|true)$/i.test(String(value)));}
  else if(field.kind==='radio'){const radios=frame.locator('input[type=radio]');let done=false;for(const r of await radios.all())if(await r.getAttribute('name')===field.radioName&&await r.getAttribute('value')===String(value)){await r.check();done=true;break;}if(!done)return false;}
  else await el.fill(String(value));
  const answer=field.options.find(o=>String(o.value)===String(value))?.label||String(value);t.review=t.review.filter(r=>r.question!==field.label);t.review.push({question:field.label,answer});return true;
 }
 async function choose(frame,pattern){const controls=frame.getByRole('button',{name:pattern}).or(frame.getByRole('link',{name:pattern}));for(const el of await controls.all())if(await el.isVisible()&&await el.isEnabled())return el;return null;}
 async function receipt(frame){const elements=frame.getByRole('heading').or(frame.getByRole('status')).or(frame.getByRole('alert')).or(frame.locator('[data-automation-id=applicationConfirmation]'));for(const el of await elements.all())if(await el.isVisible()&&confirmation.test(await el.innerText()))return (await el.innerText()).slice(0,700);return '';}
 async function drive(t){
  try{
   if(!t.page||t.page.isClosed())await prepareContext(t);
   let previous='',repeats=0;
   for(let step=0;step<60&&!stopping&&t.status!=='cancelled';step++){
    checkAllowed(t.input);await t.page.waitForLoadState('domcontentloaded');
    const frame=t.page.frames().find(f=>f!==t.page.mainFrame()&&applicationURL(f.url())&&knownATS(new URL(f.url()).hostname))||t.page.mainFrame();t.frame=frame;
    const body=(await frame.locator('body').innerText()).slice(0,45000);
    const received=await receipt(frame);if(received){
     if(!t.attempted){await pause(t,'The employer shows an existing application. No duplicate was sent.','blocked');return;}
     t.receipt={at:Date.now(),url:t.page.url(),message:received,method:'Automated employer browser confirmation',answers:t.review};await checkpoint(t);await progress(t,'Application sent. Employer confirmation saved.','submitted');await t.context.close();return;
    }
    const signature=hash(t.page.url()+body);repeats=signature===previous?repeats+1:0;previous=signature;
    if(repeats>=4){await pause(t,'The employer did not advance. The application is saved here for troubleshooting.','blocked');return;}
    const challenge=frame.locator('iframe[src*=recaptcha],iframe[src*=hcaptcha],iframe[src*=challenges]');
    if(await challenge.count()&&await challenge.first().isVisible()||/enter (?:the )?(?:verification|security|one.time) code|verify your email|check your email.*(?:verify|activate)|verification link.*email/i.test(body)){
     await pause(t,'Employer verification is required. Complete the verification below; Jobbies will continue the application.','needs_verification');return;
    }
    if(t.creatingAccount&&/account.{0,60}already.{0,30}(?:exists|registered)|email.{0,60}already.{0,30}(?:use|registered)|already.{0,30}account.{0,30}email/i.test(body)){
     const signIn=frame.locator('[data-automation-id=signInLink]').filter({visible:true});const link=await signIn.count()?signIn.first():await choose(frame,/^sign in$|^log in$/i);
     if(link){t.creatingAccount=false;t.account.registered=true;await vault.write(t.accountScope,t.account);await progress(t,'An employer account already exists. Signing in.');await link.click();await t.page.waitForTimeout(900);continue;}
    }
    const passwords=frame.locator('input[type=password]').filter({visible:true});
    if(await passwords.count()){
     const create=await choose(frame,/^create (?:an? )?account$|^sign up$|^register$/i);
     if(await passwords.count()===1&&create&&!t.creatingAccount&&!t.account.registered){await progress(t,'Opening employer account registration.');await create.click();await t.page.waitForTimeout(900);t.creatingAccount=true;continue;}
     t.creatingAccount=await passwords.count()>1||t.creatingAccount;
     if(t.creatingAccount&&t.input.authorization.createEmployerAccount!==true){await pause(t,'Employer account creation was not included in this approval.','blocked');return;}
     if(!t.account.password){if(!t.creatingAccount){await pause(t,'This employer requires an existing account password. It will be saved privately for future applications.','needs_login',[{id:'account_password',label:'Employer account password',kind:'password',required:true}]);return;}t.account.password='Jb!9'+randomBytes(24).toString('base64url');await vault.write(t.accountScope,t.account);}
     await progress(t,t.creatingAccount?'Creating and saving your employer account.':'Signing in with your saved employer account.');
     const missing=await populate(t,frame);if(missing.length){await pause(t,'Add the missing account details once. Jobbies will continue automatically.','needs_input',missing);return;}
     for(const p of await passwords.all())await p.fill(t.account.password);
     const button=await choose(frame,t.creatingAccount?/^create (?:an? )?account$|^sign up$|^register$/i:/^sign in$|^log in$|^login$/i);
     if(!button){await pause(t,'The employer login control could not be identified.','blocked');return;}
     if(t.loginAttempted===signature){await pause(t,'The employer did not accept the saved login. Update the password here to continue.','needs_login',[{id:'account_password',label:'Employer account password',kind:'password',required:true}]);return;}
     t.loginAttempted=signature;await button.click();await t.page.waitForTimeout(1200);t.account.registered=true;await checkpoint(t);continue;
    }
    t.creatingAccount=false;
    const apply=await choose(frame,/^apply manually$/i)||await choose(frame,/^apply(?: now| manually| for (?:this )?(?:job|position))?$|^start (?:your )?application$|^i['’]m interested$/i);
    const fields=await inspect(frame),final=await choose(frame,finalButton),next=await choose(frame,nextButton);
    if(apply&&!final&&!next&&fields.filter(f=>f.required).length===0){await progress(t,'Opening the employer application.');await apply.click();await t.page.waitForTimeout(900);continue;}
    await progress(t,'Filling your application and uploading the selected resume.');
    const missing=await populate(t,frame);
    if(missing.length){await pause(t,'Only these missing facts need your input. Saved answers will be reused.','needs_input',missing);return;}
    const send=await choose(frame,finalButton)||((fields.length>1||t.review.length>1)&&await choose(frame,/^apply(?: now)?$/i));
    if(send){
     if(t.attempted){await pause(t,'A submission was already attempted. Jobbies will not send a duplicate.','unknown');return;}
     // Persist intent before the only final submission click, including across crashes.
     checkAllowed(t.input);t.attempted=true;await progress(t,'Submitting your approved application.','sending');
     await send.click({timeout:15000});
     let message='';for(let n=0;n<30&&!message;n++){await t.page.waitForTimeout(1000);message=await receipt(frame);}
     if(message){t.receipt={at:Date.now(),url:t.page.url(),message,method:'Automated employer browser confirmation',answers:t.review};await checkpoint(t);await progress(t,'Application sent. Employer confirmation saved.','submitted');await t.context.close();return;}
     await pause(t,'The employer did not provide a detectable receipt. The application may have been sent; automatic retries are disabled.','unknown');return;
    }
    const forward=await choose(frame,nextButton);if(forward){await progress(t,'Continuing to the next application page.');await forward.click();await t.page.waitForTimeout(900);await checkpoint(t);continue;}
    const register=await choose(frame,/^create (?:an? )?account$|^sign up$|^register$/i);if(register){t.creatingAccount=true;await register.click();await t.page.waitForTimeout(900);continue;}
    await t.page.waitForTimeout(1200);continue;
   }
   if(t.status!=='cancelled')await pause(t,'This application reached the browser step limit. Progress has been saved.','blocked');
  }catch(error){if(t.status==='cancelled')return;await progress(t,t.attempted?'Submission was interrupted. It may have reached the employer; automatic retries are disabled.':String(error.message).slice(0,500),t.attempted?'unknown':'blocked');await checkpoint(t).catch(()=>{});}
 }
 async function pump(){if(stopping||[...tasks.values()].some(t=>t.running))return;const t=[...tasks.values()].find(t=>t.status==='queued');if(!t)return;t.running=true;await progress(t,'Opening the application browser.');try{await drive(t);}finally{t.running=false;void pump();}}
 async function resume(id,{answers={},password,verificationCode}={}){
  const t=tasks.get(id);if(!t)throw Error('Application not found.');if(!['needs_input','needs_verification','needs_login','paused','blocked'].includes(t.status)||t.attempted)throw Error('This application cannot be resumed.');
  t.input||=await vault.read('task:'+id);checkAllowed(t.input);t.input.facts||={};
  for(const field of t.questions||[])if(Object.hasOwn(answers,field.id)&&field.kind!=='password')t.input.facts[questionKey(field.label)+'@'+new URL(t.input.job.url).origin]=answers[field.id];
  if(password){if(typeof password!=='string'||password.length>1000)throw Error('Invalid account password.');if(!t.accountScope)t.accountScope='account:'+new URL(t.input.job.url).origin+':'+t.input.email.trim().toLowerCase();t.account||=await vault.read(t.accountScope);t.account.password=password;t.account.registered=true;await vault.write(t.accountScope,t.account);delete t.loginAttempted;}
  if(verificationCode){if(!t.frame)throw Error('Verification expired. Resume the application first.');const field=t.frame.locator('input[autocomplete=one-time-code],input[name*=code i],input[id*=code i]').filter({visible:true});if(await field.count()!==1)throw Error('Use the verification screen to enter this code.');await field.fill(String(verificationCode));const verify=await choose(t.frame,/^verify(?: email| code)?$|^continue$|^confirm$/i);if(verify){await verify.click();await t.page.waitForTimeout(800);}}
  await vault.write('task:'+id,t.input);t.questions=[];delete t.preview;await progress(t,'Continuing your approved application.','queued');void pump();return publicTask(t);
 }
 async function interact(id,action){const t=tasks.get(id);if(!t?.page||t.status!=='needs_verification')throw Error('No employer verification is waiting.');if(action.type==='click'&&Number.isFinite(action.x)&&Number.isFinite(action.y)&&action.x>=0&&action.x<1100&&action.y>=0&&action.y<850)await t.page.mouse.click(action.x,action.y);else if(action.type==='text'&&typeof action.text==='string'&&action.text.length<=1000)await t.page.keyboard.insertText(action.text);else if(action.type==='key'&&['Tab','Enter','Space','Backspace','ArrowDown','ArrowUp'].includes(action.key))await t.page.keyboard.press(action.key);else if(action.type!=='refresh')throw Error('Unsupported verification action.');await t.page.waitForTimeout(400);t.preview=(await t.page.screenshot({type:'jpeg',quality:65})).toString('base64');return publicTask(t);}
 async function cancel(id){const t=tasks.get(id);if(!t)return;if(t.attempted)throw Error('Submission has already started. Wait for the receipt.');await progress(t,'Application cancelled.','cancelled');await t.context?.close();}
 function checkAllowed(input){if(P.blocked(input?.job?.company,policy.employerPreferences))throw Error('This company is blocked. Unblock it before applying.');if(P.hidden(input?.job?.url,policy.jobVisibility))throw Error('This job is hidden. Restore it before applying.');}
 async function updatePolicy(input){
  const next=P.validate(input);policyTail=policyTail.catch(()=>{}).then(async()=>{
   policy={employerPreferences:P.merge(policy.employerPreferences,next.employerPreferences),jobVisibility:P.merge(policy.jobVisibility,next.jobVisibility)};
   await writeFile(policyPath+'.tmp',JSON.stringify(policy),{mode:0o600});await rename(policyPath+'.tmp',policyPath);
   for(const t of tasks.values())if(!t.attempted&&!['cancelled','submitted','unknown'].includes(t.status)){
    t.input||=await vault.read('task:'+t.id);if(P.blocked(t.input.job.company,policy.employerPreferences)||P.hidden(t.input.job.url,policy.jobVisibility)){await progress(t,'Cancelled because the company or job is excluded.','cancelled');await t.context?.close();}
   }
   return structuredClone(policy);
  });return policyTail;
 }
 return {updatePolicy,policy:()=>structuredClone(policy),checkAllowed,apply,resume,interact,cancel,get:id=>{const t=tasks.get(id);if(!t)throw Error('Application not found.');return publicTask(t);},list:()=>[...tasks.values()].map(publicTask),close:async()=>{stopping=true;await browser?.close();await writeTail.catch(()=>{});await policyTail.catch(()=>{});}};
}
