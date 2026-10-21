/* Private companion client. The public site never receives Codex credentials. */
(() => {
  'use strict';
  const E=window.JobEngine,local=['127.0.0.1','localhost'].includes(location.hostname),esc=escapeHTML;
  const state={connected:false,message:local?'Checking the private companion…':'Open the private companion to use Codex.',tasks:{},applications:{},backup:'',conflict:false};
  let savingBackup=false,backupQueued=false;
  let enabled=false,working=false,syncTimer,pumpTimer,booting=true,remoteRevision=null;
  const attempted=new Map();
  async function api(path,options={}){
    const r=await fetch('/api/'+path,{...options,headers:{'Content-Type':'application/json','X-America-Request':'1',...options.headers},signal:options.signal||AbortSignal.timeout(10000)});
    const body=await r.json();if(!r.ok)throw new Error(body.error||'The private companion is unavailable.');return body;
  }
  function notify(){window.dispatchEvent(new Event('america-companion-change'));}
  async function connect(){
    if(!local)return;
    try{const health=await api('health');state.connected=health.app==='america-companion'&&health.signedIn;state.message=health.message;}
    catch{state.connected=false;state.message='Start the private companion on this computer to use Codex.';}
    notify();if(state.connected)schedule();
  }
  async function backup(){
    if(!enabled||booting||state.conflict)return;
    if(savingBackup){backupQueued=true;return;}savingBackup=true;
    try{const bundle=await E.exportWorkspace();const result=await api('workspace',{method:'PUT',body:JSON.stringify({...bundle,baseRevision:remoteRevision})});remoteRevision=result.revision;E.data.companionSyncRevision=remoteRevision;await E.save();state.backup='Saved on this computer · '+new Date(result.savedAt).toLocaleTimeString();}
    catch(error){state.backup='Backup needs attention: '+error.message;if(/newer|another/i.test(error.message))state.conflict=true;}
    finally{savingBackup=false;if(backupQueued){backupQueued=false;void backup();}}
    notify();
  }
  function evidence(job){
    const p=E.data.profile,list=[];
    for(const track of ['technician','software'])for(const [i,text] of (p.resumeEvidence?.[track]||[]).entries())list.push({id:'resume:'+track+':'+i,text,source:'Original '+track+' resume'});
    for(const q of E.questionCatalog()){const fact=E.resolveFact(q.key);if(fact.known&&(E.data.answers[q.key]||!/^skill:|^skill_summary:|^years_experience:|summary$/.test(q.key)))list.push({id:'fact:'+q.key,text:q.label+'\n'+(Array.isArray(fact.value)?fact.value.join('; '):String(fact.value)),source:fact.source});}
    for(const [key,fact] of Object.entries(E.data.answers))if(!list.some(e=>e.id==='fact:'+key))list.push({id:'fact:'+key,text:(fact.label||key)+'\n'+String(fact.value),source:'Applicant-confirmed answer'});
    for(const d of Object.values(E.data.drafts))for(const f of d.fields){
      if(d.fieldSources[f.id]!=='application_edit'||!d.values[f.id]||f.type==='input_file')continue;
      const same=E.data.jobs[d.jobId]?.company===job.company,dependent=/this (role|position|company)|why.*(interest|join|work)|salary|start|available|notice|project|worked here|previously applied/i.test(f.label+' '+f.context);
      if(dependent&&!same)continue;
      const labels=value=>f.options?.find(o=>String(o.value)===String(value))?.label||String(value),value=Array.isArray(d.values[f.id])?d.values[f.id].map(labels).join('; '):labels(d.values[f.id]);
      list.push({id:'confirmed:'+d.jobId+':'+f.id,text:f.label+'\n'+(f.context||'')+'\nAnswer: '+value,source:'Your answer for '+E.data.jobs[d.jobId]?.company});
    }
    return list.slice(0,500);
  }
  function requestFor(id){
    const d=E.data.drafts[id],j=E.data.jobs[id];if(!d||!j||!j.recommended||d.stage==='submitted'||d.questionsNeedRefresh||E.data.archived[id]||E.isBlocked(j))return null;
    const fields=d.fields.filter(f=>!f.incomplete&&!f.internal&&f.type!=='input_file'&&!window.ApplicantAnswerPolicy.restricted(f)&&d.fieldSources[f.id]!=='application_edit'&&(d.values[f.id]===undefined||d.values[f.id]===null||d.values[f.id]===''||Array.isArray(d.values[f.id])&&!d.values[f.id].length)).map(f=>({id:f.id,question:f.label,context:f.context||'',type:f.type,options:f.options||[],key:f.key}));
    if(d.coverLetterSource!=='codex_draft'&&d.coverLetterSource!=='application_edit')fields.unshift({id:'jobbies_cover_letter',key:'cover_letter',question:'Write a concise, tailored first-person cover letter for this position. Use only supplied candidate evidence. Return a complete letter with greeting and closing, ready for the applicant to review.',context:'Focus on the relevant work, not generic enthusiasm. Do not invent accomplishments or promises.',type:'textarea',options:[]});
    if(!fields.length)return null;
    return {job:{id:j.id,company:j.company,title:j.title,description:j.description,location:j.location},fields,evidence:evidence(j)};
  }
  function signature(id){const d=E.data.drafts[id];return JSON.stringify([E.data.knowledgeRevision||1,d?.questionVersion,d?.fields.map(f=>[f.id,f.label,f.context,f.type,f.options]),E.data.jobs[id]?.descriptionFingerprint,d?.fields.filter(f=>d.fieldSources[f.id]==='application_edit').map(f=>[f.id,d.values[f.id]])]);}
  async function draft(id,force=false){
    if(!state.connected||working)return;
    if(state.conflict){toast('Choose which workspace to keep in Intelligence before drafting.');return;}
    const request=requestFor(id);if(!request)return;
    const sig=signature(id);if(!force&&(attempted.get(id)===sig||E.data.drafts[id].ai?.attemptSignature===sig))return;
    const d=E.data.drafts[id],expected={version:d.version,knowledgeRevision:E.data.knowledgeRevision||1};
    attempted.set(id,sig);working=true;state.tasks[id]={status:'queued'};notify();
    try{
      let task=await api('draft',{method:'POST',body:JSON.stringify(request)});state.tasks[id]=task;notify();
      while(['queued','running'].includes(task.status)){
        await new Promise(resolve=>setTimeout(resolve,1500));task=await api('tasks/'+task.id);state.tasks[id]=task;notify();
      }
      if(task.status==='completed'){
        const applied=E.applyCodexDraft(id,task.result,expected);if(applied){E.data.drafts[id].ai.attemptSignature=sig;await E.save();}state.tasks[id]={...task,status:applied?'completed':'stale',message:applied?'Drafted answers are ready for your review.':'Your application changed during drafting. Retry to use the latest facts.'};
      }else state.tasks[id]={...task,message:task.error||'Drafting stopped. Retry when ready.'};
    }catch(error){state.tasks[id]={status:'failed',message:error.message};}
    finally{working=false;notify();schedule();}
  }
  function schedule(){
    clearTimeout(pumpTimer);if(location.pathname.endsWith('/contracts.html')||!enabled||!state.connected||booting||working||state.conflict||!E.data.settings.codexAutoDraft)return;
    pumpTimer=setTimeout(()=>{const id=Object.keys(E.data.drafts).find(id=>requestFor(id)&&attempted.get(id)!==signature(id)&&E.data.drafts[id].ai?.attemptSignature!==signature(id));if(id)draft(id);},700);
  }
  async function download(){
    const bundle=await E.exportWorkspace(),url=URL.createObjectURL(new Blob([JSON.stringify(bundle)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='Jobbies-private-workspace-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Workspace backup downloaded. It includes your private answers and application history.');
  }
  async function restore(){const saved=await api('workspace');if(!saved.workspace){toast('There is no companion backup yet.');return;}await E.importWorkspace(saved.workspace);remoteRevision=saved.revision;state.conflict=false;attempted.clear();await backup();schedule();E.emit();}
  async function init(){
    if(!local){booting=false;return;}
    await connect();
    try{
      const saved=await api('workspace');enabled=true;remoteRevision=saved.revision;
      const blank=!Object.keys(E.data.jobs).length&&!Object.keys(E.data.drafts).length&&!Object.keys(E.data.businessLeads||{}).length&&!E.data.businessProfile?.updatedAt&&Object.keys(E.data.answers).every(k=>['salary_target','travel_percent','work_arrangements'].includes(k)&&!E.data.answers[k].confirmedAt);
      if(saved.workspace&&blank){await E.importWorkspace(saved.workspace);E.data.companionSyncRevision=saved.revision;}
      else if(saved.workspace&&E.data.companionSyncRevision!==saved.revision)state.conflict=true;
      state.backup=state.conflict?'Another browser has a newer backup. Restore it, or explicitly use this browser version.':saved.workspace?'Private backup available on this computer.':'Local backups will begin as you work.';
      E.data.settings.codexAutoDraft??=true;
    }catch{enabled=false;}
    booting=false;
    E.subscribe(()=>{clearTimeout(syncTimer);if(!booting)syncTimer=setTimeout(backup,600);schedule();});
    schedule();notify();
    if(enabled){const note=document.querySelector('#workspace-storage-note');if(note)note.textContent='Local browser + private computer backup · Employer-site submission';await E.save();await backup();}
    setInterval(connect,30000);
  }
  function panel(){
    const tasks=Object.entries(state.tasks).map(([id,t])=>`<article class="intelligence-task"><div><strong>${esc(E.data.jobs[id]?.company||'Employer')}</strong><p>${esc(E.data.jobs[id]?.title||'Application')}</p><small>${esc(t.message||({queued:'Waiting for Codex',running:'Reading the question and your evidence…',completed:'Draft ready',failed:'Needs attention'})[t.status]||t.status)}</small></div>${t.status==='completed'?`<button class="secondary-button" data-live-action="application" data-id="${esc(id)}">Review draft</button>`:['failed','stale'].includes(t.status)?`<button class="secondary-button" data-companion-action="retry" data-id="${esc(id)}">Retry</button>`:`<button class="text-button" data-companion-action="cancel" data-id="${esc(id)}">Cancel</button>`}</article>`).join('');
    return `<div class="section-heading"><div><h2>Your application assistant</h2><p>Complete questions, relevant evidence, and fewer things to type.</p></div><span class="intelligence-status ${state.connected?'connected':''}">${state.connected?'Codex connected':'Companion offline'}</span></div><div class="intelligence-grid"><section class="profile-panel"><h3>${state.connected?'Your private companion is ready.':'Bring Codex into your job search.'}</h3><p>${esc(state.message)}</p>${local?`<button class="secondary-button" data-companion-action="connect">Check connection</button><label class="toggle-label intelligence-toggle"><input type="checkbox" id="codex-auto-draft" ${E.data.settings.codexAutoDraft?'checked':''} ${!enabled?'disabled':''}> Automatically draft unanswered application questions</label><p>Codex drafts supported responses and leaves unknowns for the wizard. Every application still comes to you for review.</p><p class="workspace-footnote">Drafting uses your Codex account allowance. Up to 24 new reasoning requests per day; identical requests reuse their result.</p>`:`<a class="primary-button" href="http://127.0.0.1:4317/#intelligence" target="_blank" rel="noopener noreferrer">Open private workspace ↗</a><p>On your computer, launch <strong>Jobbies Private</strong> or run <code>npm start</code> in the project folder. The private workspace uses the Codex sign-in on that computer.</p>`}<div class="callout">Your confirmed facts come first. Codex drafts show their evidence; missing facts stay unknown. Corrections become context for future applications.</div></section><section class="profile-panel"><h3>Keep your progress</h3><p>Move your saved answers, application history, and uploaded resumes between this site and your private workspace.</p><div class="empty-actions"><button class="secondary-button" data-companion-action="download">Download workspace backup</button><label class="secondary-button" for="workspace-backup-file">Import workspace backup</label><input class="sr-only" id="workspace-backup-file" type="file" accept=".json,application/json"></div><p class="workspace-footnote">Import replaces the current browser workspace with the backup, including its submission history.</p>${enabled?`<p>${esc(state.backup)}</p><button class="text-button" data-companion-action="restore">Restore companion backup</button>${state.conflict?'<button class="text-button" data-companion-action="keep-local">Use this browser version instead</button>':''}`:''}</section></div><section class="answers-section"><div class="answers-section-heading"><div><h3>Intelligent drafting</h3><p>Supported answers go to application review. Unresolved questions stay in the wizard.</p></div>${state.connected?'<button class="primary-button" data-companion-action="draft-next">Draft next application</button>':''}</div>${tasks||'<p>No Codex drafts in this session yet. Prepare applications to get started.</p>'}</section>`;
  }
  function canSubmit(job){
    if(!local||!enabled)return false;
    try{const u=new URL(job.url);return u.protocol==='https:'&&['boards.greenhouse.io','job-boards.greenhouse.io','boards.eu.greenhouse.io','job-boards.eu.greenhouse.io'].includes(u.hostname)&&/\/jobs\/\d+\/?$/.test(u.pathname);}catch{return false;}
  }
  async function encodedFile(file){
    const bytes=new Uint8Array(await file.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));return {name:file.name||'resume.docx',type:file.type,base64:btoa(binary)};
  }
  function submissionView(task,id){
    const job=E.data.jobs[id],ready=task.status==='ready',sent=task.status==='submitted';
    openModal('APPLICATION DELIVERY',`<div id="submission-review" data-task-id="${esc(task.id)}"><h2>${sent?'Application sent':ready?'Review the actual employer form':task.status==='sending'?'Sending your application…':task.status==='preparing'?'Preparing the employer form…':'Application needs attention'}</h2><p>${esc(job.company)} · ${esc(job.title)}</p>${task.error?`<div class="callout">${esc(task.error)}</div>`:''}${sent?`<div class="callout green-callout">${esc(task.receipt.message)}</div><p>Employer confirmation received. A receipt is saved with this application.</p>`:ready?`<p>Check the completed form, cover letter, and attached files. Send transmits this reviewed version to the employer.</p><details open><summary>Cover letter</summary><div class="description-text">${esc(E.data.drafts[id]?.pendingSubmissionSnapshot?.coverLetter||'')}</div></details><dl class="answers-list">${task.fields.map(f=>`<div class="answer-row"><dt>${esc(f.question)}</dt><dd>${esc(f.answer)}</dd></div>`).join('')}</dl><details><summary>Inspect employer-form preview</summary><img class="submission-preview" alt="Completed employer application form" src="data:image/jpeg;base64,${task.preview}"></details>`:task.status==='preparing'?'<p>Your saved profile and reviewed application answers are being filled into the employer’s form. Nothing has been sent.</p>':task.status==='sending'?'<p>Waiting for the employer’s confirmation. Do not submit a second application.</p>':''}</div>`,ready?`<button class="secondary-button" data-companion-action="edit-submission" data-id="${esc(id)}">Edit package</button><button class="secondary-button" data-companion-action="cancel-submission" data-id="${esc(id)}">Cancel</button><button class="primary-button" data-companion-action="send-application" data-id="${esc(id)}">Send application ${icon('arrow')}</button>`:['blocked','unknown','expired'].includes(task.status)?`<a class="secondary-button" href="${esc(job.url)}" target="_blank" rel="noopener noreferrer">Open employer site ↗</a>`:'');
  }
  async function pollSubmission(id){
    let task=state.applications[id];
    while(['preparing','sending'].includes(task.status)){
      await new Promise(r=>setTimeout(r,1000));task=await api('applications/'+task.id);state.applications[id]=task;
      if(document.querySelector('#submission-review')?.dataset.taskId===task.id)submissionView(task,id);
    }
    if(task.status==='submitted'){
      await E.recordSubmission(id,task.version,task.receipt);toast('Application sent. Employer confirmation saved.');
    }
    if(['blocked','unknown'].includes(task.status))toast(task.error);
    return task;
  }
  async function prepareSubmission(id,{preReview=false}={}){
    const d=structuredClone(E.data.drafts[id]),j=E.data.jobs[id];if(!d||!canSubmit(j))throw Error('Open the local companion for supported employer-form submission.');
    if(d.missing.length||!preReview&&!d.approved)throw Error('Review and complete this application before preparing its employer form.');
    const files={};
    for(const f of d.fields.filter(f=>f.type==='input_file')){
      let file=d.attachments?.[f.id];
      if(f.key==='resume'){const r=E.data.profile.resumes[d.resumeTrack];file=r.file;if(!file){const response=await fetch(E.resumeURL(r));if(!response.ok)throw Error('Resume could not be loaded.');file=new File([await response.blob()],r.name);}}
      if(f.key==='cover_letter'&&d.coverLetter){files[f.id]={name:'Cover-letter.pdf',type:'application/pdf',coverLetterText:d.coverLetter};continue;}
      if(file)files[f.id]=await encodedFile(file);
    }
    if(E.data.drafts[id]?.version!==d.version||!preReview&&!E.data.drafts[id]?.approved)throw Error('The application changed while preparing files. Review the latest version.');
    E.data.drafts[id].pendingSubmissionSnapshot={version:d.version,job:structuredClone(j),values:structuredClone(d.values),coverLetter:d.coverLetter,note:d.note,base:d.base,resume:E.data.profile.resumes[d.resumeTrack],attachments:structuredClone(d.attachments||{}),fields:structuredClone(d.fields)};await E.save();
    const request={job:{id:j.id,url:j.url,title:j.title,company:j.company},version:d.version,email:E.data.profile.email,fields:d.fields,values:d.values,files};
    const task=await api('applications/prepare',{method:'POST',body:JSON.stringify(request)});state.applications[id]=task;submissionView(task,id);await pollSubmission(id);
  }
  function applicationPanel(d){
    const task=state.tasks[d.jobId],canDraft=!!requestFor(d.jobId);
    return `<div class="codex-review"><strong>${d.ai?'Codex helped prepare this application':state.connected?'Codex assistant connected':'Intelligent drafting'}</strong><p>${esc(task?.message||d.ai?.summary||'Use your resumes and saved answers to draft unanswered questions.')}</p>${d.stage!=='submitted'&&state.connected?`<button class="secondary-button" type="button" data-companion-action="retry" data-id="${esc(d.jobId)}" ${working||!canDraft?'disabled':''}>${working?'Codex is drafting…':canDraft?'Draft missing answers':'No additional answers to draft'}</button>`:!state.connected?'<a class="text-button" href="#intelligence" data-live-view="intelligence">Open intelligence settings</a>':''}</div>`;
  }
  function fieldEvidence(f,d){const a=d.ai?.fields?.[f.id];if(!a||d.fieldSources[f.id]!=='codex_draft')return '';return `<details class="question-source"><summary>Codex draft · See supporting evidence</summary><p>${esc(a.reason)}</p>${a.evidence.map(e=>`<p><strong>${esc(e.source)}</strong><br>${esc(e.text)}</p>`).join('')}</details>`;}
  document.addEventListener('click',async event=>{
    const b=event.target.closest('[data-companion-action]');if(!b)return;event.preventDefault();
    const action=b.dataset.companionAction,id=b.dataset.id;
    try{
      if(action==='send-application'){
        const t=state.applications[id],d=E.data.drafts[id];if(!t||t.status!=='ready'||!d||d.version!==t.version)throw Error('The application changed. Prepare and review its latest version first.');
        if(!E.approve(id))throw Error('An answer or requirement changed. Review the current package first.');await E.save();
        b.disabled=true;state.applications[id]=await api('applications/'+t.id+'/submit',{method:'POST',body:JSON.stringify({fingerprint:t.fingerprint,reviewed:true})});submissionView(state.applications[id],id);await pollSubmission(id);
      }
      if(action==='edit-submission'){const t=state.applications[id];if(t)await api('applications/'+t.id,{method:'DELETE',body:'{}'});document.querySelector('#detail-dialog').close();window.dispatchEvent(new CustomEvent('jobbies-edit-application',{detail:{id}}));}
      if(action==='cancel-submission'){const t=state.applications[id];if(t)await api('applications/'+t.id,{method:'DELETE',body:'{}'});document.querySelector('#detail-dialog').close();}
      if(action==='connect')await connect();
      if(action==='download')await download();
      if(action==='restore')await restore();
      if(action==='keep-local'){const saved=await api('workspace');remoteRevision=saved.revision;state.conflict=false;await backup();}
      if(action==='retry')await draft(id,true);
      if(action==='draft-next'){const next=Object.keys(E.data.drafts).find(id=>requestFor(id)&&attempted.get(id)!==signature(id)&&E.data.drafts[id].ai?.attemptSignature!==signature(id));if(next)await draft(next);else toast('No new unanswered application questions to draft.');}
      if(action==='cancel'){const t=state.tasks[id];if(t?.id)await api('tasks/'+t.id,{method:'DELETE',body:'{}'});}
    }catch(error){toast(error.message);}
  },true);
  document.addEventListener('change',async event=>{
    if(event.target.id==='codex-auto-draft'){E.data.settings.codexAutoDraft=event.target.checked;await E.save();schedule();}
    if(event.target.id==='workspace-backup-file'){
      try{const file=event.target.files[0];if(!file||file.size>45*1024*1024)throw new Error('Choose a workspace JSON up to 45 MB.');await E.importWorkspace(JSON.parse(await file.text()));attempted.clear();await backup();schedule();toast('Workspace restored, including saved answers and application history.');}
      catch(error){toast('Import failed: '+error.message);}
    }
  });
  window.AmericaCompanion={canSubmit,prepareSubmission,state,init,panel,applicationPanel,fieldEvidence,draft,requestFor};
})();
