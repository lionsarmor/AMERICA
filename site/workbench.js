(() => {
  'use strict';
  const E=window.JobEngine, esc=escapeHTML;
  let active=true, ready=false, tab='opportunities', sortBy='overall', search='', role='all', pay='all', clearanceFilter='all', sourceFilter='all', page=1, timer, loading=false;
  const limit=16;
  let filtersOpen=false;
  let answerSearch='',answerCategory='all',answerStatus='all';
  const dom=s=>document.querySelector(s);
  const ago=t=>!t?'Never':new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(t));
  const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
  const titles={intelligence:['Your application assistant','Codex drafts, reusable knowledge, and private workspace backups.'],opportunities:['Your shortlist','The strongest matches, with your application package already started.'],discovered:['Find your next job','Live discoveries and imported jobs. Prepare any opportunity you want to pursue.'],saved:['Saved jobs','Saved opportunities and their preparation status.'],review:['Review applications','See the actual answers, selected resume, missing details, and submission route.'],applications:['Your applications','Approved packages and submissions you have confirmed.'],archive:['Archived jobs','Your archive survives refreshes and repeated discovery.'],profile:['Profile & resumes','Resume-backed facts stay separate from answers you have confirmed.'],sources:['Job sources','Major boards, specialist sources, and direct employers—with honest coverage.'],answers:['All your answers','Review your profile, reusable answers, and every prepared application.'],wizard:['A few answers. More possibilities.','The Job Wizard groups repeated questions and remembers answers in the right context.']};
  function button(action,label,id='',primary=false){return `<button class="${primary?'primary':'secondary'}-button" data-live-action="${action}" ${id?`data-id="${esc(id)}"`:''}>${label}</button>`;}
  function modal(label,body,footer=''){openModal(label,body,footer);document.querySelector('#detail-dialog').setAttribute('aria-label',label);}
  function liveJobs(){return Object.values(E.data.jobs);}
  function filtered(){
    let list=liveJobs().filter(j=>tab==='archive'?!!E.data.archived[j.id]:!E.data.archived[j.id]);
    if(tab==='opportunities')list=list.filter(j=>E.data.drafts[j.id]?.stage==='ready_for_review'&&!E.isBlocked(j)&&!j.marketExcluded);
    if(tab==='saved')list=list.filter(j=>E.data.saved.includes(j.id));
    if(tab==='review')list=list.filter(j=>E.data.drafts[j.id]&&E.data.drafts[j.id].stage!=='submitted');
    if(tab==='applications')list=list.filter(j=>['approved_for_handoff','submitted'].includes(E.data.drafts[j.id]?.stage));
    list=list.filter(j=>E.matchesQuery(j,search)&&(role==='all'||role==='remote'&&j.remote||role==='travel'&&j.travel||role==='contract'&&j.contract)&&(pay==='all'||pay==='known'&&j.pay.min!==null||pay==='100'&&j.pay.currency==='USD'&&/year|annual/i.test(j.pay.period)&&j.pay.min>=100000)&&(clearanceFilter==='all'||j.clearance===clearanceFilter)&&(sourceFilter==='all'||j.sources.some(s=>s.id===sourceFilter)));
    return list.sort((a,b)=>sortBy==='hiring'?(Number(E.isBlocked(a))-Number(E.isBlocked(b))||b.fit-a.fit):sortBy==='pay'?(annualPay(b)-annualPay(a)):sortBy==='family'?(b.familyScore??-1)-(a.familyScore??-1):b[sortBy]-a[sortBy]);
  }
  function annualPay(j){return j.pay.currency==='USD'&&/year|annual/i.test(j.pay.period)?j.pay.min??-1:-1;}
  function payMarkup(j){const p=j.pay;if(p.min&&p.currency==='USD')return `<strong>${money(p.min)}${p.max?'–'+money(p.max):''}</strong><span> / ${esc(p.period||'period unconfirmed')}</span>`;return `<strong class="pay-unconfirmed">${esc(p.text==='Compensation not published'?'Pay not published':p.text.slice(0,100))}</strong>`;}
  function stageText(d){return !d?'Not yet prepared':({needs_input:`Needs ${d.missing.length} answer${d.missing.length===1?'':'s'}`,ready_for_review:'Ready for review',approved_for_handoff:'Approved · Finish on employer site',submitted:'Submitted · Confirmed by you',preparing:'Refreshing complete questions',needs_employer_review:'Full question needed · Review employer form'})[d.stage]||'Draft';}
  function jobCard(j){
    const d=E.data.drafts[j.id],archived=E.data.archived[j.id],blocked=E.isBlocked(j),saved=E.data.saved.includes(j.id);
    return `<article class="job-card live-job-card"><div class="card-top"><div class="company-logo blue">${esc(j.company.split(/\s+/).slice(0,2).map(s=>s[0]).join(''))}</div><div><div class="company-name">${esc(j.company)}</div><div class="company-kind">${esc(j.sourceName)} · ${j.kind==='manual'?'IMPORTED':'LIVE FEED'}</div></div><span class="tier ${j.fit>=75&&!blocked?'tier-a':''}">${blocked?'HOLD':j.fit>=75?'STRONG FIT':'REVIEW FIT'}</span><button class="bookmark-button ${saved?'saved':''}" data-live-action="save" data-id="${esc(j.id)}" aria-label="${saved?'Unsave':'Save'} ${esc(j.title)}" aria-pressed="${saved}">${icon('bookmark')}</button></div>
    <h3 class="job-title">${esc(j.title)}</h3><div class="location-line">${icon('pin')}${esc(j.location)}</div>
    <div class="salary-line live-pay">${payMarkup(j)}</div><p class="salary-note">${j.pay.min?'Published compensation · Verify scope and currency':'Unknown pay stays unknown; no salary has been guessed.'}</p>
    <div class="job-tags">${[j.travel?'Travel mentioned':null,j.remote?'Remote':null,j.contract?'Contract':null,j.seniorityReview?'Seniority to verify':null,j.marketExcluded?'Outside US-remote focus':null,j.clearance==='existing'?'Existing clearance required':j.clearance==='sponsor'?'Sponsorship mentioned':null].filter(Boolean).map(s=>`<span>${esc(s)}</span>`).join('')}</div>
    <details class="job-extra"><summary>Schedule & requirements</summary><div class="family-strip ${j.rotation?'':'unknown'}">${icon('home')}<div><strong>${j.rotation?'Rotation mentioned — verify terms':j.pto?'Time off mentioned — details to verify':'PTO & project breaks unconfirmed'}</strong><small>${esc((j.rotation||j.pto||'We’ll flag missing employer terms separately from your answers.').slice(0,120))}</small></div></div>
    <div class="project-line">${icon('shield')}<div><strong>${esc(j.agency)}</strong><br>${esc((j.clearanceEvidence||'Clearance and access requirements unconfirmed').slice(0,160))}</div></div>
    </details><div class="score-row"><div><span>FIT EVIDENCE</span><strong>${j.matchEvidence.length} skill matches</strong></div><div><span>HIRING CASE</span><strong class="caution">${blocked?'Known blocker':'Eligibility to verify'}</strong></div><div><span>PREPARATION</span><strong class="${d?.stage==='ready_for_review'?'positive':'caution'}">${esc(stageText(d))}</strong></div></div>
    ${archived?`<p class="archive-reason">Archived · ${esc(archived.reason)}</p>`:''}
    ${d?`<p class="live-form-note">${d.formVerified?'Published form questions loaded':'Core package filled · Employer form not verified'}</p>`:''}
    <div class="card-actions">${button(d?'application':'detail',d?'Review application '+icon('arrow'):'View & prepare '+icon('arrow'),j.id,true)}<button class="archive-button" data-live-action="${archived?'restore':'archive'}" data-id="${esc(j.id)}">${icon('archive')}${archived?'Restore':'Archive'}</button></div>
    <a class="source-link" href="${esc(j.url)}" target="_blank" rel="noopener noreferrer">Original listing · ${esc(j.sourceName)} ↗</a></article>`;
  }
  function render(){
    if(!ready||!active)return;
    dom('.app').classList.toggle('wizard-view',['wizard','answers','intelligence','profile','sources'].includes(tab));
    dom('.app').classList.toggle('shortlist-view',tab==='opportunities');
    const d=E.data,jobs=liveJobs(),notArchived=jobs.filter(j=>!d.archived[j.id]),drafts=Object.values(d.drafts).filter(a=>!d.archived[a.jobId]),missing=E.missingGroups();
    document.querySelectorAll('.nav-item').forEach(b=>{const selected=(b.dataset.liveView||b.dataset.view)===tab;b.classList.toggle('active',selected);if(selected)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    dom('#breadcrumb-current').textContent=tab==='opportunities'?'My shortlist':tab==='wizard'?'Answer questions':titles[tab][0];
    dom('#opportunity-count').textContent=drafts.filter(a=>a.stage==='ready_for_review'&&!d.jobs[a.jobId].marketExcluded&&!E.isBlocked(d.jobs[a.jobId])).length;
    dom('#saved-count').textContent=d.saved.filter(id=>!d.archived[id]).length;dom('#review-count').textContent=drafts.filter(a=>a.stage!=='submitted').length;dom('#archive-count').textContent=Object.keys(d.archived).length;dom('#wizard-count').textContent=missing.length;
    dom('#summary-jobs').innerHTML=`${notArchived.length} <small>discovered jobs</small>`;
    dom('#summary-family').innerHTML=`${missing.length} <small>answers needed</small>`;
    dom('#summary-review').innerHTML=`${drafts.filter(a=>a.stage==='ready_for_review').length} <small>prepared for review</small>`;
    dom('#pull-jobs-button').disabled=E.busy;dom('#pull-jobs-button').innerHTML=E.busy?`<span class="loading-ring"></span>Finding jobs…`:`${icon('search')}Find new jobs`;
    const working=E.sources().filter(E.sourceEnabled).length;
    dom('#pull-status').textContent=d.storageError||`${working} public feeds enabled · ${d.lastPull?'Last run '+ago(d.lastPull):'Ready for your first pull'} · ${d.settings.autoPull?'Auto-pull every '+d.settings.intervalHours+'h while this app is open':'Auto-pull paused'}`;
    const alert=dom('#wizard-alert');alert.hidden=!missing.length&&!!d.profile.name;
    const unseen=wizardQuestions().filter(q=>q.required&&wizardState().seen[q.id]!==q.fingerprint).length;
    alert.innerHTML=`<div>${icon('sliders')}<div><strong>${unseen?unseen+' new question'+(unseen===1?'':'s')+' from your job matches':missing.length+' question'+(missing.length===1?'':'s')+' waiting for you'}.</strong><p>Answer once and reuse it across your applications.</p></div></div><button class="primary-button" data-live-view="wizard">Answer questions ${icon('arrow')}</button>`;
    if(!d.profile.name){alert.innerHTML=`<div>${icon('user')}<div><strong>Make Jobbies work for you.</strong><p>Import your local profile and resumes to prepare applications and rank matches.</p></div></div><button class="primary-button" data-live-action="import-profile">Import my profile ${icon('arrow')}</button><button class="secondary-button" data-live-action="edit-profile">Set up manually</button>`;}
    if(tab==='intelligence'){dom('#workbench').innerHTML=AmericaCompanion.panel();return;}if(tab==='sources'){renderSources();return;}if(tab==='wizard'){renderWizard();return;}if(tab==='answers'){renderAnswers();return;}if(tab==='profile'){renderProfile();return;}
    const list=filtered(),slice=list.slice(0,page*limit);
    const queueStats=tab==='review'?`<div class="queue-stats"><span><b>${drafts.filter(a=>a.stage==='ready_for_review').length}</b> Ready for review</span><span><b>${drafts.filter(a=>a.stage==='needs_input').length}</b> Need your answers</span><span><b>${drafts.filter(a=>a.stage==='approved_for_handoff').length}</b> Approved for handoff</span></div>`:'';
    dom('#workbench').innerHTML=`<div class="section-heading"><div><h2>${titles[tab][0]}</h2><p>${titles[tab][1]}</p></div><div class="live-heading-actions">${tab==='discovered'?button('prepare-best','Prepare best matches'):''}${button('import','Import a job '+icon('plus'))}</div></div>${queueStats}
    <div class="ranking-tabs" role="group" aria-label="Rank live opportunities">${[['overall','✦ Best overall'],['pay','Highest annual pay'],['fit','Best fit'],['family','Family time'],['hiring','Hiring prospects']].map(([id,title])=>`<button class="rank-tab ${sortBy===id?'active':''}" data-live-sort="${id}" aria-pressed="${sortBy===id}">${title}</button>`).join('')}</div>
    <div class="live-search-row"><label class="search-box">${icon('search')}<input id="live-search" type="search" value="${esc(search)}" placeholder='Search roles, companies, or skills…' aria-label="Search live jobs"></label><details class="job-filters" ${filtersOpen?'open':''}><summary>${icon('sliders')} Filters${[role,pay,clearanceFilter,sourceFilter].filter(v=>v!=='all').length?' · '+[role,pay,clearanceFilter,sourceFilter].filter(v=>v!=='all').length:''}</summary><div class="job-filter-fields"><label>Work type<select id="live-role" aria-label="Role type"><option value="all">All work types</option><option value="travel">Travel mentioned</option><option value="remote">Remote</option><option value="contract">Contract</option></select></label><label>Compensation<select id="live-pay" aria-label="Compensation filter"><option value="all">Include unknown pay</option><option value="known">Published pay only</option><option value="100">$100k+ annual USD</option></select></label><label>Clearance<select id="live-clearance" aria-label="Clearance requirement"><option value="all">All clearance requirements</option><option value="none">Explicitly no clearance</option><option value="existing">Existing clearance required</option><option value="sponsor">Sponsorship mentioned</option><option value="screening">Public Trust / screening</option><option value="unknown">Unconfirmed requirements</option></select></label><label>Source<select id="live-source" aria-label="Job source"><option value="all">All sources</option>${E.sources().filter(s=>!['manual','credential'].includes(s.kind)).map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}<option value="manual">Manual imports</option></select></label></div></details></div>
    <div class="live-results-note"><span>${list.length} ${list.length===1?'opportunity':'opportunities'} · ${tab==='opportunities'?'Only prepared, unblocked packages':'Facts are extracted from source listings; verify before applying.'}</span><button class="text-button" data-live-action="clear-search">Clear filters</button></div>
    <div class="job-grid">${slice.length?slice.map(jobCard).join(''):`<div class="empty-state">${icon(tab==='review'?'file':'search')}<h3>${tab==='opportunities'?'Your next move starts here.':'Nothing here yet.'}</h3><p>${tab==='opportunities'?'Find new jobs to build your shortlist. Answer any missing questions, then review your prepared applications here.':'Change your filters, pull jobs, or import a listing from any source.'}</p><div class="empty-actions"><button class="primary-button" data-live-action="pull">Find new jobs</button><button class="secondary-button" data-live-view="${tab==='opportunities'?'review':'discovered'}">${tab==='opportunities'?'See preparation queue':'See all discoveries'}</button></div></div>`}</div>
    ${slice.length<list.length?`<div class="load-more">${button('more',`Show more (${slice.length} of ${list.length})`)}</div>`:''}
    <p class="workspace-footnote">Prepared packages are not submitted applications. Employer forms may include additional questions, consent, or assessments.</p>`;
    dom('.job-filters').addEventListener('toggle',event=>{filtersOpen=event.target.open;});
    dom('#live-role').value=role;dom('#live-pay').value=pay;dom('#live-clearance').value=clearanceFilter;dom('#live-source').value=sourceFilter;
  }
  function sourceCard(s){
    const st=E.data.sourceState[s.id]||{},live=!['manual','credential'].includes(s.kind),enabled=E.sourceEnabled(s);
    const status=!live?s.kind==='credential'?'Connection required':'Open & import':!enabled?'Paused':st.state==='pulling'?'Pulling…':st.state==='ok'?'Live · Last pull succeeded':st.state==='partial'?'Partial coverage':st.state==='error'?'Needs attention':'Ready to pull';
    return `<article class="source-card"><div class="source-card-top"><div><h3>${esc(s.name)}</h3><span>${esc(s.group)}</span></div><span class="status-badge ${st.state==='error'?'status-error':''}">${status}</span></div><p>${esc(s.note||'Public employer feed.')}</p>${live?`<div class="source-metrics"><span>Read <b>${st.read??'—'}</b></span><span>Relevant <b>${st.relevant??'—'}</b></span><span>Last success <b>${ago(st.lastSuccess)}</b></span></div>`:''}${st.error?`<p class="source-error">${esc(st.error)}</p>`:''}${st.partial?'<p class="source-error">Page limit reached. This run is partial; it does not represent all available listings.</p>':''}<div class="source-card-actions"><a class="secondary-button" href="${esc(s.home)}" target="_blank" rel="noopener noreferrer">Open source ↗</a>${live?`<label class="toggle-label"><input type="checkbox" data-source-toggle="${esc(s.id)}" ${enabled?'checked':''}>Include in pulls</label>`:button('import','Import a listing')}</div></article>`;
  }
  function renderSources(){
    const d=E.data,ss=E.sources(),last=d.runs[0];
    dom('#workbench').innerHTML=`<div class="section-heading"><div><h2>${titles.sources[0]}</h2><p>${titles.sources[1]}</p></div>${button('add-source','Add employer board '+icon('plus'))}</div>
    <div class="automation-card"><div><h3>Automatic discovery & preparation</h3><p>While the app is open, check enabled feeds on your schedule and prepare the strongest matches. Resume overdue work when you return. Pulls respect each provider’s cooldown.</p></div><div class="automation-controls"><label><input id="auto-pull-toggle" type="checkbox" ${d.settings.autoPull?'checked':''}> Auto-pull</label><label>Frequency<select id="pull-frequency"><option value="6">Every 6 hours</option><option value="12">Every 12 hours</option><option value="24">Daily</option></select></label><label><input id="auto-prepare-toggle" type="checkbox" ${d.settings.autoPrepare?'checked':''}> Auto-prepare top ${d.settings.maximumPrepare}</label></div><p class="workspace-footnote">Closed-browser background scheduling and credentialed board integrations require a server; they are not active here. Source failures retain existing jobs and are shown separately.</p></div>
    ${last?`<div class="pull-receipt"><strong>Last pull · ${ago(last.at)}</strong><span>${last.results.reduce((n,r)=>n+(r.added||0),0)} new · ${last.results.reduce((n,r)=>n+(r.updated||0),0)} updated · ${last.results.filter(r=>r.error).length} failed · ${last.skipped} cooling down</span></div>`:''}
    ${['Direct employers','Specialist boards','Major boards','Government & projects'].map(group=>`<h3 class="source-group-title">${group}</h3><div class="source-grid">${ss.filter(s=>s.group===group).map(sourceCard).join('')}</div>`).join('')}`;
    dom('#pull-frequency').value=String(d.settings.intervalHours);
  }
  const generalQuestions=[
    ['us_citizen','Are you a US citizen?',['Yes','No']],
    ['us_work_authorization','Are you authorized to work in the United States?',['Yes','No']],
    ['us_sponsorship','Do you need employment visa sponsorship in the United States?',['Yes','No']],
    ['clearance_status','What is your current security-clearance status?',['None','Secret','Top Secret','Other / verify','Unknown']],
    ['current_location','What is your actual current residential city and state/country?',null],
    ['start_date','When are you available to start?',null],
    ['weeks_away','How many weeks away between family visits work for you?',null]
  ];
  function questionInput(id,options,value='',type='text'){return options?.length?`<select id="${esc(id)}"><option value="">Choose an answer</option>${options.map(o=>typeof o==='string'?{value:o,label:o}:o).map(o=>`<option value="${esc(o.value)}" ${String(o.value)===String(value)?'selected':''}>${esc(o.label)}</option>`).join('')}</select>`:`<input id="${esc(id)}" type="${type}" value="${esc(value)}" maxlength="3000" placeholder="Your answer">`;}
  let wizardNote='',wizardSaving=false,wizardSaveTimer;
  function wizardState(){
    const state=E.data.wizard||={seen:{},deferred:{},drafts:{},completed:{},history:{},current:null};
    state.steps||={...state.history};state.backStack||=[];state.forwardStack||=[];
    if(state.mode==='review'){state.mode='pending';state.current=null;}
    return state;
  }
  const hasAnswer=value=>value!==undefined&&value!==null&&(Array.isArray(value)?value.length>0:String(value).trim()!=='');
  function canEditWizardQuestion(q){return q&&(q.reusable||E.data.drafts[q.jobs[0]]?.stage!=='submitted'&&!!E.data.drafts[q.jobs[0]]);}
  function advanceWizard(q){
    const state=wizardState();if(state.backStack.at(-1)!==q.id)state.backStack.push(q.id);
    state.backStack=state.backStack.slice(-200);state.current=null;state.revisiting=false;
    while(state.forwardStack.length){const id=state.forwardStack.pop();if(id===null||canEditWizardQuestion(state.steps[id])){state.current=id;state.revisiting=id!==null;break;}}
  }
  function restoreWizardRoute(){
    const state=wizardState(),route=state.editingRoute;if(!route)return;
    Object.assign(state,route);delete state.editingRoute;
  }
  function allReusableQuestions(){
    const state=wizardState(),list=new Map(E.questionCatalog().filter(q=>q.scope!=='application').map(q=>[q.key,{...q,id:q.key,jobs:[],reusable:true}]));
    for(const [key,q] of new Map(generalQuestions.map(([key,label,options])=>[key,{id:key,key,label,options:options||[],jobs:[],reusable:true,type:'input_text'}])))list.set(key,{...list.get(key),...q});
    for(const q of [...Object.values(state.history),...E.missingGroups()])if(q.reusable)list.set(q.key,{...q,id:q.key});
    for(const [key,answer] of Object.entries(E.data.answers))if(!list.has(key))list.set(key,{id:key,key,label:answer.label&&answer.label!==key?answer.label:key.replaceAll('_',' '),options:Array.isArray(answer.value)?answer.value:[],jobs:[],reusable:true,type:Array.isArray(answer.value)?'multi_value_multi_select':'input_text'});
    for(const d of Object.values(E.data.drafts))for(const f of d.fields)if(f.key&&E.factDefinition(f.key)&&E.factDefinition(f.key).scope!=='application'&&!list.has(f.key))list.set(f.key,{id:f.key,key:f.key,label:f.label,options:f.options||[],jobs:[],reusable:true,type:'input_text'});
    return [...list.values()].map(q=>{const definition=E.factDefinition(q.key);if(definition)q={...q,label:definition.label,options:definition.options,type:definition.type||'input_text'};return {...q,fingerprint:JSON.stringify([q.key,q.label,q.options,q.jobs])};});
  }
  function wizardQuestions(){
    const missing=E.missingGroups().map(g=>({...g,jobs:[...new Set(g.jobs)],required:true,id:g.key}));
    const keys=new Set(missing.map(g=>g.key));
    const optional=generalQuestions.filter(([key])=>!keys.has(key)&&!E.resolveFact(key).known).map(([key,label,options])=>({id:key,key,label,options:options||[],jobs:[],reusable:true,type:'input_text',required:false}));
    const foundation=missing.find(q=>q.key==='us_citizen')||optional.find(q=>q.key==='us_citizen');
    const related=missing.filter(q=>['us_work_authorization','us_sponsorship','us_work_without_sponsorship','us_unrestricted_work_authorization','us_citizen_or_resident','us_work_status','us_export_person','us_national'].includes(q.key));
    if(foundation&&related.length){foundation.jobs=[...new Set([...foundation.jobs,...related.flatMap(q=>q.jobs)])];foundation.explanation='Answer this once. Confirmed US citizenship also covers standard US work-authorization and employment-sponsorship questions.';}
    const list=[...missing,...optional];if(foundation){const index=list.indexOf(foundation);list.splice(index,1);list.unshift(foundation);}
    return list.map(g=>({...g,fingerprint:JSON.stringify([g.key,g.label,g.options,g.jobs])}));
  }
  function wizardValue(q){
    const state=wizardState();if(Object.hasOwn(state.drafts,q.id))return state.drafts[q.id];
    let value=q.reusable?E.resolveFact(q.key).value:E.data.drafts[q.jobs[0]]?.values[q.key.split('::')[1]];
    if(value===undefined)return q.type==='multi_value_multi_select'?[]:'';
    const options=q.options.map(o=>typeof o==='string'?{value:o,label:o}:o);
    const match=v=>String(options.find(o=>String(o.value)===String(v)||o.label.toLowerCase()===String(v).toLowerCase())?.value??v);
    return Array.isArray(value)?value.map(match):match(value);
  }
  function wizardControl(q){
    const value=wizardValue(q),options=q.options.map(o=>typeof o==='string'?{value:o,label:o}:o),multi=q.type==='multi_value_multi_select';
    if(options.length&&options.length<=8)return `<fieldset class="wizard-choices" aria-labelledby="wizard-question"><legend class="sr-only">Choose ${multi?'all that apply':'one answer'}</legend>${options.map(o=>`<label class="wizard-choice"><input name="wizard-answer" type="${multi?'checkbox':'radio'}" value="${esc(o.value)}" ${(Array.isArray(value)?value.map(String).includes(String(o.value)):String(value)===String(o.value))?'checked':''}><span>${esc(o.label)}</span><span class="choice-tick" aria-hidden="true">${icon('check')}</span></label>`).join('')}</fieldset>`;
    if(options.length)return `<select id="wizard-answer" aria-labelledby="wizard-question" ${multi?'multiple':''}><option value="">Choose an answer</option>${options.map(o=>`<option value="${esc(o.value)}" ${(Array.isArray(value)?value.map(String).includes(String(o.value)):String(value)===String(o.value))?'selected':''}>${esc(o.label)}</option>`).join('')}</select>`;
    const placeholders={current_location:'City, state or province, country',start_date:'For example, two weeks after an offer',weeks_away:'For example, four weeks away, then two weeks home'};
    return q.type==='textarea'?`<textarea id="wizard-answer" aria-labelledby="wizard-question" maxlength="3000" placeholder="Tell us in your own words…">${esc(value)}</textarea>`:`<input id="wizard-answer" aria-labelledby="wizard-question" value="${esc(value)}" maxlength="3000" autocomplete="off" placeholder="${esc(placeholders[q.key]||'Your answer…')}">`;
  }
  function readWizardValue(form){
    const choices=[...form.querySelectorAll('input[name="wizard-answer"]')];
    if(choices.length)return choices[0].type==='checkbox'?choices.filter(el=>el.checked).map(el=>el.value):choices.find(el=>el.checked)?.value||'';
    const el=form.querySelector('#wizard-answer');return el?.multiple?[...el.selectedOptions].map(o=>o.value).filter(Boolean):el?.value||'';
  }
  function renderWizard(force=false){
    const state=wizardState(),all=wizardQuestions(),editing=!!state.editingRoute;
    const deferred=all.filter(q=>state.deferred[q.id]===q.fingerprint),queue=all.filter(q=>state.deferred[q.id]!==q.fingerprint);
    const selected=all.find(q=>q.id===state.current)||state.steps[state.current];
    const q=(canEditWizardQuestion(selected)&&(all.some(v=>v.id===selected.id)||editing||state.revisiting)?selected:null)||queue[0],done=Object.keys(state.completed).length,total=done+all.length,progress=total?Math.round(done/total*100):100;
    const backEnabled=editing||state.backStack.some(id=>canEditWizardQuestion(state.steps[id]));
    const backButton=`<button class="secondary-button wizard-back" type="button" data-live-action="wizard-back" ${backEnabled?'':'disabled'}>← Back</button>`;
    const unchanged=!force&&q&&dom('#wizard-form')?.dataset.wizardId===q.id&&dom('#wizard-form')?.dataset.questionShape===JSON.stringify([q.label,q.type,q.options])&&dom('#wizard-form')?.dataset.editing===String(editing);
    if(unchanged){dom('#wizard-remaining').textContent=all.length+' remaining';dom('.wizard-progress-meta>span').textContent=editing?'Editing an answer':done+' answered';const bar=dom('.wizard-progress');bar.setAttribute('aria-valuemax',Math.max(total,1));bar.setAttribute('aria-valuenow',total?done:1);bar.firstElementChild.style.width=progress+'%';dom('.wizard-cheer').textContent=wizardNote||'You bring the experience. We’ll handle the repetition.';dom('.wizard-back').disabled=!backEnabled;if(state.seen[q.id]!==q.fingerprint){state.seen[q.id]=q.fingerprint;E.save();}return;}
    state.current=q?.id||null;
    if(q){state.steps[q.id]=structuredClone(q);state.seen[q.id]=q.fingerprint;E.save();}
    const singleChoice=q?.options.length&&q.type!=='multi_value_multi_select';
    const hint=singleChoice?'Choose an answer to save it and move on.':q?.type==='textarea'?'Press Ctrl + Enter when you’re finished.':q?.type==='multi_value_multi_select'?'Choose all that apply, then continue.':'Press Enter when you’re finished, or move out of the answer field.';
    const question=q?`<form id="wizard-form" class="wizard-step" data-wizard-id="${esc(q.id)}" data-question-shape="${esc(JSON.stringify([q.label,q.type,q.options]))}" data-editing="${editing}"><div class="wizard-question-meta"><span class="question-impact">${editing?'EDIT YOUR ANSWER':q.jobs.length?'FROM YOUR JOB MATCHES':'A LITTLE ABOUT YOU'}</span><span>${q.required?'Helps finish applications':'Helps future matches'}</span></div><h3 id="wizard-question">${esc(q.label)}</h3><p class="wizard-why">${q.explanation?esc(q.explanation):q.jobs.length?`One answer helps ${q.jobs.length} application${q.jobs.length===1?'':'s'}. ${q.reusable?'We’ll remember it for matching questions.':'This answer stays with this application.'}`:'A quick answer now means fewer questions on future applications.'}</p>${q.jobs.length?`<div class="wizard-job-context">${q.jobs.slice(0,2).map(id=>`<span>${esc(E.data.jobs[id]?.company||'Application')}</span>`).join('')}${q.jobs.length>2?`<span>+${q.jobs.length-2} more</span>`:''}</div>`:''}${sourceContext(q)}${q.type==='input_file'?`<div class="wizard-attachment"><p>This step needs the actual document.</p>${q.key==='resume'?button('edit-profile','Choose a resume'):button('application','Attach in application',q.jobs[0])}</div>`:wizardControl(q)}${q.type!=='input_file'?`<p class="wizard-input-hint">${hint}</p>`:''}<p id="wizard-error" class="wizard-error" role="alert"></p><div class="wizard-step-actions">${backButton}${q.type!=='input_file'?`<button class="primary-button" type="submit">${editing?'Save answer':'Continue'} ${icon('arrow')}</button>`:''}<button class="text-button" type="button" data-live-action="wizard-skip">${editing?'Cancel':'Skip for now'}</button></div><small class="wizard-privacy">Saved automatically as you answer. You can go back or edit your full answer list anytime.</small></form>`:`<div class="wizard-finish"><span class="wizard-finish-star" aria-hidden="true">✦</span><h3>${deferred.length?'A good place to pause.':'You’re all caught up.'}</h3><p>${deferred.length?`${deferred.length} question${deferred.length===1?' is':'s are'} saved for later. Nothing has been guessed.`:'We’ll bring you new questions when pulled jobs need something new. Your answers are ready for future applications.'}</p><div class="empty-actions">${backButton}${deferred.length?button('wizard-retry','Continue skipped questions','',true):''}<a class="primary-button" href="#answers" data-live-view="answers">See all answers ${icon('arrow')}</a></div></div>`;
    dom('#workbench').innerHTML=`<div class="section-heading"><div><h2>Your Job Wizard</h2><p>One quick answer. Better applications.</p></div><div class="live-heading-actions"><a class="text-button" href="#answers" data-live-view="answers">All answers</a><button class="text-button" data-live-view="opportunities">Pause for now</button></div></div><div class="wizard-experience"><div class="wizard-guide"><div class="wizard-buddy" aria-hidden="true">✦<span>✧</span></div><div><strong>${editing?'Fine-tune what I know.':'Let’s make your next application easier.'}</strong><p>${editing?'Changes update your matching unsent applications.':'Pick an answer. We’ll take you to the next step.'}</p></div></div><div class="wizard-progress-meta"><span>${editing?'Editing an answer':done+' answered'}</span><span id="wizard-remaining">${all.length} remaining</span></div><div class="wizard-progress" role="progressbar" aria-label="Questions answered" aria-valuemin="0" aria-valuemax="${Math.max(total,1)}" aria-valuenow="${total?done:1}"><span style="width:${progress}%"></span></div><div class="wizard-cheer" role="status" aria-live="polite">${esc(wizardNote||'You bring the experience. We’ll handle the repetition.')}</div>${question}<div class="wizard-bottom"><span>${deferred.length} skipped for later · New job questions arrive here</span><a class="text-button" href="#answers" data-live-view="answers">View all answers ${icon('arrow')}</a></div></div><p class="workspace-footnote wizard-terms">Questions about employer PTO, per diem, or project terms stay on the opportunity for follow-up.</p>`;
    const heading=dom('#wizard-question');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}
  }
  function answerText(field,value){
    if(!hasAnswer(value))return 'Not answered yet';
    const label=v=>{const option=(field.options||[]).find(o=>typeof o==='string'?o===String(v):String(o.value)===String(v));return typeof option==='string'?option:option?.label??String(v);};
    return Array.isArray(value)?value.map(label).join(', '):label(value);
  }
  function sourceContext(q){
    const sources=q.sourceQuestions||[];
    if(!sources.length)return '';
    return `<details class="question-source"><summary>Read the complete employer question${sources.length>1?'s':''}</summary>${sources.map(f=>`<div><strong>${esc(E.data.jobs[f.jobId]?.company||'Employer')}</strong><p>${esc(f.question)}</p>${f.context?`<p>${esc(f.context)}</p>`:''}<a href="${esc(f.url)}" target="_blank" rel="noopener noreferrer">Original application ↗</a></div>`).join('')}</details>`;
  }
  function renderAnswerLibrary(){
    const questions=allReusableQuestions().filter(q=>(answerCategory==='all'||(q.category||'Saved answers')===answerCategory)&&(answerStatus==='all'||(E.resolveFact(q.key).known?'ready':'unknown')===answerStatus)&&(!answerSearch||(q.label+' '+q.category+' '+answerText(q,E.resolveFact(q.key).value)).toLowerCase().includes(answerSearch.toLowerCase())));
    dom('#answer-results').innerHTML=`<p>${questions.length} matching questions · Unanswered library questions are optional until an application needs them.</p><dl class="answers-list">${questions.map(q=>`<div class="answer-row" data-answer-key="${esc(q.key)}"><dt>${esc(q.label)}<small>${esc(E.resolveFact(q.key).source)}</small></dt><dd>${esc(answerText(q,E.resolveFact(q.key).value))}</dd><button class="text-button" data-live-action="answer-edit" data-id="${esc(q.id)}">${hasAnswer(E.resolveFact(q.key).value)?'Edit':'Answer'}</button></div>`).join('')}</dl>`;
  }
  function renderAnswers(){
    const p=E.data.profile,questions=allReusableQuestions(),saved=questions.filter(q=>hasAnswer(E.resolveFact(q.key).value)).length;
    const profileFields=[['Name',p.name],['Email',p.email],['Phone',p.phone],['LinkedIn',p.linkedin],['GitHub',p.github],['Portfolio',p.portfolio],['Available work bases',p.bases.join(' · ')],['Matching skills',p.skills.join(', ')],['Technician resume',p.resumes.technician?.name],['Software resume',p.resumes.software?.name]];
    const applications=Object.values(E.data.drafts).map(d=>{const job=E.data.jobs[d.jobId];return `<details class="answers-application"><summary><span><strong>${esc(job.company)}</strong><br>${esc(job.title)}</span><span>${esc(stageText(d))}</span></summary><dl class="answers-list">${d.fields.map(f=>`<div class="answer-row"><dt>${esc(f.label)}${f.internal?'<small>Internal eligibility check</small>':''}</dt><dd>${esc(answerText(f,d.values[f.id]))}</dd></div>`).join('')}</dl>${d.stage==='submitted'?'<p class="answers-readonly">Submitted snapshot · Kept exactly as recorded</p>':button('application','Review or edit this application',d.jobId)}</details>`;}).join('');
    dom('#workbench').innerHTML=`<div class="section-heading"><div><h2>All your answers</h2><p>Your full set of profile details, saved responses, and application answers.</p></div><a class="primary-button" href="#wizard" data-live-view="wizard">Return to wizard ${icon('arrow')}</a></div><div class="answers-page"><div class="answers-summary"><strong>${saved} answers ready</strong><span>${questions.length-saved} questions not answered yet · ${Object.keys(E.data.drafts).length} application packages</span></div><section class="answers-section"><div class="answers-section-heading"><div><h3>Your profile & resumes</h3><p>The facts used to start each application.</p></div>${button('edit-profile','Edit profile')}</div><dl class="answers-list">${profileFields.map(([label,value])=>`<div class="answer-row"><dt>${label}</dt><dd>${esc(value||'Not provided')}</dd></div>`).join('')}</dl></section><section class="answers-section"><div class="answers-section-heading"><div><h3>Reusable answers</h3><p>Updates flow into matching unsent drafts. Submitted records stay frozen.</p></div></div><div class="answer-filters"><label>Find a question<input id="answer-search" type="search" value="${esc(answerSearch)}" placeholder="Skills, education, work authorization…"></label><label>Category<select id="answer-category"><option value="all">All categories</option>${[...new Set(questions.map(q=>q.category||'Saved answers'))].sort().map(c=>`<option value="${esc(c)}" ${c===answerCategory?'selected':''}>${esc(c)}</option>`).join('')}</select></label><label>Show<select id="answer-status"><option value="all">All questions</option><option value="ready" ${answerStatus==='ready'?'selected':''}>Already filled</option><option value="unknown" ${answerStatus==='unknown'?'selected':''}>Still unknown</option></select></label></div><div id="answer-results"></div></section><section class="answers-section"><div class="answers-section-heading"><div><h3>Answers by application</h3><p>Inspect the complete answer set used for each employer.</p></div></div>${applications||'<p class="workspace-footnote">Prepared applications will appear here after your next job pull.</p>'}</section><p class="workspace-footnote">Saved responses stay in this browser, with a computer backup when you use the private companion. Your public starting profile and hosted resume originals are separate from your application history.</p></div>`;
    renderAnswerLibrary();
  }
  async function submitWizardAnswer(form){
    if(wizardSaving||form!==dom('#wizard-form'))return;
    const state=wizardState(),q=state.steps[form.dataset.wizardId];if(!canEditWizardQuestion(q))return;
    let value=readWizardValue(form);if(!hasAnswer(value)){dom('#wizard-error').textContent='Choose an answer, or skip this one for now.';return;}
    if(q.reusable&&q.options.length){const label=v=>{const o=q.options.find(o=>typeof o==='string'?o===v:String(o.value)===String(v));return typeof o==='string'?o:o?.label||v;};value=Array.isArray(value)?value.map(label):label(value);}
    wizardSaving=true;clearTimeout(wizardSaveTimer);
    form.querySelectorAll('input,select,textarea,button').forEach(el=>el.disabled=true);
    try{
      const missingBefore=Object.values(E.data.drafts).reduce((n,d)=>n+(d.stage==='submitted'?0:d.missing.length),0);
      E.answer(q.key,value,q.reusable?'global':'application');await E.save();
      const covered=missingBefore-Object.values(E.data.drafts).reduce((n,d)=>n+(d.stage==='submitted'?0:d.missing.length),0);
      state.completed[q.id]=true;state.history[q.id]=structuredClone(q);delete state.drafts[q.id];delete state.deferred[q.id];
      const stillMissing=wizardQuestions().find(v=>v.id===q.id);if(stillMissing)state.deferred[q.id]=stillMissing.fingerprint;
      wizardNote=stillMissing?'Saved. This one still needs clarification, so we’ll keep it for later.':covered>0?'Remembered. '+covered+' application question'+(covered===1?' was':'s were')+' filled automatically.':q.jobs.length?'Nice! Your answer updated '+q.jobs.length+' application'+(q.jobs.length===1?'':'s')+'.':'Got it. One less thing to fill in next time.';
      const returning=!!state.editingRoute;if(returning)restoreWizardRoute();else advanceWizard(q);
      await E.save();if(returning)switchTab('answers');else render();
    }catch(error){const target=dom('#wizard-error');if(target)target.textContent='Could not save this answer. Please try again.';form.querySelectorAll('input,select,textarea,button').forEach(el=>el.disabled=false);}finally{wizardSaving=false;}
  }
  function renderProfile(){
    const p=E.data.profile;dom('#workbench').innerHTML=`<div class="section-heading"><div><h2>${titles.profile[0]}</h2><p>${titles.profile[1]}</p></div><div class="live-heading-actions">${button('import-profile','Import profile')}${button('edit-profile','Edit profile & resumes')}</div></div><div class="profile-panel"><h3>${esc(p.name||'Make this workspace yours')}</h3><p>${esc(p.email)} ${esc(p.phone)}</p><div class="details-grid"><div><span>Available work bases</span><strong>${esc(p.bases.join(' · ')||'Add your available locations')}</strong></div><div><span>Compensation</span><strong>$100k+ target · Extras assessed separately</strong></div><div><span>Skills for matching</span><strong>${p.skills.length} skills available</strong></div><div><span>Saved answers</span><strong>${Object.keys(E.data.answers).length} reusable facts and preferences</strong></div></div><h3>Your application attachments</h3><p>Your technician and software resumes are hosted here and ready to use. Uploading a replacement saves your selected version in this browser.</p><div class="resume-links">${Object.entries(p.resumes).map(([key,r])=>E.resumeURL(r)?`<a class="secondary-button" href="${esc(E.resumeURL(r))}" download="${esc(r.name)}">${icon('file')}${key==='technician'?'Technician':'Software'} resume ↓</a>`:`<span>${key==='technician'?'Technician':'Software'} resume · Not attached</span>`).join('')}</div><h3>Hosted originals</h3><div class="resume-links">${Object.entries(E.data.resumeLibrary||{}).map(([key,r])=>`<a class="secondary-button" href="${esc(E.resumeURL(r))}" download="${esc(r.name)}">${icon('file')}${key==='technician'?'Technician':'Software'} original ↓</a>`).join('')}</div><h3>Matching evidence</h3><div class="job-tags">${p.skills.map(s=>`<span>${esc(s)}</span>`).join('')}</div><div class="callout">${esc(p.provenance)} The original resumes and starting profile are available on this public site. Your saved answers, uploaded replacements, pulls, and drafts stay in this browser, with a computer backup when you use the private companion.</div><button class="primary-button" data-live-view="wizard">Answer questions ${icon('arrow')}</button></div>`;
  }
  function profileImport(){
    modal('IMPORT YOUR LOCAL PROFILE',`<h2>Your experience. Ready to work.</h2><p>Choose your Jobbies profile JSON or profile bundle. Importing reads the file on this device and saves it in this browser.</p><form id="profile-import-form"><label class="form-field">Profile file<input id="profile-import-file" type="file" accept=".json,application/json" required></label><p>For your prepared profile, select <strong>america-profile-import.json</strong> from this project’s private folder. It includes both resume tracks.</p><p>Existing submitted applications remain frozen. Importing refreshes unsent drafts and clears their approvals.</p><button class="primary-button" type="submit">Import into this browser</button></form>`);
  }
  function detail(id){
    const j=E.data.jobs[id];if(!j)return;
    modal('LIVE OPPORTUNITY',`<div class="eyebrow">${esc(j.company)} · ${esc(j.sourceName)}</div><h2>${esc(j.title)}</h2><p>${esc(j.location)}</p><div class="details-grid"><div><span>PAY</span><strong>${esc(j.pay.text)}</strong></div><div><span>FIT EVIDENCE</span><strong>${j.matchEvidence.length} matched resume skills</strong></div><div><span>PROJECT CUSTOMER</span><strong>${esc(j.agency)}</strong></div><div><span>ACCESS REQUIREMENTS</span><strong>${esc(j.clearanceEvidence||'Unconfirmed')}</strong></div></div><h3>Why this surfaced</h3><p>${esc(j.matchEvidence.join(', ')||'Role-title relevance only. Review the requirements carefully.')}</p><h3>Family time & expenses</h3><p>${esc(j.pto||'PTO not stated in the available description.')}</p><p>${esc(j.rotation||'No project break or rotation has been verified.')}</p><p>${esc(j.perDiem||'Per diem and hotel coverage unconfirmed.')}</p>${j.agencyEvidence?`<h3>Agency reference in the listing</h3><p>${esc(j.agencyEvidence)}</p>`:''}<h3>Original description</h3><div class="description-text">${esc(j.description)}</div><p>Retrieved ${ago(j.observedAt)}. A prior pull does not guarantee this opening remains available.</p><a href="${esc(j.url)}" target="_blank" rel="noopener noreferrer">View the original listing at ${esc(j.sourceName)} ↗</a>`,button('prepare','Prepare application '+icon('arrow'),id,true));
  }
  function fieldControl(f,d){
    const value=d.values[f.id]??'',id='application-'+f.id;
    const aiEvidence=window.AmericaCompanion?.fieldEvidence(f,d)||'';
    const help=f.context?`<small class="question-help">${esc(f.context)}</small>`:'';
    if(f.incomplete)return `<div class="form-field"><strong>${esc(f.originalLabel||f.label)}</strong>${help}<p>The employer supplied a title without a complete question. Read the original form before answering.</p><a href="${esc(E.data.jobs[d.jobId].url)}" target="_blank" rel="noopener noreferrer">Read full application ↗</a></div>`;
    if(f.key==='resume'){const r=d.stage==='submitted'?d.snapshot?.resume:E.data.profile.resumes[d.resumeTrack];return `<label class="form-field">${esc(f.label)}${f.required?' *':''}${help}${E.resumeURL(r)?`<a class="secondary-button" href="${esc(E.resumeURL(r))}" download="${esc(r.name)}">${icon('file')}${esc(r.name)} ↓</a>`:`<button type="button" class="secondary-button" data-live-action="edit-profile">Attach ${esc(d.resumeTrack)} resume</button>`}<small>Review the original file before sending</small></label>`;}
    if(f.type==='input_file')return `<label class="form-field" for="${esc(id)}">${esc(f.label)}${f.required?' *':''}${help}<input id="${esc(id)}" type="file"><small>${d.attachments?.[f.id]?'Saved: '+esc(d.attachments[f.id].name):'Choose a file, then save edits. Maximum 10 MB per file.'}</small></label>`;
    return `<label class="form-field" for="${esc(id)}">${esc(f.label)}${f.required?' *':''}${help}${f.options?.length?questionInput(id,f.options,value):f.type==='textarea'?`<textarea id="${esc(id)}" data-application-field="${esc(f.id)}">${esc(value)}</textarea>`:`<input id="${esc(id)}" data-application-field="${esc(f.id)}" value="${esc(value)}" ${f.key==='email'?'type="email"':''}>`}${aiEvidence}<small>${esc(d.fieldSources[f.id]==='codex_draft'?'Codex draft · Review before approving':d.fieldSources[f.id]||'Needs an answer')}${f.key?' · '+esc(f.key.replaceAll('_',' ')):''}</small></label>`;
  }
  function application(id){
    const j=E.data.jobs[id],d=E.data.drafts[id];if(!j||!d)return detail(id);
    modal('YOUR PREPARED APPLICATION',`<div class="eyebrow">${esc(j.company)}</div><h2>${esc(j.title)}</h2><div class="application-progress"><span class="${d.missing.length?'':'complete'}">1 · Autofilled</span><span class="${d.approved?'complete':''}">2 · Your review</span><span class="${d.stage==='submitted'?'complete':''}">3 · Employer submission</span></div><div class="callout ${d.missing.length?'':'green-callout'}"><strong>${esc(stageText(d))}</strong><br>${esc(d.formStatus)}${d.requirementsChanged?'<br>Listing changed since preparation. Recheck requirements before approval.':''}</div>${d.stage==='submitted'?`<p>Recorded ${ago(d.submittedAt)} · ${esc(d.submissionEvidence)}</p>`:''}${window.AmericaCompanion?.applicationPanel(d)||''}<form id="application-fields" data-job-id="${esc(id)}">${d.fields.map(f=>fieldControl(f,d)).join('')}<label class="form-field">Available work base (not residential address)<select id="live-draft-base">${E.data.profile.bases.map(b=>`<option ${d.base===b?'selected':''}>${esc(b)}</option>`).join('')}</select></label><label class="form-field">Optional application note<textarea id="live-draft-note" maxlength="5000" placeholder="Add a note after reviewing the role…">${esc(d.note)}</textarea></label></form>
    <div class="callout">Employer questions about PTO, project ownership, and clearance sponsorship may still need confirmation. Missing applicant facts belong in the Job Wizard; never guess either.</div>
    <p class="workspace-footnote">Approval freezes this package version for handoff. The employer’s actual form, consent, assessments, and submit button remain on its site. No API submission or universal cross-site autofill is connected.</p>`,
    `${d.stage!=='submitted'?button('save-application','Save edits',id):''}${button('export','Download package',id)}${d.stage!=='submitted'?button('approve',d.approved?'Open approved handoff':'Review & approve handoff',id,true):''}`);
    for(const f of d.fields){const el=document.getElementById('application-'+f.id);if(el){el.dataset.applicationField=f.id;if(f.type==='multi_value_multi_select'){el.multiple=true;for(const opt of el.options)opt.selected=(d.values[f.id]||[]).includes(opt.value);}}}
    if(d.stage==='submitted')dom('#application-fields').querySelectorAll('input,select,textarea').forEach(el=>el.disabled=true);
  }
  function collectApplication(id){
    const d=E.data.drafts[id];if(d.stage==='submitted')return;
    const values={};dom('#application-fields')?.querySelectorAll('[data-application-field]').forEach(el=>{
      const key=el.dataset.applicationField;
      if(el.type==='file'){const file=el.files?.[0];if(file&&file.size<=10*1024*1024){d.attachments||={};d.attachments[key]=file;values[key]=file.name;}else if(file)toast('File exceeds 10 MB and was not saved.');return;}
      values[key]=el.multiple?[...el.selectedOptions].map(o=>o.value).filter(Boolean):el.value;
    });
    E.updateDraft(id,values,dom('#live-draft-note')?.value||'',dom('#live-draft-base')?.value||d.base);
  }
  function handoff(id){
    const j=E.data.jobs[id],d=E.data.drafts[id],r=d.snapshot?.resume||E.data.profile.resumes[d.resumeTrack];
    modal('APPROVED PACKAGE · MANUAL HANDOFF',`<h2>One final stop.</h2><p>Your application package for ${esc(j.title)} is approved as version ${d.version}. Finish and submit it on the employer’s website.</p><div class="handoff-steps"><div><b>1</b><span>Download the selected resume and your prepared answers.</span></div><div><b>2</b><span>Open the original application, check additional questions, and attach the resume.</span></div><div><b>3</b><span>After the employer confirms receipt, record the submission here.</span></div></div><a class="secondary-button" href="${esc(E.resumeURL(r))}" download="${esc(r.name)}">Download resume ↓</a>${Object.entries(d.attachments||{}).map(([key,file])=>`<button class="secondary-button" data-live-action="attachment" data-id="${esc(id)}" data-field="${esc(key)}">${esc(file.name)} ↓</button>`).join('')}<div class="callout">Opening the employer site does not mean you applied. Jobbies never marks a submission successful just because you clicked a link.</div>`,`${button('export','Download answers',id)}<a class="primary-button" href="${esc(j.url)}" target="_blank" rel="noopener noreferrer">Open application ↗</a>${button('confirm-submitted','I submitted on the employer site',id)}`);
  }
  function exportPackage(id){
    const j=E.data.jobs[id],d=E.data.drafts[id];if(!d)return;
    if(dom('#application-fields'))collectApplication(id);
    const answerLabel=f=>{const value=d.values[f.id];const label=v=>f.options?.find(o=>o.value===v)?.label??v??'';return Array.isArray(value)?value.map(label):label(value);};
    const output={job:{title:j.title,company:j.company,url:j.url,source:j.sourceName},version:d.version,status:d.stage,resume:{name:(d.snapshot?.resume||E.data.profile.resumes[d.resumeTrack]).name,attachment:'Download the resume separately from this browser'},availableWorkBase:d.base,answers:d.fields.filter(f=>!f.internal).map(f=>({question:f.label,context:f.context||'',originalLabel:f.originalLabel||f.label,answer:answerLabel(f),required:f.required,source:d.fieldSources[f.id]})),note:d.note,missingRequired:d.missing,formCoverage:d.formStatus,exportedAt:new Date().toISOString()};
    const blob=new Blob([JSON.stringify(output,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Jobbies-'+j.company.replace(/[^a-z0-9]/gi,'-')+'-application.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Application package downloaded.');
  }
  function showImport(){
    modal('IMPORT FROM ANY JOB SOURCE',`<h2>Bring the good ones with you.</h2><p>Paste the original description from a major board, specialist site, recruiter, or employer. We’ll extract matching evidence and prepare a package.</p><form id="import-job-form"><label class="form-field">Job title<input id="import-title" required maxlength="250"></label><label class="form-field">Employer<input id="import-company" required maxlength="180"></label><label class="form-field">Original listing URL<input id="import-url" type="url" required placeholder="https://…"></label><label class="form-field">Location<input id="import-location" maxlength="200"></label><label class="form-field">Source name<input id="import-source" placeholder="Indeed, Roadtechs, recruiter…" maxlength="80"></label><label class="form-field">Job description<textarea id="import-description" required minlength="30" maxlength="22000"></textarea></label><button class="primary-button" type="submit">Import & prepare ${icon('arrow')}</button></form>`);
  }
  async function doPull(){if(!ready||E.busy)return;try{const run=await E.pull();if(run.busy)toast('A pull is already running in this browser.');else toast(run.results.length?`Pulled ${run.results.filter(r=>!r.error).length} sources. Prepared packages are in your review queue.`:'Sources are cooling down. Existing jobs and prepared applications are ready to review.');}catch(error){toast('Pull failed: '+error.message);}finally{render();}}
  function switchTab(next,updateURL=true){
    if(!titles[next])return;if(tab==='wizard'){clearTimeout(wizardSaveTimer);E.save();}
    tab=next;page=1;filtersOpen=false;search='';role='all';pay='all';clearanceFilter='all';sourceFilter='all';
    if(updateURL&&location.hash!=='#'+next)history.pushState(null,'','#'+next);
    closeNavigation();activate(true);if(innerWidth<651||['wizard','answers'].includes(next))dom('#workbench').scrollIntoView({behavior:'smooth'});
  }
  function activate(live){active=live;dom('.app').classList.toggle('sample-view',!live);dom('.board').hidden=live;dom('#workbench').hidden=!live;dom('#sync-dock').hidden=false;dom('#reset-demo').hidden=live;dom('.app').classList.toggle('shortlist-view',live&&tab==='opportunities');dom('#workspace-mode').textContent=live?'View design samples':'Return to live workspace';dom('.concept-badge').innerHTML=`<span></span>${live?(window.AmericaCompanion?.state.connected?'PRIVATE WORKSPACE':'BROWSER WORKSPACE'):'DESIGN SAMPLES'}`;document.querySelectorAll('.live-only-nav').forEach(el=>el.hidden=!live);if(!live){dom('.app').classList.remove('wizard-view');dom('#wizard-alert').hidden=true;window.render?.();}else render();}
  function closeNavigation(){document.body.classList.remove('navigation-open');dom('#mobile-menu').setAttribute('aria-expanded','false');}
  dom('#mobile-menu').addEventListener('click',()=>{const open=document.body.classList.toggle('navigation-open');dom('#mobile-menu').setAttribute('aria-expanded',String(open));});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('navigation-open')){closeNavigation();dom('#mobile-menu').focus();}});
  document.addEventListener('click',event=>{if(!event.target.closest('.sidebar, #mobile-menu'))closeNavigation();});
  function schedule(){clearInterval(timer);timer=setInterval(()=>{if(ready&&E.data.settings.autoPull&&!document.hidden&&Date.now()-(E.data.lastPull||0)>=E.data.settings.intervalHours*3600000)doPull();},60000);}
  document.addEventListener('click',async event=>{
    const radio=event.target.closest('#wizard-form input[type=radio]');if(radio?.checked){await submitWizardAnswer(radio.form);return;}
    const viewButton=event.target.closest('[data-live-view]');
    if(viewButton){event.preventDefault();event.stopImmediatePropagation();switchTab(viewButton.dataset.liveView);return;}
    if(event.target.closest('#workspace-mode')){activate(!active);return;}
    if(event.target.closest('#pull-jobs-button')){activate(true);await doPull();return;}
    if(!active){if(event.target.closest('[data-view], .brand'))closeNavigation();return;}
    const nav=event.target.closest('[data-view]');if(nav){event.stopImmediatePropagation();switchTab(nav.dataset.view);return;}
    const summary=event.target.closest('[data-summary]');if(summary){event.stopImmediatePropagation();sortBy=summary.dataset.summary==='family'?'family':'overall';switchTab(summary.dataset.summary==='wizard'?'wizard':summary.dataset.summary==='family'?'discovered':summary.dataset.summary==='opportunities'?'discovered':'review');return;}
    if(event.target.closest('.brand')){event.preventDefault();event.stopImmediatePropagation();switchTab('opportunities');return;}
    const sort=event.target.closest('[data-live-sort]');if(sort){sortBy=sort.dataset.liveSort;page=1;render();return;}
    const b=event.target.closest('[data-live-action]');if(!b)return;
    event.preventDefault();const {liveAction:a,id}=b.dataset;
    if(a==='wizard-back'){
      if(wizardSaving)return;const state=wizardState(),form=dom('#wizard-form');if(form)state.drafts[form.dataset.wizardId]=readWizardValue(form);
      if(state.editingRoute){restoreWizardRoute();await E.save();switchTab('answers');return;}
      let previous;while(state.backStack.length&&!previous){const id=state.backStack.pop();if(canEditWizardQuestion(state.steps[id]))previous=id;}
      if(!previous)return;state.forwardStack.push(state.current);state.current=previous;state.revisiting=true;wizardNote='Your earlier answer is here. Change it, or continue.';await E.save();renderWizard(true);return;
    }
    if(a==='wizard-skip'){
      if(wizardSaving)return;const state=wizardState(),q=state.steps[state.current];if(!q)return;
      if(state.editingRoute){restoreWizardRoute();await E.save();switchTab('answers');return;}
      if(wizardQuestions().some(v=>v.id===q.id))state.deferred[q.id]=q.fingerprint;
      advanceWizard(q);wizardNote='Saved for later. Let’s try the next one.';await E.save();renderWizard(true);return;
    }
    if(a==='wizard-retry'){const state=wizardState();state.deferred={};state.current=null;state.forwardStack=[];wizardNote='Welcome back. Pick up wherever you like.';await E.save();renderWizard(true);return;}
    if(a==='answer-edit'){
      const q=allReusableQuestions().find(q=>q.id===id);if(!q)return;const state=wizardState();
      state.editingRoute||={current:state.current,backStack:[...state.backStack],forwardStack:[...state.forwardStack],revisiting:!!state.revisiting};
      state.current=q.id;state.steps[q.id]=q;delete state.drafts[q.id];wizardNote='Update this answer. We’ll take you back to your full list.';await E.save();switchTab('wizard');return;
    }
    if(a==='pull'){await doPull();return;}
    if(a==='more'){page++;render();return;}
    if(a==='clear-search'){search='';role='all';pay='all';clearanceFilter='all';sourceFilter='all';render();return;}
    if(a==='save'){const d=E.data;d.saved=d.saved.includes(id)?d.saved.filter(x=>x!==id):[...d.saved,id];await E.save();render();return;}
    if(a==='detail'){detail(id);return;}if(a==='application'){application(id);return;}
    if(a==='prepare'){b.disabled=true;b.textContent='Preparing…';try{await E.prepare(id);await E.save();render();application(id);}catch(error){toast(error.message);}return;}
    if(a==='prepare-best'){if(loading)return;loading=true;b.disabled=true;b.textContent='Preparing…';try{await E.prepareBest();await E.save();toast('Best matches prepared.');}finally{loading=false;render();}return;}
    if(a==='save-application'){collectApplication(id);application(id);toast('Edits saved. Any previous approval has been cleared.');return;}
    if(a==='approve'){
      collectApplication(id);
      if(!E.approve(id)){application(id);toast('Resolve required answers, changed requirements, or eligibility blockers before approval.');return;}
      handoff(id);return;
    }
    if(a==='export'){exportPackage(id);return;}
    if(a==='attachment'){const file=E.data.drafts[id]?.attachments?.[b.dataset.field];if(file){const url=URL.createObjectURL(file),link=document.createElement('a');link.href=url;link.download=file.name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}return;}
    if(a==='confirm-submitted'){modal('CONFIRM ACTUAL SUBMISSION',`<h2>Did the employer confirm receipt?</h2><p>Only record this after you actually submitted on the employer site. Opening the form or downloading your resume is not a submission.</p>`,button('record-submitted','Yes, record my submission',id,true));return;}
    if(a==='record-submitted'){if(E.markSubmitted(id)){dialog.close();toast('Submission recorded from your confirmation.');render();}return;}
    if(a==='archive'){modal('ARCHIVE OPPORTUNITY',`<h2>Make room for better fits.</h2><label class="form-field">Reason<select id="live-archive-reason"><option>Not interested</option><option>Employer rejected</option><option>Pay below target</option><option>Schedule does not fit</option><option>Job closed</option><option>Other</option></select></label><p>Preserves your history and prevents automatic re-preparation. Archiving is not a withdrawal.</p>`,button('archive-confirm','Archive job',id,true));return;}
    if(a==='archive-confirm'){E.archive(id,dom('#live-archive-reason').value);dialog.close();render();return;}
    if(a==='restore'){E.restore(id);render();toast('Restored without reapplying or reactivating an approval.');return;}
    if(a==='import'){showImport();return;}
    if(a==='import-profile'){profileImport();return;}
    if(a==='add-source'){modal('ADD A PUBLIC EMPLOYER BOARD',`<h2>Follow an employer directly.</h2><p>Add a public Greenhouse, Lever, or Ashby board. A working feed provides job listings; it does not grant submission API access.</p><form id="add-source-form"><label class="form-field">Platform<select id="source-kind"><option value="greenhouse">Greenhouse</option><option value="lever">Lever</option><option value="ashby">Ashby</option></select></label><label class="form-field">Employer name<input id="source-name" required maxlength="100"></label><label class="form-field">Board identifier<input id="source-board" required pattern="[A-Za-z0-9_-]{1,80}" placeholder="company-board-name"></label><p>Use the board name from its public career URL, not an API key or a full URL. Browser access depends on the provider.</p><button class="primary-button" type="submit">Add board</button></form>`);return;}
    if(a==='edit-profile'){const p=E.data.profile;modal('YOUR PROFILE & RESUMES',`<h2>Start with the right facts.</h2><form id="profile-edit-form" data-return-view="${esc(tab)}">${['name','email','phone','linkedin','github','portfolio'].map(k=>`<label class="form-field">${esc(k)}<input name="${k}" value="${esc(p[k]||'')}" ${['name','email'].includes(k)?'required':''} ${k==='email'?'type="email"':''}></label>`).join('')}<label class="form-field">Skills (one per line)<textarea name="skills">${esc(p.skills.join('\n'))}</textarea></label><label class="form-field">Available work bases (one per line)<textarea name="bases">${esc(p.bases.join('\n'))}</textarea></label>${['technician','software'].map(track=>`<label class="form-field">${track==='technician'?'Technician':'Software'} resume<input id="resume-upload-${track}" type="file" accept=".pdf,.doc,.docx,.txt"><small>${esc(p.resumes[track]?.name||'No file attached')} · Select a file to replace it. Maximum 10 MB.</small></label>`).join('')}<p>Changes update unsent drafts and clear their approvals. Submitted snapshots remain unchanged.</p><button class="primary-button" type="submit">Save profile & resumes</button></form>`);}

  },true);
  document.addEventListener('input',event=>{if(event.target.id==='answer-search'){answerSearch=event.target.value;renderAnswerLibrary();return;}if(event.target.id==='live-search'){search=event.target.value;const pos=event.target.selectionStart;render();const input=dom('#live-search');input.focus();try{input.setSelectionRange(pos,pos);}catch{}}});
  document.addEventListener('input',event=>{const form=event.target.closest('#wizard-form');if(!form||wizardSaving)return;const state=wizardState();state.drafts[form.dataset.wizardId]=readWizardValue(form);clearTimeout(wizardSaveTimer);wizardSaveTimer=setTimeout(()=>E.save(),250);});
  document.addEventListener('change',event=>{
    if(event.target.id==='answer-category'){answerCategory=event.target.value;renderAnswerLibrary();return;}if(event.target.id==='answer-status'){answerStatus=event.target.value;renderAnswerLibrary();return;}
    const wizardForm=event.target.closest('#wizard-form');if(wizardForm&&(event.target.type==='radio'||event.target.tagName==='SELECT'&&!event.target.multiple)){submitWizardAnswer(wizardForm);return;}

    const el=event.target;
    if(el.id==='live-role'){role=el.value;render();}if(el.id==='live-pay'){pay=el.value;render();}
    if(el.id==='live-clearance'){clearanceFilter=el.value;render();}if(el.id==='live-source'){sourceFilter=el.value;render();}
    if(el.dataset.sourceToggle){E.setSource(el.dataset.sourceToggle,el.checked);}
    if(el.id==='auto-pull-toggle'){E.data.settings.autoPull=el.checked;E.save();render();}
    if(el.id==='auto-prepare-toggle'){E.data.settings.autoPrepare=el.checked;E.save();}
    if(el.id==='pull-frequency'){E.data.settings.intervalHours=Number(el.value);E.save();render();}
  });
  document.addEventListener('submit',async event=>{
    const form=event.target;
    if(form.id==='application-fields'){event.preventDefault();collectApplication(form.dataset.jobId);await E.save();application(form.dataset.jobId);toast('Application edits saved.');return;}
    if(form.id==='wizard-form'){event.preventDefault();await submitWizardAnswer(form);return;}
    if(form.id==='import-job-form'){event.preventDefault();try{const j=E.importJob({title:dom('#import-title').value,company:dom('#import-company').value,url:dom('#import-url').value,location:dom('#import-location').value,source:dom('#import-source').value,description:dom('#import-description').value});await E.prepare(j.id);await E.save();application(j.id);render();}catch(error){toast(error.message);}return;}
    if(form.id==='add-source-form'){event.preventDefault();try{E.addSource(dom('#source-kind').value,dom('#source-board').value.trim(),dom('#source-name').value);dialog.close();render();toast('Employer board added. Pull jobs to test and retrieve it.');}catch(error){toast(error.message);}return;}
    if(form.id==='profile-import-form'){event.preventDefault();const file=dom('#profile-import-file').files[0];try{if(!file||file.size>30*1024*1024)throw new Error('Choose a profile JSON file up to 30 MB.');await E.importProfile(JSON.parse(await file.text()));dialog.close();switchTab('profile');toast('Profile and resumes imported locally. Pull jobs for updated matches.');}catch(error){toast('Import failed: '+error.message);}return;}
    if(form.id==='profile-edit-form'){event.preventDefault();try{const values=Object.fromEntries(new FormData(form));values.skills=values.skills.split('\n').map(s=>s.trim()).filter(Boolean);values.bases=values.bases.split('\n').map(s=>s.trim()).filter(Boolean);const resumes={};for(const track of ['software','technician']){const file=dom('#resume-upload-'+track).files[0];if(file)resumes[track]=file;}await E.setProfile(values,resumes);dialog.close();switchTab(form.dataset.returnView==='answers'?'answers':'profile');toast('Profile saved locally. Unsent drafts refreshed.');}catch(error){toast(error.message);}return;}

  });
  document.addEventListener('focusout',event=>{
    const form=event.target.closest('#wizard-form');if(!form||wizardSaving||document.hidden)return;
    if(!event.target.matches('#wizard-answer'))return;
    const next=event.relatedTarget;if(next?.closest('button,a,input,select,textarea'))return;
    if(hasAnswer(readWizardValue(form)))submitWizardAnswer(form);
  });
  document.addEventListener('keydown',event=>{if(event.target.matches('#wizard-form textarea')&&event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();submitWizardAnswer(event.target.form);}});
  window.addEventListener('hashchange',()=>{if(ready){const next=location.hash.slice(1);switchTab(titles[next]?next:'opportunities',false);}});
  document.addEventListener('visibilitychange',()=>{if(ready&&!document.hidden&&E.data.settings.autoPull&&Date.now()-(E.data.lastPull||0)>=E.data.settings.intervalHours*3600000)doPull();});
  window.addEventListener('america-companion-change',()=>{if(ready&&tab==='intelligence')render();});
  E.subscribe(()=>{if(ready&&!wizardSaving)render();});
  E.init().then(async()=>{await window.AmericaCompanion?.init();ready=true;tab=titles[location.hash.slice(1)]?location.hash.slice(1):'opportunities';activate(true);schedule();await E.refreshQuestionSets();if(E.data.settings.autoPull&&Date.now()-(E.data.lastPull||0)>=E.data.settings.intervalHours*3600000)await doPull();}).catch(error=>{dom('#pull-status').textContent='Live workspace unavailable: '+error.message;dom('#pull-jobs-button').disabled=true;toast('Live storage could not open. Design samples remain available.');activate(false);});
})();
