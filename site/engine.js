/* Public-feed discovery and candidate-specific preparation. No employer writes. */
(() => {
  'use strict';
  const HOUR = 3600000;
  const K=window.ApplicantKnowledge;
  const questionVersion='2026-10-20-full-questions-v1';
  const sources = [
    {id:'remotive',name:'Remotive',group:'Specialist boards',kind:'remotive',url:'https://remotive.com/api/remote-jobs?category=software-dev',home:'https://remotive.com/',interval:6*HOUR,enabled:true,note:'Public remote software feed. Listings may be delayed by 24 hours. Source attribution retained.'},
    {id:'jobicy',name:'Jobicy',group:'Specialist boards',kind:'jobicy',url:'https://jobicy.com/api/v2/remote-jobs?count=200',home:'https://jobicy.com/',interval:HOUR,enabled:true,note:'Remote roles from the last seven days. Paginated; the feed is not a complete historical catalog.'},
    {id:'gh-coreweave',name:'CoreWeave',group:'Direct employers',kind:'greenhouse',board:'coreweave',home:'https://www.coreweave.com/careers',interval:HOUR,enabled:true,note:'Direct public employer board: infrastructure, data centers, and software.'},
    {id:'gh-astranis',name:'Astranis',group:'Direct employers',kind:'greenhouse',board:'astranis',home:'https://www.astranis.com/careers',interval:HOUR,enabled:true,note:'Direct public employer board: communications, hardware, and software.'},
    {id:'gh-anduril',name:'Anduril',group:'Direct employers',kind:'greenhouse',board:'andurilindustries',home:'https://www.anduril.com/careers/',interval:HOUR,enabled:true,note:'Direct public employer board. Inspect each role’s clearance and customer requirements.'},
    {id:'linkedin',name:'LinkedIn',group:'Major boards',kind:'manual',home:'https://www.linkedin.com/jobs/',note:'Open search and import a description. No automated LinkedIn scraping or submission is connected.'},
    {id:'indeed',name:'Indeed',group:'Major boards',kind:'manual',home:'https://www.indeed.com/jobs?q=traveling+fiber+technician&l=United+States',note:'Open search and import a description. An authorized integration is required for automated coverage.'},
    {id:'ziprecruiter',name:'ZipRecruiter',group:'Major boards',kind:'manual',home:'https://www.ziprecruiter.com/jobs-search?search=traveling+fiber+technician',note:'Open search and import. No partner job feed is connected.'},
    {id:'glassdoor',name:'Glassdoor',group:'Major boards',kind:'manual',home:'https://www.glassdoor.com/Job/index.htm',note:'Open search and import. No automated connection is configured.'},
    {id:'dice',name:'Dice',group:'Specialist boards',kind:'manual',home:'https://www.dice.com/jobs',note:'Technology and contract roles. Open search and import a description.'},
    {id:'roadtechs',name:'Roadtechs',group:'Specialist boards',kind:'manual',home:'https://www.roadtechs.com/search/search.php',note:'Traveling contractors, telecom, government, overseas, and shutdown projects. Open search and import.'},
    {id:'roaddog',name:'RoadDogJobs',group:'Specialist boards',kind:'manual',home:'https://www.roaddogjobs.com/search',note:'Travel construction and per-diem contracts. Open search and import.'},
    {id:'clearancejobs',name:'ClearanceJobs',group:'Specialist boards',kind:'manual',home:'https://www.clearancejobs.com/jobs',note:'Cleared roles. Registration has its own eligibility rules; no automated connection is configured.'},
    {id:'wwr',name:'We Work Remotely',group:'Specialist boards',kind:'manual',home:'https://weworkremotely.com/',note:'Remote specialist board. Open search and import.'},
    {id:'usajobs',name:'USAJOBS',group:'Government & projects',kind:'credential',home:'https://www.usajobs.gov/',note:'Official search API requires an API key and a secure server connection. Open search and import for now.'},
    {id:'parsons',name:'Parsons',group:'Government & projects',kind:'manual',home:'https://www.parsons.com/careers/',note:'Direct employer watchlist. Agency and contract ownership must be checked per job.'},
    {id:'leidos',name:'Leidos',group:'Government & projects',kind:'manual',home:'https://careers.leidos.com/',note:'Direct employer watchlist for technical and government-project roles.'},
    {id:'afl',name:'AFL',group:'Direct employers',kind:'manual',home:'https://www.aflglobal.com/en/Careers',note:'Fiber and field-services employer watchlist. Import selected listings.'}
  ];
  const defaultAnswers = {
    salary_target:{value:'100000',label:'Annual compensation target (USD)',source:'Confirmed preference'},
    travel_percent:{value:'100',label:'Travel availability during assignments (%)',source:'Confirmed preference'}
  };
  let db, data, listeners=[], busy=false, saveTail=Promise.resolve();
  const resumeURLs=new WeakMap();
  const bundledResumeVersion='2026-10-20-evidence-3';
  const bundledResumePaths=new Set(['resumes/James_Weeks_Technician_Resume.docx','resumes/James_Weeks_Software_Resume_Updated.docx']);
  function resumeURL(resume){
    if(resume?.file instanceof Blob){if(!resumeURLs.has(resume.file))resumeURLs.set(resume.file,URL.createObjectURL(resume.file));return resumeURLs.get(resume.file);}
    if(bundledResumePaths.has(resume?.url))return new URL(resume.url,document.baseURI).href;
    return '';
  }
  function refreshMatches(){
    for(const job of Object.values(data.jobs)){
      const normalized=normalize({...job,externalId:job.externalId},{id:job.sourceId,name:job.sourceName,kind:'manual'});
      if(normalized)for(const key of ['fit','matchEvidence','overall'])job[key]=normalized[key];
    }
  }
  async function setProfile(input,resumes={}){
    if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Choose an AMERICA profile JSON file.');
    const prior=data.profile,p={...prior};
    for(const k of ['name','email','phone','linkedin','github','portfolio'])if(k in input)p[k]=String(input[k]??'').slice(0,500);
    for(const k of ['linkedin','github','portfolio'])p[k]=safeURL(p[k]);
    for(const k of ['skills','bases'])if(k in input){if(!Array.isArray(input[k]))throw new Error(k+' must be a list.');p[k]=input[k].slice(0,100).map(s=>String(s).trim().slice(0,150)).filter(Boolean);}
    if(Array.isArray(input.experience))p.experience=structuredClone(input.experience).slice(0,100);
    if(input.education&&typeof input.education==='object'&&!Array.isArray(input.education))p.education=structuredClone(input.education);
    p.provenance='Imported or entered by you. Verify profile facts before approving each application.';
    p.resumes={...prior.resumes};
    for(const track of ['software','technician'])if(resumes[track]){
      const f=resumes[track];if(!(f instanceof File)||f.size>10*1024*1024||!f.size)throw new Error('Each resume must be a nonempty file up to 10 MB.');
      p.resumes[track]={name:f.name,file:f,url:''};
    }
    data.profile=p;
    for(const k of ['name','first_name','last_name','email','phone','linkedin','github','portfolio'])delete data.answers[k];
    refreshMatches();
    for(const [id,d] of Object.entries(data.drafts))if(d.stage!=='submitted'){d.approved=false;d.version++;reconcileDraft(id);}
    await save();emit();
  }
  async function importProfile(payload){
    const input=payload?.format==='america-profile-v1'?payload.profile:payload,resumes={};
    if(payload?.format==='america-profile-v1')for(const track of ['software','technician']){
      const r=payload.resumes?.[track];if(!r)continue;
      if(typeof r.base64!=='string'||r.base64.length>14*1024*1024)throw new Error('Invalid or oversized resume attachment.');
      const bytes=Uint8Array.from(atob(r.base64),c=>c.charCodeAt(0));
      resumes[track]=new File([bytes],String(r.name||track+'-resume.docx'),{type:String(r.type||'application/octet-stream')});
    }
    await setProfile(input,resumes);
  }
  const text = value => {
    let result=String(value??'').slice(0,100000);
    for(let pass=0;pass<3;pass++){
      const doc = new DOMParser().parseFromString(result,'text/html');
      doc.querySelectorAll('script,style,iframe').forEach(el=>el.remove());
      doc.querySelectorAll('p,div,li,br,h1,h2,h3,h4').forEach(el=>el.append('\n'));
      result=doc.body.textContent||'';
      if(!/<\/?[a-z][^>]*>|&lt;\/?[a-z]/i.test(result))break;
    }
    return result.replace(/[ \t]+/g,' ').replace(/\n\s*\n/g,'\n').trim().slice(0,22000);
  };
  function safeURL(value){try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}}
  function canonical(value){try{const u=new URL(value);for(const k of [...u.searchParams.keys()])if(/^(utm_|ref$|source$)/i.test(k))u.searchParams.delete(k);u.hash='';return u.href.replace(/\/$/,'');}catch{return value;}}
  function emit(){listeners.forEach(fn=>fn(data));}
  function save(){const snapshot=structuredClone(data);saveTail=saveTail.catch(()=>{}).then(()=>new Promise((resolve,reject)=>{const tx=db.transaction('workspace','readwrite');tx.objectStore('workspace').put(snapshot,'state');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);}));saveTail.catch(()=>{data.storageError='Could not save browser data. Export important applications before closing.';emit();});return saveTail;}
  async function init(){
    db=await new Promise((resolve,reject)=>{const request=indexedDB.open('america-workspace',1);request.onupgradeneeded=()=>request.result.createObjectStore('workspace');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
    data=await new Promise((resolve,reject)=>{const r=db.transaction('workspace').objectStore('workspace').get('state');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    let seed;
    if(!data||data.bundledResumeVersion!==bundledResumeVersion){
      try{const r=await fetch('profile-seed.json',{cache:'no-store'});if(!r.ok)throw new Error('Profile could not be loaded.');seed=await r.json();}catch(error){if(!data)throw error;}
    }
    if(!data)data={version:1,profile:structuredClone(seed),answers:defaultAnswers,jobs:{},drafts:{},archived:{},saved:[],sourceState:{},customSources:[],settings:{autoPull:true,intervalHours:6,autoPrepare:true,minimumFit:55,maximumPrepare:12},runs:[],lastPull:null};
    if(seed){
      let changed=false;
      const p=data.profile,blank=!p.name&&!p.email&&!(p.skills||[]).length&&!(p.experience||[]).length;
      data.resumeLibrary=structuredClone(seed.resumes);
      if(blank){data.profile={...structuredClone(seed),bases:p.bases?.length?p.bases:seed.bases};changed=true;}
      // Preserve edited profiles, uploaded replacements, saved answers, and submitted snapshots.
      const sameCandidate=data.profile.name===seed.name||data.profile.email===seed.email;
      if(sameCandidate){
        data.profile.resumeEvidence||=structuredClone(seed.resumeEvidence);
        for(const role of data.profile.experience||[]){const original=seed.experience.find(r=>r.role===role.role&&r.start_month===role.start_month);if(original)role.evidence_statements=structuredClone(original.evidence_statements);}
        data.profile.resumes||={};
        for(const track of ['software','technician'])if(!resumeURL(data.profile.resumes[track])){data.profile.resumes[track]=structuredClone(seed.resumes[track]);changed=true;}
      }
      if(changed){refreshMatches();for(const d of Object.values(data.drafts))if(d.stage!=='submitted'){d.approved=false;d.version++;}}
      data.bundledResumeVersion=bundledResumeVersion;
      await save();
    }
    data.settings ||= {autoPull:true,intervalHours:6,autoPrepare:true,minimumFit:55,maximumPrepare:12};
    migrateAnswerKnowledge();
    // Refresh derived matching fields after parser improvements without another network pull.
    for(const job of Object.values(data.jobs)){job.description=text(job.description);job.rotation=rotationExcerpt(job.description);job.familyScore=job.rotation?65:job.pto?50:null;setMarket(job);}
    for(const id of Object.keys(data.drafts)){const d=data.drafts[id];if(d.stage!=='submitted'){if(d.questionVersion!==questionVersion){d.questionsNeedRefresh=true;d.approved=false;d.version++;}addEligibilityQuestions(d.fields,data.jobs[id]);reconcileDraft(id);}}
    await save();emit();return data;
  }
  const allSources=()=>[...sources,...(data?.customSources||[])];
  const sourceEnabled=s=>s.kind!=='manual'&&s.kind!=='credential'&&(data.sourceState[s.id]?.enabled??s.enabled??true);
  function excerpt(description,regex){return description.split(/[\n]|(?<=[.!?])\s+/).find(line=>regex.test(line))?.trim().slice(0,420)||'';}
  function rotationExcerpt(description){return description.split(/[\n]|(?<=[.!?])\s+/).find(line=>!/on.call|shift rotation|rotating shift/i.test(line)&&/\d+\s*(?:weeks?|days?).{0,25}\bon\b.{0,30}\boff\b|weeks?\s+off|between (projects|assignments)|consecutive.*leave|home rotation|rotational (assignment|schedule)/i.test(line))?.trim().slice(0,420)||'';}
  function setMarket(job){
    const us=/\bUSA\b|\bUS\b|United States|\bU\.S\.\b/i.test(job.location),global=/anywhere|worldwide|global/i.test(job.location);
    job.marketExcluded=job.remote&&!us&&!global&&/canada|united kingdom|\bUK\b|europe|germany|australia|new zealand|india|philippines|latin america|brazil|poland|france|spain|netherlands/i.test(job.location);
    job.marketNote=job.marketExcluded?'Location outside your US-remote focus':us?'US location/eligibility mentioned':global?'Worldwide eligibility — employer base to verify':'Location and eligibility to verify';
  }
  function parsePay(value,structured={}){
    const raw=text(value), currency=structured.currency||(/\bUSD\b|\$/i.test(raw)&&!/\b(CAD|AUD|NZD)\b/.test(raw)?'USD':null);
    if(structured.min&&structured.period)return {text:raw||`${structured.min}${structured.max?'–'+structured.max:''} ${currency||''} / ${structured.period}`,min:Number(structured.min),max:Number(structured.max)||null,currency,period:structured.period};
    const match=raw.match(/\$\s*([\d,]+(?:\.\d+)?)\s*([kK])?\s*(?:–|—|-|to)\s*\$?\s*([\d,]+(?:\.\d+)?)\s*([kK])?/);
    const hourly=/\b(per hour|hourly|an hour)\b|\/\s*(hr|hour)\b/i.test(raw), yearly=/\b(annual|annually|per year|yearly|base salary)\b|\/\s*(yr|year)\b/i.test(raw);
    if(match&&(hourly||yearly)){const lo=Number(match[1].replaceAll(',',''))*(match[2]?1000:1),hi=Number(match[3].replaceAll(',',''))*(match[4]?1000:1);if(hi>=lo)return {text:raw,min:lo,max:hi,currency,period:hourly?'hourly':'yearly'};}
    return {text:raw||'Compensation not published',min:null,max:null,currency,period:null};
  }
  function normalize(raw,source){
    const kind=source.kind;
    let job;
    if(kind==='remotive')job={externalId:raw.id,title:raw.title,company:raw.company_name,location:raw.candidate_required_location,description:raw.description,url:raw.url,employment:raw.job_type,published:raw.publication_date,payText:raw.salary,remote:true};
    else if(kind==='jobicy')job={externalId:raw.id,title:raw.jobTitle,company:raw.companyName,location:raw.jobGeo,description:raw.jobDescription,url:raw.url,employment:(raw.jobType||[]).join(', '),published:raw.pubDate,payData:{min:raw.salaryMin,max:raw.salaryMax,currency:raw.salaryCurrency,period:raw.salaryPeriod},remote:true};
    else if(kind==='greenhouse')job={externalId:raw.id,title:raw.title,company:raw.company_name||source.name,location:raw.location?.name,description:raw.content,url:raw.absolute_url,published:raw.first_published||raw.updated_at,deadline:raw.application_deadline,board:source.board};
    else if(kind==='lever')job={externalId:raw.id,title:raw.text,company:source.name,location:raw.categories?.location,description:raw.descriptionPlain+'\n'+(raw.lists||[]).map(l=>l.text+'\n'+text(l.content)).join('\n'),url:raw.hostedUrl||raw.applyUrl,employment:raw.categories?.commitment,remote:raw.workplaceType==='remote'};
    else if(kind==='ashby')job={externalId:raw.id,title:raw.title,company:source.name,location:raw.location,description:raw.descriptionPlain||raw.descriptionHtml,url:raw.jobUrl||raw.applyUrl,published:raw.publishedAt,employment:raw.employmentType,remote:raw.isRemote,payText:raw.compensation?.compensationTierSummary};
    else job={...raw,externalId:raw.externalId||crypto.randomUUID()};
    job.title=text(job.title).slice(0,250);job.company=text(job.company||source.name).slice(0,180);job.location=text(job.location||'Location unconfirmed').slice(0,350);job.description=text(job.description);
    job.url=safeURL(job.url);if(!job.url||!job.title)return null;
    job.id=source.id+':'+job.externalId;job.sourceId=source.id;job.sourceName=source.name;job.kind=kind;job.observedAt=new Date().toISOString();job.sources=[{id:source.id,name:source.name,url:job.url}];
    job.isTechnical=/fiber|fibre|splic|telecom|technician|network|software|developer|field service|infrastructure|commissioning|systems|data.?center|full.?stack|front.?end|back.?end/i.test(job.title);
    const title=job.title.toLowerCase(),body=job.description.toLowerCase();
    job.track=/fiber|splic|telecom|technician|field service|commissioning|data.?center/i.test(title)?'technician':'software';
    job.remote=!!job.remote||/\bremote\b/i.test(job.location);
    job.travel=!!excerpt(job.description,/\btravel\b.*\b(\d{1,3}%|required|nationwide|international)|\b(\d{1,3}%|nationwide|international).*\btravel\b/i)||/\btravel(?:ing|ling)?\b/i.test(title);
    job.contract=/contract|temporary|fixed.term/i.test(job.employment||'')||/\b(contract|temporary|fixed.term)\b/i.test(title);
    const payLine=job.payText||excerpt(job.description,/\$\s*[\d,]+.*(?:salary|per year|annually|annual|hour|\/hr)|(?:salary|base pay|annual compensation).*\$\s*[\d,]+/i);
    job.pay=parsePay(payLine,job.payData);
    job.pto=excerpt(job.description,/\bPTO\b|paid time off|vacation|annual leave/i);
    job.rotation=rotationExcerpt(job.description);
    job.perDiem=excerpt(job.description,/per diem|lodging|hotel.*(paid|provided|cover)/i);
    job.agencyEvidence=excerpt(job.description,/\bFAA\b|Federal Aviation Administration|Department of (Defense|Energy|State|Transportation)|\bDoD\b|\bNASA\b/);
    job.agency=job.agencyEvidence?'Agency mentioned — verify project relationship':'Project customer unconfirmed';
    job.clearanceEvidence=excerpt(job.description,/\bclearance\b|\bpublic trust\b|suitability|badging/i);
    job.clearance=/no (security )?clearance|clearance.{0,12}not required/i.test(body)?'none':/active.{0,30}(secret|clearance)|current.{0,30}(secret|clearance)|must (hold|possess).{0,30}(secret|clearance)/i.test(body)?'existing':/(sponsor|sponsorship).{0,60}(security clearance)|(security clearance).{0,60}(sponsor|sponsorship)/i.test(body)?'sponsor':/public trust|suitability|badging/i.test(body)?'screening':'unknown';
    job.clearanceLevel=/top secret|\bTS\/SCI\b/i.test(job.clearanceEvidence)?'Top Secret':/\bsecret\b/i.test(job.clearanceEvidence)?'Secret':null;
    job.citizenshipEvidence=excerpt(job.description,/(U\.?S\.?|United States) citizen(ship)?/i);
    const relevant=(data?.profile.skills||[]).filter(skill=>skill.length>2&&body.includes(skill.toLowerCase()));
    job.matchEvidence=relevant.slice(0,12);
    job.fit=Math.min(95,(job.isTechnical?35:0)+Math.min(42,relevant.length*6)+(/fiber|splic|vue|full.?stack|network|communications|field service/i.test(title)?15:0)+(job.travel?5:0));
    job.familyScore=job.rotation?65:job.pto?50:null;
    job.payScore=job.pay.min&&job.pay.currency==='USD'&&/year|annual/i.test(job.pay.period)?Math.min(100,job.pay.min/1500):null;
    job.overall=Math.round(job.fit*.75+(job.payScore??40)*.15+(job.familyScore??35)*.1);
    job.seniorityReview=/principal|staff |director|vice president|\bVP\b/i.test(job.title);
    if(job.seniorityReview)job.overall-=12;
    setMarket(job);job.descriptionFingerprint=job.description.slice(0,12000);return job;
  }
  async function request(url,source){
    for(let attempt=0;attempt<2;attempt++){
      try{
        const r=await fetch(url,{signal:AbortSignal.timeout(20000),credentials:'omit'});
        if(r.status===429){const retry=r.headers.get('Retry-After'),delay=/^\d+$/.test(retry||'')?Number(retry)*1000:Date.parse(retry||'')-Date.now();data.sourceState[source.id].nextAllowed=Date.now()+Math.max(HOUR,Number.isFinite(delay)?delay:HOUR);throw new Error('Rate limited. The next allowed retry is saved.');}
        if(!r.ok){if(r.status>=500&&attempt===0){await new Promise(resolve=>setTimeout(resolve,1000));continue;}throw new Error(`Source returned HTTP ${r.status}.`);}
        return await r.json();
      }catch(error){if(attempt===0&&(error.name==='TimeoutError'||error instanceof TypeError)){await new Promise(resolve=>setTimeout(resolve,1000));continue;}throw error;}
    }
  }
  async function readSource(source){
    const st=data.sourceState[source.id]||={};st.state='pulling';st.error=null;emit();
    try{
      let raw=[],url=source.url;
      if(source.kind==='greenhouse')url=`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(source.board)}/jobs?content=true`;
      if(source.kind==='lever')url=`https://api.lever.co/v0/postings/${encodeURIComponent(source.board)}?mode=json`;
      if(source.kind==='ashby')url=`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(source.board)}?includeCompensation=true`;
      let next=null,page=0,partial=false;
      do {
        const pageURL=page&&next?url+'&cursor='+encodeURIComponent(next):url;
        const payload=await request(pageURL,source);
        if(payload.success===false)throw new Error(payload.error||'The source reported a failed request.');
        const list=Array.isArray(payload)?payload:payload.jobs;
        if(!Array.isArray(list))throw new Error('Unexpected feed format; previous jobs retained.');
        raw.push(...list);next=source.kind==='jobicy'?payload.nextCursor:null;page++;
      }while(next&&page<8);
      partial=!!next;
      let added=0,updated=0,relevant=0;
      for(const item of raw){
        const j=normalize(item,source);if(!j||!j.isTechnical)continue;relevant++;
        const previous=data.jobs[j.id]||Object.values(data.jobs).find(old=>canonical(old.url)===canonical(j.url));
        if(previous){
          j.id=previous.id;j.sources=[...previous.sources,...j.sources.filter(s=>!previous.sources.some(p=>p.id===s.id))];
          if(previous.descriptionFingerprint!==j.descriptionFingerprint&&data.drafts[j.id]&&data.drafts[j.id].stage!=='submitted'){data.drafts[j.id].approved=false;data.drafts[j.id].requirementsChanged=true;}
          updated++;
        }else added++;
        data.jobs[j.id]=j;
      }
      Object.assign(st,{state:partial?'partial':'ok',lastSuccess:Date.now(),lastAttempt:Date.now(),nextAllowed:Date.now()+source.interval,read:raw.length,relevant,added,updated,partial,error:null});
      return {source:source.name,added,updated,read:raw.length,partial};
    }catch(error){Object.assign(st,{state:'error',lastAttempt:Date.now(),nextAllowed:Math.max(st.nextAllowed||0,Date.now()+15*60000),error:error.name==='TimeoutError'?'Source timed out; existing jobs retained.':error instanceof TypeError?'Connection or browser access failed; existing jobs retained.':error.message});return {source:source.name,error:st.error};}
    finally{await save();emit();}
  }
  async function pull(){
    if(busy)return {busy:true};
    const task=async()=>{
      busy=true;emit();
      try{
        const pending=allSources().filter(s=>sourceEnabled(s)&&Date.now()>=(data.sourceState[s.id]?.nextAllowed||0));
        const results=[];let index=0;
        await Promise.all(Array.from({length:Math.min(3,pending.length)},async()=>{while(index<pending.length){const s=pending[index++];results.push(await readSource(s));}}));
        if(pending.length)data.lastPull=Date.now();
        if(data.settings.autoPrepare)await prepareBest();
        const run={at:Date.now(),results,skipped:allSources().filter(sourceEnabled).length-pending.length};data.runs.unshift(run);data.runs=data.runs.slice(0,15);await save();return run;
      }finally{busy=false;emit();}
    };
    return navigator.locks?navigator.locks.request('america-pull',{ifAvailable:true},lock=>lock?task():{busy:true}):task();
  }
  const factDefinitions={
    ...Object.fromEntries(K.catalog.map(q=>[q.key,q])),
    us_citizen:{label:'Are you a US citizen?',options:['Yes','No']},
    us_work_authorization:{label:'Are you authorized to work in the United States?',options:['Yes','No']},
    us_sponsorship:{label:'Do you need employment visa sponsorship in the United States?',options:['Yes','No']},
    us_unrestricted_work_authorization:{label:'Can you work for any employer in the United States without immigration restrictions?',options:['Yes','No']},
    us_work_without_sponsorship:{label:'Can you work in the United States without employment visa sponsorship?',options:['Yes','No']},
    us_citizen_or_resident:{label:'Are you a US citizen or a lawful permanent resident?',options:['Yes','No']},
    us_export_person:{label:'Do you qualify as a US person for US export-control purposes?',options:['Yes','No']},
    us_national:{label:'Are you a US citizen or US national?',options:['Yes','No']},
    us_work_status:{label:'What is your US work-authorization status?',options:['US citizen','Lawful permanent resident','Other / verify']},
    age_over_18:{label:'Are you at least 18 years old?',options:['Yes','No']},
    us_driver_license_valid:{label:'Do you hold a valid US driver’s license?',options:['Yes','No']},
    travel_percent:{label:'What percentage of travel can you take during assignments?',options:[]}
  };
  function semanticText(value){return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’‘]/g,"'").replace(/\bu[.\s]*s[.\s]*(?:a\.?)?\b/g,' united states ').replace(/\bamerican\b/g,'united states').replace(/[^a-z0-9%]+/g,' ').replace(/\s+/g,' ').trim();}
  function booleanAnswer(value){const v=semanticText(value);if(/^(yes|true|y|1)( |$)/.test(v)&&!/\b(but|only if|provided|assuming|subject to)\b/.test(v))return 'Yes';if(/^(no|false|n|0)( |$)/.test(v))return 'No';return null;}
  function resolveFact(key,job){
    const record=data.answers[key];if(record&&record.value!==''&&record.value!==undefined&&record.value!==null)return {known:true,value:record.value,source:record.source&&record.source!=='User answer'?record.source:'Saved answer',derivedFrom:[]};
    const citizen=booleanAnswer(data.answers.us_citizen?.value)==='Yes'||semanticText(data.answers.us_work_status?.value)==='united states citizen';
    const inferred=value=>({known:true,value,source:'Inferred from your confirmed US citizenship',derivedFrom:['us_citizen']});
    if(citizen){if(['us_citizen','us_work_authorization','us_unrestricted_work_authorization','us_work_without_sponsorship','us_citizen_or_resident','us_export_person','us_national'].includes(key))return inferred('Yes');if(key==='us_sponsorship')return inferred('No');if(key==='us_work_status')return inferred('US citizen');}
    if(key==='us_citizen_or_resident'&&booleanAnswer(data.answers.us_permanent_resident?.value)==='Yes')return {known:true,value:'Yes',source:'Inferred from your saved permanent-resident status',derivedFrom:['us_permanent_resident']};
    if(key==='us_work_without_sponsorship'&&booleanAnswer(data.answers.us_work_authorization?.value)==='Yes'&&booleanAnswer(data.answers.us_sponsorship?.value)==='No')return {known:true,value:'Yes',source:'Inferred from your saved work authorization and sponsorship answers',derivedFrom:['us_work_authorization','us_sponsorship']};
    return K.infer(key,{profile:data.profile,answers:data.answers,job})||{known:false,value:'',source:'Needs your answer',derivedFrom:[]};
  }
  function knownAnswer(key){return resolveFact(key).value;}
  function fieldMeaning(label,job,options=[]){
    const l=semanticText(label),country=/united states/.test(l),foreign=/\b(canada|canadian|united kingdom|british|australia|australian|india|indian|philippines|philippine|singapore|europe|european)\b/.test(l);
    const usContext=!foreign&&(country||/\bUSA\b|\bUS\b|United States/i.test(job?.location||''));
    const none=explanation=>({key:null,inverted:false,explanation:explanation||''});
    if(/\b(consent|signature|acknowledge|attest|agree|certify)\b|privacy policy|terms and conditions/.test(l))return none();
    if(country&&!foreign&&/united states person/.test(l)&&/itar|ear|export|22 cfr|15 cfr/.test(l)&&!/clearance|polygraph|export license/.test(l))return {key:'us_export_person',inverted:false};
    const eligibility=/citizen|citizenship|authoriz|authoris|eligible|sponsor/.test(l);
    if(eligibility&&/clearance|polygraph|export license|\band\b.{0,25}(degree|experience|residen|relocat)|exclusiv|dual citizen|only citizen|born in|by birth|by naturalization|held.{0,20}citizenship|background check|drug test|drug screen/.test(l))return none('This asks for an additional condition beyond citizenship. Your saved citizenship alone cannot answer the whole question.');
    if(/(?:provide|present|upload|possess).{0,25}(?:proof|document|evidence)|passport number|birth certificate/.test(l))return none();
    if(/citizen/.test(l)&&/\band\b.{0,70}(licen[cs]e|passport|age|18|resid|relocat|travel|clearance|degree)/.test(l))return none('Your saved citizenship is only part of this combined requirement.');
    const result=(key,inverted=false,extra={})=>({key,inverted,...extra});
    if(country&&!foreign&&/citizen|citizenship/.test(l)&&!/what countr|which countr|countr.{0,15}citizenship/.test(l)){
      if(options.some(o=>/permanent resident|green card|h 1b|f 1/.test(semanticText(o.label)))&&!options.some(o=>booleanAnswer(o.label)))return result('us_work_status');
      if(/\bnational\b/.test(l)&&/\bor\b/.test(l))return result('us_national');
      if(/permanent residen|green card/.test(l))return /\bor\b/.test(l)?result('us_citizen_or_resident'):none('Citizenship and permanent residence are different facts.');
      if(/sponsor|authoriz|authoris/.test(l))return none('This combines citizenship with another eligibility condition.');
      return result('us_citizen',/\bnot\b.{0,20}citizen|\bnon\b.{0,20}citizen|lack.{0,20}citizenship/.test(l));
    }
    if(usContext&&/sponsor/.test(l)&&/visa|immigration|employment|work|now or in the future/.test(l)){
      if(/without.{0,40}sponsor|no.{0,15}sponsorship/.test(l)&&/work|employ/.test(l))return result('us_work_without_sponsorship');
      return result('us_sponsorship',/not.{0,20}(need|require)|no.{0,15}(need|require)/.test(l));
    }
    if(usContext&&/authoriz|authoris|right to work|eligib.{0,15}(work|employ)|permitted to work/.test(l)){
      if(/status|type of|category/.test(l)&&!/yes or no/.test(l))return result('us_work_status');
      return result(/any employer|unrestricted|without restrictions|unlimited/.test(l)?'us_unrestricted_work_authorization':'us_work_authorization',/not.{0,20}(authoriz|authoris|eligible)|unable to work|do not have.{0,20}right to work/.test(l));
    }
    if(/\b18\b/.test(l)&&/at least|or older|over the age|18 years of age/.test(l)&&!/under|younger|and|convict/.test(l))return result('age_over_18');
    if(usContext&&/valid.{0,20}driver.{0,15}licen[cs]e/.test(l)&&!/commercial|\bcdl\b|clean|driving record|and/.test(l))return result('us_driver_license_valid');
    if(/travel/.test(l)&&!/relocat|short notice|year round|continuous|and|without returning/.test(l)){
      const percent=l.match(/(\d{1,3})\s*%/);if(percent&&/willing|able|availab/.test(l))return result('travel_percent',false,{threshold:Number(percent[1])});
      if(/percent|percentage|how much/.test(l))return result('travel_percent');
    }
    if(/first name|given name/.test(l))return result('first_name');if(/last name|surname|family name/.test(l))return result('last_name');
    if(/full name|^name$/.test(l))return result('name');if(/^(your |personal |contact )?e ?mail( address)?$/.test(l))return result('email');if(/^(your |contact |mobile |cell |telephone )?(phone|telephone|mobile|cell)( number)?$/.test(l))return result('phone');
    if(/linkedin/.test(l))return result('linkedin');if(/github/.test(l))return result('github');if(/^(personal |your )?(website|portfolio)( url| link| address)?$/.test(l))return result('portfolio');
    if(/^(upload |attach |your |current )?(resume|cv)( (or )?(resume|cv))?( file| optional)?$/.test(l))return result('resume');
    if(/street|postal|zip code|address line|state of residence|country of residence/.test(l))return none();
    if(/current.*(city|location)|where do you (reside|live)|currently (reside|live)|residential location/.test(l))return result('current_location');
    if(/start date|available to start|when can you start/.test(l))return result('start_date');
    if(/years/.test(l)&&!K.match(label,job,options)){const skill=[...(data.profile.skills||[])].sort((a,b)=>b.length-a.length).find(s=>s.length>2&&l.includes(semanticText(s)));if(skill)return result('years_experience:'+skill.toLowerCase());}
    return K.match(label,job,options)||none();
  }
  function fieldFactValue(field,value){
    const selected=field.options?.find(o=>String(o.value)===String(value));let fact=booleanAnswer(selected?.label??value);
    if(!fact&&['us_citizen','us_work_status'].includes(field.key)){
      const label=semanticText(selected?.label??value);if(/^(i am a |a )?united states citizen$/.test(label))fact='Yes';if(/^(i am )?not (a )?united states citizen$/.test(label))fact='No';
    }
    return field.inverted&&fact?(fact==='Yes'?'No':'Yes'):fact;
  }
  function migrateAnswerKnowledge(){
    if(data.answerKnowledgeVersion==='2026-10-20-v3')return;
    const candidates=new Map(),promotions=[];
    for(const d of Object.values(data.drafts))for(const original of d.fields)if(!original.internal){
      const meaning=fieldMeaning(original.label,data.jobs[d.jobId],original.options||[]);
      const f=d.stage==='submitted'?{...original,...meaning}:Object.assign(original,meaning);
      if(d.fieldSources[f.id]==='application_edit'&&['us_citizen','us_work_authorization','us_sponsorship','age_over_18','us_driver_license_valid'].includes(f.key)){
        const value=fieldFactValue(f,d.values[f.id]);if(value){if(!candidates.has(f.key))candidates.set(f.key,new Set());candidates.get(f.key).add(value);promotions.push({d,f,value});}
      }
    }
    for(const [key,values] of candidates)if(values.size===1&&!data.answers[key])data.answers[key]={value:[...values][0],label:factDefinitions[key].label,source:'Learned from your previous application answer',confirmedAt:Date.now()};
    for(const {d,f,value} of promotions)if(d.stage!=='submitted'&&data.answers[f.key]?.value===value)d.fieldSources[f.id]='Saved answer';
    data.answerKnowledgeVersion='2026-10-20-v3';
  }
  const baselineFields=()=>[
    {id:'name',label:'Full name',key:'name',required:true,type:'input_text'},
    {id:'email',label:'Email',key:'email',required:true,type:'input_text'},
    {id:'phone',label:'Phone',key:'phone',required:false,type:'input_text'},
    {id:'linkedin',label:'LinkedIn',key:'linkedin',required:false,type:'input_text'},
    {id:'github',label:'GitHub',key:'github',required:false,type:'input_text'},
    {id:'resume',label:'Resume',key:'resume',required:true,type:'input_file'}
  ].map(field=>({...field,label:factDefinitions[field.key]?.label||field.label}));
  function addEligibilityQuestions(fields,job){
    if(!job)return;
    if(job.clearance==='existing'&&!fields.some(f=>f.key==='clearance_status'))fields.push({id:'internal_clearance',label:'Current security-clearance status (private eligibility check)',key:'clearance_status',required:true,internal:true,type:'input_text',options:['None','Secret','Top Secret','Other / verify','Unknown'].map(s=>({value:s,label:s}))});
  }
  function formFields(payload,job){
    const result=[],dynamicFields=[],notes=[],ids=new Set();
    const sets=[{questions:payload.questions||[],kind:'application',context:''},{questions:payload.location_questions||[],kind:'location',context:''}];
    for(const block of payload.compliance||[])sets.push({questions:block.questions||[],kind:'compliance',context:text(block.description||'')});
    if(payload.demographic_questions?.questions)sets.push({questions:payload.demographic_questions.questions,kind:'demographic',context:text(payload.demographic_questions.description||'')});
    for(const section of sets)for(const [index,q] of section.questions.entries()){
      const originalLabel=text(q.label||q.question||q.title||''),description=text(q.description||q.help_text||q.helpText||'');
      let controls=q.fields||[];
      if(!controls.length&&q.answer_options)controls=[{name:'demographic_'+q.id,type:q.type,values:q.answer_options.map(o=>({value:o.id,label:o.label}))}];
      if(!controls.length){if(originalLabel||description)notes.push({label:originalLabel,text:description,kind:section.kind});continue;}
      const visible=controls.filter(f=>f.type!=='input_hidden');dynamicFields.push(...controls.filter(f=>f.type==='input_hidden').map(f=>({id:f.name,kind:section.kind})));
      const alternatives=visible.some(f=>f.type==='input_file')&&visible.some(f=>f.type==='textarea');
      const selected=alternatives?[visible.find(f=>f.type==='input_file')]:visible;
      for(const field of selected){
        const id=field.name||section.kind+'_q'+index;if(ids.has(id))continue;ids.add(id);
        const options=(field.values||[]).map(v=>({value:String(v.value),label:text(v.label)}));
        const combined=[originalLabel,description].filter(Boolean).join('\n');
        let meaning=fieldMeaning(combined,job,options);
        if(!meaning.key)meaning=fieldMeaning(description||originalLabel,job,options);
        if(!meaning.key)meaning=fieldMeaning(originalLabel,job,options);
        if(section.kind==='location'&&/^location$/i.test(field.name))meaning={key:'current_location',inverted:false};
        if(visible.length>1&&!alternatives&&['first_name','last_name','email','phone'].includes(field.name))meaning={key:field.name,inverted:false};
        const content=K.completePrompt(originalLabel,description,meaning,text);
        if(content.incomplete&&meaning.key&&factDefinitions[meaning.key]){content.questionText=factDefinitions[meaning.key].label;content.incomplete=false;content.promptOrigin='Expanded standard field label';}
        const context=[content.context,section.context].filter(Boolean).filter((s,i,a)=>a.indexOf(s)===i).join('\n\n');
        result.push({id,label:content.questionText,...content,context,...meaning,required:!!q.required,type:field.type||'input_text',options,alternatives:controls,questionSection:section.kind,sourceUrl:job.url});
      }
    }
    return {fields:result,dynamicFields,notes};
  }
  async function refreshQuestionSets(){
    for(const [id,d] of Object.entries(data.drafts))if(d.stage!=='submitted'&&!data.archived[id]&&d.questionsNeedRefresh)await prepare(id);
  }
  async function prepare(id,options={}){
    const j=data.jobs[id];if(!j||data.archived[id])return;
    const prior=data.drafts[id];if(prior?.stage==='submitted')return prior;
    if(prior&&!prior.requirementsChanged&&!prior.questionsNeedRefresh&&!options.forceQuestions){addEligibilityQuestions(prior.fields,j);reconcileDraft(id);return prior;}
    let fields=baselineFields(),formStatus='Employer form still to verify',formVerified=false,rawForm=null,extras={dynamicFields:[],notes:[]};
    if(j.kind==='greenhouse'){
      try{
        const source=allSources().find(s=>s.id===j.sourceId);
        const payload=prior?.rawForm&&!prior.requirementsChanged&&!options.forceQuestions?prior.rawForm:await request(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(j.board)}/jobs/${encodeURIComponent(j.externalId)}?questions=true`,source);
        if(!Array.isArray(payload.questions))throw new Error('Published form questions were not supplied.');
        rawForm=Object.fromEntries(['questions','location_questions','compliance','demographic_questions','data_compliance'].filter(k=>payload[k]!==undefined).map(k=>[k,structuredClone(payload[k])]));
        const parsed=formFields(payload,j);fields=parsed.fields;extras={dynamicFields:parsed.dynamicFields,notes:parsed.notes};
        formVerified=true;formStatus='Complete published question text and help text loaded. Employer-site consent and dynamic location validation still need review.';
      }catch{formStatus='The complete employer form could not be retrieved. Core fields are prepared; review the original form before sending.';}
    }
    addEligibilityQuestions(fields,j);
    const draft={jobId:id,version:(prior?.version||0)+1,createdAt:prior?.createdAt||Date.now(),fields,values:{},fieldSources:{},formStatus,formVerified,rawForm,formExtras:extras,questionVersion,questionsNeedRefresh:false,approved:false,stage:'preparing',resumeTrack:j.track,base:prior?.base||data.profile.bases[0],note:prior?.note||'',history:[...(prior?.history||[]),{at:Date.now(),event:prior?'Full employer questions refreshed':'Application package prepared'}]};
    if(prior)for(const field of fields){const old=prior.fields.find(f=>f.id===field.id);if(old&&old.label===field.label&&(!old.description||old.description===field.description)&&JSON.stringify(old.options)===JSON.stringify(field.options)&&prior.fieldSources[field.id]==='application_edit'){draft.values[field.id]=prior.values[field.id];draft.fieldSources[field.id]='application_edit';if(prior.attachments?.[field.id]){draft.attachments||={};draft.attachments[field.id]=prior.attachments[field.id];}}}
    data.drafts[id]=draft;reconcileDraft(id);await save();emit();return draft;
  }
  function autoValue(field,draft){
    const p=data.profile,k=field.key;
    if(k==='resume'){const r=p.resumes[draft.resumeTrack];return resumeURL(r)?r.name:'';}
    let v=k&&knownAnswer(k)!==''?knownAnswer(k):k==='first_name'?p.name.split(' ')[0]:k==='last_name'?p.name.split(' ').slice(1).join(' '):['name','email','phone','linkedin','github','portfolio'].includes(k)?p[k]:'';
    if(field.threshold!==undefined&&v!=='')v=Number(v)>=field.threshold?'Yes':'No';
    if(field.inverted&&booleanAnswer(v))v=booleanAnswer(v)==='Yes'?'No':'Yes';
    if((field.options||[]).length&&v!==''){
      const match=label=>{
        const exact=field.options.filter(o=>semanticText(o.label)===semanticText(label));if(exact.length===1)return exact[0];
        if(k==='travel_percent'&&field.threshold===undefined){const numeric=field.options.filter(o=>/^\d{1,3}\s*%?$/.test(o.label.trim())&&parseFloat(o.label)===Number(label));if(numeric.length===1)return numeric[0];}
        if(k==='us_work_status'&&semanticText(label)==='united states citizen'){const citizenship=field.options.filter(o=>/^(i am a |a )?united states citizen( or national)?$/.test(semanticText(o.label)));if(citizenship.length===1)return citizenship[0];}
        const binary=booleanAnswer(label);if(binary){const options=field.options.filter(o=>{const candidate=booleanAnswer(o.label)||(['us_citizen','us_work_status'].includes(k)?/^(i am a |a )?united states citizen$/.test(semanticText(o.label))?'Yes':/^(i am )?(not a|not|non) united states citizen$/.test(semanticText(o.label))?'No':null:null);return candidate===binary&&!/\b(but|only if|provided|assuming|subject to)\b/.test(semanticText(o.label));});if(options.length===1)return options[0];}
        return null;
      };
      if(Array.isArray(v)){const matches=v.map(match);return matches.every(Boolean)?matches.map(o=>o.value):[];}
      const opt=match(v);return opt?(field.type==='multi_value_multi_select'?[opt.value]:opt.value):'';
    }
    return v??'';
  }
  function filled(field,value){
    if(value===undefined||value===null||String(value).trim()==='')return false;
    if(Array.isArray(value))return value.length>0&&value.every(v=>field.options?.some(o=>String(o.value)===String(v)));
    if(field.options?.length)return field.options.some(o=>String(o.value)===String(value));
    return true;
  }
  function reconcileDraft(id){
    const draft=data.drafts[id],job=data.jobs[id];if(!draft||!job||draft.stage==='submitted')return;
    let changed=false;
    for(const field of draft.fields){
      const old=draft.values[field.id],s=draft.fieldSources[field.id];
      if(s==='application_edit'&&field.key!=='resume')continue;
      const next=autoValue(field,draft);
      if(old!==next){draft.values[field.id]=next;changed=true;}
      draft.fieldSources[field.id]=field.key&&resolveFact(field.key).known?resolveFact(field.key).source:field.key&&next!==''?'Resume/profile':'Unanswered';
    }
    draft.missing=draft.fields.filter(f=>f.required&&(!filled(f,draft.values[f.id])||f.key==='resume'&&!resumeURL(data.profile.resumes[draft.resumeTrack])||f.type==='input_file'&&f.key!=='resume'&&!draft.attachments?.[f.id]||f.internal&&['Unknown','Other / verify'].includes(draft.values[f.id]))).map(f=>f.id);
    if(changed&&draft.approved){draft.approved=false;draft.version++;}
    if(draft.stage!=='submitted')draft.stage=draft.questionsNeedRefresh?'preparing':draft.missing.length?draft.missing.every(id=>draft.fields.find(f=>f.id===id)?.incomplete)?'needs_employer_review':'needs_input':draft.approved?'approved_for_handoff':'ready_for_review';
  }
  async function prepareBest(){
    const candidates=Object.values(data.jobs).filter(j=>j.fit>=data.settings.minimumFit&&!j.marketExcluded&&!data.archived[j.id]&&!isBlocked(j)).sort((a,b)=>b.overall-a.overall);
    const half=Math.ceil(data.settings.maximumPrepare/2);
    const selected=[...candidates.filter(j=>j.track==='technician').slice(0,half),...candidates.filter(j=>j.track==='software').slice(0,half)];
    for(const j of candidates){if(selected.length>=data.settings.maximumPrepare)break;if(!selected.some(s=>s.id===j.id))selected.push(j);}
    for(const j of selected)await prepare(j.id);
  }
  function isBlocked(job){
    const clearance=knownAnswer('clearance_status');
    return job.clearance==='existing'&&(clearance==='None'||job.clearanceLevel==='Top Secret'&&clearance==='Secret')||!!job.citizenshipEvidence&&knownAnswer('us_citizen')==='No'&&/must|required|only/i.test(job.citizenshipEvidence);
  }
  function missingGroups(){
    const groups=new Map();
    for(const draft of Object.values(data.drafts)){
      if(data.archived[draft.jobId]||draft.stage==='submitted'||draft.questionsNeedRefresh)continue;
      for(const f of draft.fields.filter(f=>draft.missing?.includes(f.id)&&!f.incomplete)){
        const reusable=!!f.key&&factDefinitions[f.key]?.scope!=='application';
        const key=reusable?f.key:draft.jobId+'::'+f.id;
        if(!groups.has(key)){const definition=reusable&&factDefinitions[f.key];groups.set(key,{key,reusable,label:definition?.label||f.label,type:definition?.type||f.type,options:definition?.options||f.options||[],explanation:f.explanation||'',sourceQuestions:[],jobs:[],fields:[]});}
        const g=groups.get(key);g.sourceQuestions.push({jobId:draft.jobId,question:f.questionText||f.label,context:f.context||'',originalLabel:f.originalLabel||f.label,url:data.jobs[draft.jobId]?.url});g.jobs.push(draft.jobId);g.fields.push({jobId:draft.jobId,fieldId:f.id});
      }
    }
    return [...groups.values()].sort((a,b)=>b.jobs.length-a.jobs.length);
  }
  function answer(key,value,scope='global'){
    if(scope==='global'){data.answers[key]={value,label:key,source:'User answer',confirmedAt:Date.now()};for(const id of Object.keys(data.drafts))reconcileDraft(id);}
    else {const [jobId,fieldId]=key.split('::');const d=data.drafts[jobId];if(!d||d.stage==='submitted')return false;if(d){d.values[fieldId]=value;d.fieldSources[fieldId]='application_edit';d.approved=false;d.version++;reconcileDraft(jobId);}}
    save();emit();
  }
  function updateDraft(id,values,note,base){
    const d=data.drafts[id];if(!d||d.stage==='submitted')return;
    for(const [field,value] of Object.entries(values))if(d.values[field]!==value){d.values[field]=value;d.fieldSources[field]='application_edit';}
    d.note=note;d.base=base;d.approved=false;d.version++;d.requirementsChanged=false;reconcileDraft(id);save();emit();
  }
  function approve(id){
    const d=data.drafts[id],j=data.jobs[id];if(!d||!j||data.archived[id]||d.stage==='submitted')return false;
    reconcileDraft(id);if(d.missing.length||d.questionsNeedRefresh||isBlocked(j)||d.requirementsChanged)return false;
    d.approved=true;d.approvedVersion=d.version;d.approvedAt=Date.now();d.stage='approved_for_handoff';d.snapshot={version:d.version,job:structuredClone(j),values:structuredClone(d.values),note:d.note,base:d.base,resume:data.profile.resumes[d.resumeTrack],attachments:structuredClone(d.attachments||{})};d.history.push({at:Date.now(),event:'Approved package version '+d.version+' for manual handoff'});save();emit();return true;
  }
  function archive(id,reason){data.archived[id]={reason,at:Date.now()};const d=data.drafts[id];if(d){d.approved=false;if(d.stage!=='submitted')reconcileDraft(id);}save();emit();}
  function restore(id){delete data.archived[id];const d=data.drafts[id];if(d){d.approved=false;reconcileDraft(id);}save();emit();}
  function markSubmitted(id){const d=data.drafts[id];if(!d?.approved||d.approvedVersion!==d.version||data.archived[id])return false;d.stage='submitted';d.submittedAt=Date.now();d.submissionEvidence='User confirmed completion on employer site';d.history.push({at:Date.now(),event:'User recorded submission'});save();emit();return true;}
  function importJob(raw){const job=normalize(raw,{id:'manual',name:raw.source||'Manual import',kind:'manual'});if(!job)throw new Error('A valid HTTP(S) listing URL and title are required.');const previous=Object.values(data.jobs).find(j=>canonical(j.url)===canonical(job.url));if(previous)return previous;data.jobs[job.id]=job;save();emit();return job;}
  function setSource(id,enabled){data.sourceState[id]||={};data.sourceState[id].enabled=enabled;save();emit();}
  function addSource(kind,board,name){if(!['greenhouse','lever','ashby'].includes(kind)||!/^[a-zA-Z0-9_-]{1,80}$/.test(board))throw new Error('Use a valid board identifier, not a full URL.');const id=kind+'-'+board;if(allSources().some(s=>s.id===id||s.kind===kind&&s.board===board))throw new Error('That employer board is already listed.');data.customSources.push({id,kind,board,name:name.trim()||board,group:'Direct employers',enabled:true,interval:HOUR,home:kind==='greenhouse'?`https://boards.greenhouse.io/${board}`:kind==='lever'?`https://jobs.lever.co/${board}`:`https://jobs.ashbyhq.com/${board}`,note:'User-added public employer board.'});save();emit();}
  function matchesQuery(job,query){
    const hay=(job.title+' '+job.company+' '+job.location+' '+job.description).toLowerCase();
    const orGroups=query.match(/(?:[^"\s]+|"[^"]*")+/g)||[];
    const groups=[[]];for(const token of orGroups){if(token.toUpperCase()==='OR')groups.push([]);else if(token.toUpperCase()!=='AND')groups.at(-1).push(token);}
    return groups.some(group=>group.every(token=>{const neg=token.startsWith('-'),term=(neg?token.slice(1):token).replace(/^"|"$/g,'').toLowerCase();return !term?true:neg?!hay.includes(term):hay.includes(term);}));
  }
  window.JobEngine={init,get data(){return data;},get busy(){return busy;},subscribe(fn){listeners.push(fn);},sources:allSources,sourceEnabled,pull,prepare,prepareBest,save,emit,missingGroups,answer,updateDraft,approve,archive,restore,markSubmitted,importJob,setSource,addSource,matchesQuery,isBlocked,text,safeURL,normalize,parsePay,resumeURL,setProfile,importProfile,resolveFact,refreshQuestionSets,formFields,questionCatalog:()=>K.catalog,factDefinition:key=>factDefinitions[key]||null,fieldMeaning};
})();
