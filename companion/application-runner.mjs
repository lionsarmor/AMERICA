/* Local, reviewed browser submission. No employer writes occur during preparation. */
import {chromium} from 'playwright';
import {createHash,randomBytes} from 'node:crypto';
import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
const supportedHost=new Set(['boards.greenhouse.io','job-boards.greenhouse.io','boards.eu.greenhouse.io','job-boards.eu.greenhouse.io']);
export function supportedApplicationURL(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&supportedHost.has(u.hostname)&&/\/jobs\/\d+\/?$/.test(u.pathname);}catch{return false;}}
export function validateApplication(input){
 if(!input?.job?.url||!supportedApplicationURL(input.job.url))throw Error('Direct browser submission currently supports hosted Greenhouse job forms only.');
 if(!input.job.id||!Number.isInteger(input.version)||input.version<1||!Array.isArray(input.fields)||!input.values||!input.email||!/^\S+@\S+\.\S+$/.test(input.email))throw Error('A complete versioned application and contact email are required.');
 if(input.fields.length>200)throw Error('This form needs employer-site review.');
 for(const field of input.fields){
  if(!field.id||field.internal)continue;
  if(field.required&&(input.values[field.id]===undefined||input.values[field.id]===null||String(input.values[field.id]).trim()===''))throw Error('Finish the required answer: '+field.label);
 }
 return input;
}
const confirmed=/thank you for applying|application (?:has been |was )?(?:successfully )?(?:submitted|received)|we(?:'ve| have) received your application/i;
export async function createApplicationRunner({directory,launch=()=>chromium.launch({headless:true}),allowURL=supportedApplicationURL,validate=validateApplication}={}){
 await mkdir(directory,{recursive:true,mode:0o700});
 const ledgerPath=join(directory,'receipts.json');let ledger=JSON.parse(await readFile(ledgerPath,'utf8').catch(()=> '{}')),writeTail=Promise.resolve();const tasks=new Map();let browser,launching;
 const persist=()=>{const snapshot=JSON.stringify(ledger);writeTail=writeTail.catch(()=>{}).then(async()=>{const tmp=ledgerPath+'.tmp';await writeFile(tmp,snapshot,{mode:0o600});await rename(tmp,ledgerPath);});return writeTail;};
 const fingerprint=input=>createHash('sha256').update(JSON.stringify(input)).digest('hex');
 const keyFor=input=>createHash('sha256').update(new URL(input.job.url).origin+new URL(input.job.url).pathname+'\n'+input.email.trim().toLowerCase()).digest('hex');
 const publicTask=t=>({id:t.id,jobId:t.input.job.id,version:t.input.version,status:t.status,error:t.error,preview:t.preview,fields:t.review,receipt:t.receipt,fingerprint:t.fingerprint});
 const success=async frame=>{const heading=frame.getByRole('heading',{name:confirmed});if(await heading.count()&&await heading.first().isVisible())return (await heading.first().innerText()).slice(0,500);return '';};
 async function prepare(input){
  validate(input);if(!allowURL(input.job.url))throw Error('Unsupported employer form.');
  const key=keyFor(input),existing=ledger[key];
  if(existing)throw Error(existing.status==='submitted'?'This application was already sent. Check Applications.':'A previous send may have reached the employer. Verify its receipt before trying again.');
  for(const task of tasks.values())if(task.key===key&&['preparing','ready','sending'].includes(task.status)){if(task.status==='sending'||task.fingerprint===fingerprint(input))return publicTask(task);task.status='cancelled';await task.context?.close();}
  if([...tasks.values()].filter(t=>['preparing','ready','sending'].includes(t.status)).length>=3)throw Error('Finish or cancel an open application review first.');
  const task={id:randomBytes(24).toString('hex'),key,input:structuredClone(input),fingerprint:fingerprint(input),status:'preparing',review:[],createdAt:Date.now()};tasks.set(task.id,task);
  void fill(task);return publicTask(task);
 }
 async function fill(t){
  try{
   browser||=await (launching||=launch().catch(error=>{launching=null;throw error;}));t.context=await browser.newContext({viewport:{width:1100,height:900},acceptDownloads:false});
   await t.context.route('**/*',async route=>{
    const req=route.request(),u=new URL(req.url());
    if(!['https:','data:','blob:'].includes(u.protocol)||/^(?:localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[)/i.test(u.hostname)||/^172\.(?:1[6-9]|2\d|3[01])\./.test(u.hostname))return route.abort();
    // Never allow a submission while preparing a preview.
    if(t.status!=='sending'&&req.method()!=='GET'&&req.method()!=='HEAD')return route.abort();
    return route.fallback();
   });
   t.page=await t.context.newPage();await t.page.goto(t.input.job.url,{waitUntil:'domcontentloaded',timeout:30000});
   await t.page.waitForTimeout(1200);
   t.frame=t.page.frames().find(f=>allowURL(f.url())&&f!==t.page.mainFrame())||t.page.mainFrame();
   if(!allowURL(t.frame.url()))throw Error('Employer redirected to an unsupported form.');
   if(await success(t.frame))throw Error('This page is already a confirmation page; no submission was made.');
   const controls=t.frame.locator('input:not([type=hidden]), textarea, select');await controls.first().waitFor({timeout:12000});
   for(const f of t.input.fields){
    if(f.internal)continue;const value=t.input.values[f.id];if(value===undefined||value===null||value==='')continue;
    const id=String(f.id).replace(/["\\]/g,'\\$&');let control=t.frame.locator(`[name="${id}"], [id="${id}"]`).filter({visible:true});
    if(!await control.count())control=t.frame.getByLabel(f.originalLabel||f.label,{exact:true});
    if(!await control.count()&&f.key==='resume')control=t.frame.locator('input[type=file][name*=resume], input[type=file][id*=resume]');
    if(!await control.count()){if(f.required)throw Error('Could not map the required employer control: '+f.label);continue;}
    const el=control.first(),tag=await el.evaluate(e=>e.tagName.toLowerCase()),type=await el.getAttribute('type');
    const label=v=>f.options?.find(o=>String(o.value)===String(v))?.label||String(v);
    if(type==='file'){
      const file=t.input.files?.[f.id];if(!file){if(f.required)throw Error('Attachment missing: '+f.label);continue;}
      if(typeof file.coverLetterText==='string'){
        if(file.coverLetterText.length>10000)throw Error('Cover letter is too long.');
        const letter=await t.context.newPage();await letter.setContent('<html><head><meta charset="utf-8"></head><body><main style="white-space:pre-wrap;font:12pt Arial;line-height:1.5"></main></body></html>');
        await letter.locator('main').evaluate((el,value)=>el.textContent=value,file.coverLetterText);
        file.base64=(await letter.pdf({format:'Letter',margin:{top:'0.7in',right:'0.8in',bottom:'0.7in',left:'0.8in'}})).toString('base64');await letter.close();
      }
      if(!/^[a-zA-Z0-9+/=\r\n]+$/.test(file.base64||''))throw Error('Invalid attachment.');
      const buffer=Buffer.from(file.base64,'base64');if(buffer.length>10*1024*1024)throw Error('Attachment exceeds 10 MB.');
      await el.setInputFiles({name:String(file.name).replace(/[/\\]/g,'_'),mimeType:file.type||'application/octet-stream',buffer});
    }else if(tag==='select'){
      const vals=Array.isArray(value)?value:[value];try{await el.selectOption(vals.map(String));}catch{await el.selectOption(vals.map(v=>({label:label(v)})));}
    }else if(type==='radio'||type==='checkbox'){
      const vals=(Array.isArray(value)?value:[value]).map(String);
      for(const c of await control.all()){const v=await c.getAttribute('value');await c.setChecked(vals.includes(v));}
    }else if(tag==='input'||tag==='textarea'){
      if(await el.getAttribute('role')==='combobox')throw Error('This employer uses a custom selector. Finish that control on the employer site: '+f.label);
      await el.fill(String(value));
    }else throw Error('This employer control needs manual review: '+f.label);
    t.review.push({question:f.label,answer:type==='file'?t.input.files[f.id].name:Array.isArray(value)?value.map(label).join(', '):label(value)});
   }
   const invalid=await t.frame.locator('input:invalid,select:invalid,textarea:invalid').evaluateAll(es=>es.filter(e=>e.getClientRects().length).map(e=>e.labels?.[0]?.innerText||e.name||e.id));
   if(invalid.length)throw Error('Employer requires additional fields: '+invalid.slice(0,8).join(', '));
   if(await t.frame.locator('iframe[src*=recaptcha],iframe[src*=hcaptcha],iframe[src*=challenges]').count())throw Error('Employer verification is required. Complete this application on its site.');
   const submit=t.frame.getByRole('button',{name:/^(?:submit(?: application)?|apply(?: now)?)$/i});
   if(await submit.count()!==1||!await submit.isEnabled())throw Error('A single enabled employer Submit button could not be verified.');
   if(t.status==='cancelled'){await t.context?.close();return;}
   t.preview=(await t.page.screenshot({fullPage:true,type:'jpeg',quality:65})).toString('base64');t.status='ready';
  }catch(error){t.status='blocked';t.error=error.message.slice(0,600);await t.context?.close();}
 }
 async function submit(id,{fingerprint:expected,reviewed}={}){
  const t=tasks.get(id);if(!t)throw Error('Application preview expired. Prepare it again.');
  if(t.status==='submitted'||t.status==='sending'||t.status==='unknown')return publicTask(t);
  if(t.status!=='ready'||reviewed!==true||expected!==t.fingerprint)throw Error('Review the current prepared application before sending.');
  if(Date.now()-t.createdAt>30*60000){t.status='expired';await t.context?.close();throw Error('Preview expired. Prepare the current form again.');}
  if(ledger[t.key])throw Error('This application already has a send attempt. Check its receipt.');
  t.status='sending';ledger[t.key]={status:'sending',jobId:t.input.job.id,url:t.input.job.url,version:t.input.version,attemptedAt:Date.now()};
  try{await persist();}catch(error){delete ledger[t.key];t.status='ready';throw error;}
  void (async()=>{
   try{
    if(!allowURL(t.frame.url())||await success(t.frame))throw Error('The employer page changed before submission.');
    await t.frame.getByRole('button',{name:/^(?:submit(?: application)?|apply(?: now)?)$/i}).click({timeout:10000});
    let receipt='';for(let i=0;i<30&&!receipt;i++){await t.page.waitForTimeout(1000);receipt=await success(t.frame);}
    if(!receipt)throw Error('No employer confirmation was detected. The application may have been sent; check with the employer before retrying.');
    t.status='submitted';t.receipt={at:Date.now(),url:t.page.url(),message:receipt,method:'Employer browser confirmation'};ledger[t.key]={...ledger[t.key],status:'submitted',receipt:t.receipt};await persist();
   }catch(error){t.status='unknown';t.error=error.message.slice(0,600);ledger[t.key]={...ledger[t.key],status:'unknown',error:t.error};await persist().catch(()=>{});}
   finally{delete t.preview;await t.context?.close();}
  })();return publicTask(t);
 }
 async function cancel(id){const t=tasks.get(id);if(!t)return;if(t.status==='sending')throw Error('Sending has begun. Wait for its receipt.');t.status='cancelled';await t.context?.close();}
 const sweep=setInterval(()=>{for(const [id,t] of tasks)if(Date.now()-t.createdAt>30*60000&&t.status!=='sending'){void t.context?.close();tasks.delete(id);}},60000);sweep.unref();
 return {prepare,submit,get:id=>{const t=tasks.get(id);if(!t)throw Error('Application preview expired.');return publicTask(t);},cancel,close:async()=>{clearInterval(sweep);await browser?.close();await writeTail.catch(()=>{});}};
}
