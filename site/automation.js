/* One approval starts the private browser worker; no employer-site handoff. */
(() => {
 'use strict';
 const E=window.JobEngine,esc=escapeHTML,local=['127.0.0.1','localhost'].includes(location.hostname),origin='http://127.0.0.1:4317',hosted='https://lionsarmor.github.io';
 const tasks={},polling=new Set();let companionWindow,bridgeTimer;
 const running=t=>['queued','running','sending'].includes(t?.status);
 async function api(path,options={}){const response=await fetch('/api/automation'+path,{...options,headers:{'Content-Type':'application/json','X-America-Request':'1'},signal:AbortSignal.timeout(15000)});const data=await response.json();if(!response.ok)throw Error(data.error||'Application worker unavailable.');return data;}
 function changed(){E.emit();}
 async function remember(task){
  tasks[task.jobId]=task;const d=E.data.drafts[task.jobId];if(!d)return;
  d.automation={id:task.id,status:task.status,message:task.message,version:task.version};
  if(task.status==='submitted'&&d.stage!=='submitted')await E.recordSubmission(task.jobId,task.version,task.receipt);
  else await E.save();changed();
 }
 async function poll(task){
  if(polling.has(task.id))return;polling.add(task.id);
  try{while(running(task)){await new Promise(r=>setTimeout(r,1400));task=await api('/'+task.id);await remember(task);if(document.querySelector('#automation-progress')?.dataset.task===task.id)view(task.jobId);}}
  catch(error){toast('Application continues on this computer. Reopen its progress to reconnect.');}
  finally{polling.delete(task.id);}
 }
 function view(id){
  if(!local&&tasks[id]){openWorker(id,true);return;}
  const t=tasks[id],j=E.data.jobs[id];if(!t||!j)return;const waiting=['needs_input','needs_login'].includes(t.status),verification=t.status==='needs_verification';
  const heading=t.status==='submitted'?'Application sent':running(t)?'Applying for you…':t.status==='unknown'?'Checking delivery':waiting?'One missing detail':verification?'Employer verification':'Application progress';
  openModal('AUTOMATIC APPLICATION',`<div id="automation-progress" data-task="${esc(t.id)}"><h2>${heading}</h2><p>${esc(j.company)} · ${esc(j.title)}</p><div class="callout ${t.status==='submitted'?'green-callout':''}">${esc(t.message||'')}</div>${t.receipt?`<p>${esc(t.receipt.message)}</p><p>Employer receipt saved. You’re done.</p>`:''}${waiting?`<form id="automation-answers">${(t.questions||[]).map((f,i)=>`<label class="form-field">${esc(f.label)}${f.options?.length?`<select data-auto-field="${esc(f.id)}"><option value="">Choose…</option>${f.options.map(o=>`<option value="${esc(o.label)}">${esc(o.label)}</option>`).join('')}</select>`:`<input data-auto-field="${esc(f.id)}" type="${f.kind==='password'?'password':'text'}" autocomplete="${f.kind==='password'?'current-password':'off'}">`}</label>`).join('')}<p>${t.status==='needs_login'?'The password stays in the private account vault on this computer.':'Your answer is saved and reused. Jobbies completes the remaining steps.'}</p></form>`:''}${verification?`<label class="form-field">Email verification code, if requested<input id="automation-code" autocomplete="one-time-code"></label><details open><summary>Employer verification screen</summary><p>Click the screen to interact. Use the text box if the challenge needs typing.</p><img id="automation-screen" class="submission-preview" src="data:image/jpeg;base64,${t.preview||''}" alt="Employer verification screen"><div class="empty-actions"><input id="automation-screen-text" aria-label="Text for focused verification control"><button class="secondary-button" data-auto-action="type" data-id="${esc(id)}">Type</button><button class="secondary-button" data-auto-action="refresh" data-id="${esc(id)}">Refresh screen</button></div></details>`:''}<details><summary>Activity and completed answers</summary><ol>${(t.events||[]).map(e=>`<li>${esc(e.message)}</li>`).join('')}</ol><dl class="answers-list">${(t.fields||[]).map(f=>`<div class="answer-row"><dt>${esc(f.question)}</dt><dd>${esc(f.answer)}</dd></div>`).join('')}</dl></details></div>`,waiting||verification||t.status==='paused'?`<button class="primary-button" data-auto-action="resume" data-id="${esc(id)}">${waiting?'Save & continue':'Continue application'}</button>`:running(t)&&t.status!=='sending'?`<button class="secondary-button" data-auto-action="cancel" data-id="${esc(id)}">Cancel application</button>`:'');
 }
 async function encode(file){const bytes=new Uint8Array(await file.arrayBuffer());let str='';for(let i=0;i<bytes.length;i+=16384)str+=String.fromCharCode(...bytes.subarray(i,i+16384));return {name:file.name,type:file.type,base64:btoa(str)};}
 async function requestFor(id){
  const d=structuredClone(E.data.drafts[id]),j=E.data.jobs[id],facts={};
  if(!d?.approved||d.approvedVersion!==d.version)throw Error('Review this application before applying.');
  for(const q of E.questionCatalog()){const f=E.resolveFact(q.key,j);if(f.known)facts[q.key]=f.value;}
  for(const [key,f] of Object.entries(E.data.answers))facts[key]=f.value;
  for(const key of ['name','email','phone','linkedin','github','portfolio'])if(E.data.profile[key])facts[key]=E.data.profile[key];
  facts.first_name||=E.data.profile.name.split(' ')[0];facts.last_name||=E.data.profile.name.split(' ').slice(1).join(' ');
  const files={},resume=E.data.profile.resumes[d.resumeTrack];let file=resume.file;
  if(!file){const response=await fetch(E.resumeURL(resume));if(!response.ok)throw Error('Your selected resume could not be loaded.');file=new File([await response.blob()],resume.name);}
  const resumeId=d.fields.find(f=>f.key==='resume')?.id||'resume';files[resumeId]={...await encode(file),purpose:'resume'};
  for(const [field,attachment] of Object.entries(d.attachments||{}))if(attachment instanceof Blob)files[field]=await encode(attachment);
  for(const f of d.fields)if(f.key==='cover_letter'&&f.type==='input_file'&&d.coverLetter)files[f.id]={name:'Cover-letter.pdf',type:'application/pdf',coverLetterText:d.coverLetter};
  if(E.data.drafts[id].version!==d.version||!E.data.drafts[id].approved)throw Error('Your application changed. Review the current version.');
  E.data.drafts[id].pendingSubmissionSnapshot={...structuredClone(d.snapshot),fields:structuredClone(d.fields)};await E.save();
  const evidence=window.AmericaCompanion.evidence(j);
  return {job:{id:j.id,url:j.url,title:j.title,company:j.company,description:j.description,location:j.location},version:d.version,email:E.data.profile.email,fields:d.fields,values:d.values,coverLetter:d.coverLetter,files,facts,evidence,authorization:{reviewed:true,version:d.version,at:Date.now(),createEmployerAccount:true}};
 }
 function openWorker(id,track=false){
  const nonce=crypto.randomUUID();companionWindow=window.open(origin+'/?connect='+nonce+'#connect='+nonce,'jobbies-application-worker');
  if(!companionWindow)throw Error('Allow Jobbies to open its application worker window.');
  let acknowledged=false,transferring=false;
  const listener=async event=>{
   if(event.origin!==origin||event.source!==companionWindow||event.data?.nonce!==nonce)return;
   if(event.data.type==='jobbies-worker-ready'&&!transferring){
    transferring=true;try{const request=track?null:await requestFor(id),workspace=await E.exportWorkspace();companionWindow.postMessage({type:'jobbies-approved-application',nonce,request,workspace,trackJobId:track?id:null},origin);}
    catch(error){toast(error.message);}
   }
   if(event.data.type==='jobbies-worker-started'){acknowledged=true;clearTimeout(bridgeTimer);toast('Jobbies is applying in the connected worker.');}
   if(event.data.type==='jobbies-worker-task'){await remember(event.data.task);if(event.data.task.status==='submitted'){toast('Application sent. Employer receipt saved.');openModal('APPLICATION SENT',`<h2>Application sent</h2><p>${esc(E.data.jobs[id]?.company||'')} · ${esc(E.data.jobs[id]?.title||'')}</p><div class="callout green-callout">${esc(event.data.task.receipt?.message||'Employer confirmation saved.')}</div>`);}if(document.querySelector('#automation-progress')&&local)view(id);}
   if(event.data.type==='jobbies-worker-error'){toast(event.data.message);clearTimeout(bridgeTimer);}
  };
  window.addEventListener('message',listener);
  bridgeTimer=setTimeout(()=>{if(!acknowledged)toast('The application worker did not connect. Open Jobbies Private on this computer, then retry Apply. Your application is saved.');},15000);
  // Keep the authenticated window channel alive for progress and receipts.
  openModal('AUTOMATIC APPLICATION','<h2>Connecting your application browser…</h2><p>Your approved application and saved profile are being sent directly to Jobbies Private on this computer.</p>');
 }
 async function apply(id){
  if(!local){openWorker(id);return;}
  const prior=tasks[id];if(prior&&!['cancelled','blocked'].includes(prior.status)){view(id);void poll(prior);return;}
  const request=await requestFor(id),task=await api('/apply',{method:'POST',body:JSON.stringify(request)});await remember(task);view(id);void poll(task);
 }
 async function init(){
  if(!local){for(const [id,d] of Object.entries(E.data.drafts))if(d.automation)tasks[id]={...d.automation,jobId:id};return;}
  const match=location.hash.match(/^#connect=([a-zA-Z0-9-]{36})$/);
  if(match&&window.opener){
   const nonce=match[1],parent=window.opener;let received=false;
   const listener=async event=>{
    if(received||event.origin!==hosted||event.source!==parent||event.data?.nonce!==nonce||event.data.type!=='jobbies-approved-application')return;received=true;clearInterval(hello);
    try{
     const {workspace,request,trackJobId}=event.data;if(workspace?.format!=='america-workspace-v1'||(!trackJobId&&request?.authorization?.reviewed!==true))throw Error('Invalid application transfer.');
     // Preserve the private workspace's other applications and newer saved answers.
     const previous=await E.exportWorkspace(),incoming=workspace.data;
     incoming.jobs={...previous.data.jobs,...incoming.jobs};incoming.drafts={...previous.data.drafts,...incoming.drafts};
     for(const [key,d] of Object.entries(previous.data.drafts))if(d.stage==='submitted')incoming.drafts[key]=d;
     incoming.businessLeads={...previous.data.businessLeads,...incoming.businessLeads};
     for(const [key,f] of Object.entries(previous.data.answers))if((f.confirmedAt||0)>(incoming.answers[key]?.confirmedAt||0))incoming.answers[key]=f;
     if(request&&incoming.drafts[request.job.id]?.stage==='submitted')throw Error('This application was already submitted.');
     if(trackJobId&&previous.data.drafts[trackJobId])incoming.drafts[trackJobId]=previous.data.drafts[trackJobId];
     incoming.companionSyncRevision=previous.data.companionSyncRevision;await E.importWorkspace(workspace);
     if(request&&E.data.drafts[request.job.id].version!==request.version)throw Error('This application changed during transfer. Review the current version.');
     let task;if(trackJobId){const records=await api('');task=records.applications.find(t=>t.jobId===trackJobId);if(!task)throw Error('This application is not on this computer.');task=await api('/'+task.id);}else task=await api('/apply',{method:'POST',body:JSON.stringify(request)});await remember(task);view(task.jobId);
     parent.postMessage({type:'jobbies-worker-started',nonce},hosted);
     const forward=()=>{const t=tasks[task.jobId];if(t)parent.postMessage({type:'jobbies-worker-task',nonce,task:t},hosted);};E.subscribe(forward);forward();void poll(task);history.replaceState(null,'','#review');
    }catch(error){parent.postMessage({type:'jobbies-worker-error',nonce,message:error.message},hosted);toast(error.message);}
   };
   window.addEventListener('message',listener);const hello=setInterval(()=>parent.postMessage({type:'jobbies-worker-ready',nonce},hosted),500);setTimeout(()=>clearInterval(hello),30000);parent.postMessage({type:'jobbies-worker-ready',nonce},hosted);
  }
  try{const result=await api('');for(const t of result.applications||[])if(E.data.drafts[t.jobId]){await remember(t);if(running(t))void poll(t);}}catch{}
 }
 document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-auto-action]');if(!button)return;event.preventDefault();const id=button.dataset.id,t=tasks[id];if(!t)return;
  try{
   button.disabled=true;
   if(button.dataset.autoAction==='resume'){
    const answers={};let password;document.querySelectorAll('[data-auto-field]').forEach(el=>{if(el.type==='password')password=el.value;else answers[el.dataset.autoField]=el.value;});
    for(const f of t.questions||[])if(f.kind!=='password'&&answers[f.id]){
     const meaning=E.fieldMeaning(f.label,E.data.jobs[id],f.options||[]);
     if(meaning.key&&!meaning.inverted&&meaning.threshold===undefined)await E.answer(meaning.key,answers[f.id]);
     else {const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(f.label.toLowerCase().replace(/[\s*]+/g,' ').trim()));const key='employer_question:'+Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')+'@'+new URL(E.data.jobs[id].url).origin;await E.answer(key,answers[f.id]);}
    }
    const task=await api('/'+t.id+'/resume',{method:'POST',body:JSON.stringify({answers,password,verificationCode:document.querySelector('#automation-code')?.value||undefined})});await remember(task);view(id);void poll(task);
   }
   if(button.dataset.autoAction==='cancel'){await api('/'+t.id,{method:'DELETE',body:'{}'});const task=await api('/'+t.id);await remember(task);view(id);}
   if(['type','refresh'].includes(button.dataset.autoAction)){const task=await api('/'+t.id+'/interact',{method:'POST',body:JSON.stringify(button.dataset.autoAction==='type'?{type:'text',text:document.querySelector('#automation-screen-text').value}:{type:'refresh'})});await remember(task);view(id);}
  }catch(error){toast(error.message);}finally{button.disabled=false;}
 });
 document.addEventListener('click',async event=>{if(event.target.id!=='automation-screen')return;const img=event.target,t=Object.values(tasks).find(t=>t.id===document.querySelector('#automation-progress')?.dataset.task);if(!t)return;const rect=img.getBoundingClientRect();try{const task=await api('/'+t.id+'/interact',{method:'POST',body:JSON.stringify({type:'click',x:(event.clientX-rect.left)*1100/rect.width,y:(event.clientY-rect.top)*850/rect.height})});await remember(task);view(task.jobId);}catch(error){toast(error.message);}});
 window.JobbiesAutomation={init,apply,view,tasks};
})();
