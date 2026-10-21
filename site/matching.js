/* Evidence-based ranking shared by the browser and regression tests. */
(() => {
  const norm=s=>String(s||'').toLowerCase().replace(/[’‘]/g,"'");
  const categories=[['all','Best matches'],['travel_100','100% travel'],['travel_extensive','Nationwide / extensive travel'],['field','Field technician'],['fiber','Fiber & telecom'],['network','Network & systems'],['data_center','Data centers'],['electronics','Electronics'],['remote','Remote work'],['software','Software'],['business','Business contracts']];
  const familyRules={field:/field (?:service |support )?(?:tech|engineer)|rollout technician|data cable technician|installation|commissioning|(?:engineering|electronics|deployment|communications) technician/i,fiber:/fiber|fibre|splic|telecom|cabling|low.voltage/i,network:/network (?:engineer|admin|technician|tech\b|installation|deployment|support|operations)|systems (?:admin|engineer)|noc |infrastructure (?:engineer|technician)/i,data_center:/data.?center|datacenter/i,electronics:/electronics|electronic|instrumentation|communications technician/i,software:/software|developer|full.?stack|front.?end|back.?end|web engineer/i};
  const skillRules=[['Fiber & splicing',/fiber|fibre|splic/],['OTDR',/\botdr\b/],['Cabling',/cabling|cat[56]|copper termination/],['Telecom',/telecom|communications|cutover/],['Linux',/\blinux\b/],['Python',/\bpython\b/],['JavaScript',/\bjavascript\b/],['Vue',/\bvue(?:\.js)?\b/],['Node.js',/\bnode(?:\.js)?\b/],['APIs',/\bapis?\b/],['SQL',/\bsql\b|postgres|mysql/],['Docker',/\bdocker\b/],['AWS',/\baws\b|amazon web services/]];
  const specialist=[['C++',/\bc\+\+/],['Rust',/\brust\b/],['React',/\breact(?:js|\.js)?\b/],['Java',/\bjava\b/],['C#/.NET',/c#|\.net\b/],['Go',/\bgolang\b|\bgo programming/],['Kubernetes',/\bkubernetes\b|\bk8s\b/],['Machine learning',/machine learning|\bml\b|deep learning|pytorch|tensorflow/],['Salesforce',/\bsalesforce\b/],['SAP',/\bsap\b/],['iOS/Swift',/\bswift\b|\bios\b/]];
  const sentences=s=>String(s||'').split(/\n|(?<=[.!?;])\s+/).map(x=>x.trim()).filter(Boolean);
  function classify(job,source={}) {
    const title=norm(job.title),body=norm(job.description),all=title+'\n'+body,lines=sentences(job.title+'\n'+job.description);
    const families=Object.entries(familyRules).filter(([,re])=>re.test(title)).map(([id])=>id);
    const travelLines=lines.filter(s=>/travel/i.test(s));
    const travelLine=travelLines.find(s=>/\b100\s*(?:%|percent)/i.test(s))||'';
    const range=travelLines.map(s=>s.match(/(\d{1,3})\s*%?\s*(?:[-–—]|to)\s*(\d{1,3})\s*(?:%|percent)/i)).find(Boolean);
    const capped=travelLines.find(s=>/up to|as (?:much|high) as|maximum/i.test(s)&&/\d\s*(?:%|percent)/i.test(s));
    const travel100=!!travelLine&&!range&&!capped&&!/less than|under\s+100|not.{0,20}100/i.test(travelLine);
    const percentages=travelLines.flatMap(s=>[...s.matchAll(/(\d{1,3})\s*(?:%|percent)/gi)].map(m=>Number(m[1]))).filter(n=>n<=100);
    const travelPercent=travel100?100:percentages.length?Math.max(...percentages):null;
    const travelMinimumPercent=travel100?100:range?Number(range[1]):capped?0:travelPercent;
    const extensiveLine=travelLines.find(s=>!/no travel|travel (?:is )?not required|occasional|within.{0,20}(?:radius|hours)|local (?:travel|area)/i.test(s)&&(/(?:extensive|frequent|heavy|nationwide|full.time|continuous)\s+(?:domestic\s+|overnight\s+)?travel|travel.{0,55}(?:extensively|frequently|nationwide)|travel.{0,35}(?:[6-9]|1[0-2])\s*(?:to\s*\d+\s*|[-–]\s*\d+\s*)?weeks|(?:[6-9]|1[0-2])\s*(?:[-–]\s*\d+\s*)?weeks.{0,45}travel/i.test(s)||(range&&Number(range[1])>=75&&s.includes(range[0]))||(percentages.some(n=>n>=75)&&/\d\s*(?:%|percent)/i.test(s))))||'';
    const travelExtensive=!!extensiveLine;
    const travelTerms=travel100?'100% travel':range?range[1]+'–'+range[2]+'% travel':capped&&travelPercent!==null?'Up to '+travelPercent+'% travel':travelPercent!==null?travelPercent+'% travel':travelExtensive?'Nationwide / extensive travel · % not stated':'Travel percentage not stated';
    const softwareRole=/software|developer|full.?stack|front.?end|back.?end|programmer|devops|site reliability|\bsre\b|machine learning|\bml\b/i.test(title);
    const hybrid=/hybrid|on.?site|in.office/i.test(title+' '+job.location)||lines.some(s=>/(?:this (?:position|role)|work (?:schedule|arrangement|model)).{0,35}(?:hybrid|on.?site|in.office)|(?:hybrid|on.?site) (?:position|role|job)|\b(?:not|non)[ -]?remote\b|remote (?:work )?(?:is )?not (?:available|offered|permitted)/i.test(s))||lines.some(s=>/\b(?:in (?:the )?office|on.?site)\b/i.test(s)&&/(?:required|must|days? (?:a|per) week)/i.test(s));
    const remoteExplicit=!hybrid&&(job.remote===true||/\bremote\b/i.test(title+' '+job.location)||lines.some(s=>/\b(?:fully remote|100% remote|this (?:position|role) is remote|work from home)\b/i.test(s)));
    const arrangements=[],arrangementEvidence=[];
    for(const [id,re] of [['w2',/\bw[ -]?2\b/i],['c2c',/\bc2c\b|corp[ -]to[ -]corp|corporation[ -]to[ -]corporation/i],['1099',/\b1099\b|independent contractor/i]]) {
      const evidence=lines.find(s=>re.test(s)&&!new RegExp('(?:no|not|without|cannot|unable|do not).{0,30}(?:'+re.source+')|(?:'+re.source+').{0,20}(?:not (?:accepted|allowed|available)|ineligible)','i').test(s));
      if(evidence){arrangements.push(id);arrangementEvidence.push(evidence);}
    }
    const contract=/contract|temporary|fixed.term/i.test(job.employment||'')||/\bcontract(?:or)?\b/i.test(title)||arrangements.some(a=>a==='c2c'||a==='1099')||lines.some(s=>/\b(?:this (?:role|position|opportunity|assignment) is (?:a )?|employment type[: ]+|\d+[ -]month[ -])contract\b/i.test(s));
    const business=job.projectOpportunity===true||arrangements.includes('c2c')||arrangements.includes('1099')||/subcontract(?:or|ing)|request for (?:proposal|quote)|\bRFP\b|\bRFQ\b|statement of work/i.test(job.title+' '+(job.employment||''));
    const govLine=lines.find(s=>/\bfederal (?:agency|government|contract|customer)|\bgovernment (?:agency|contract|customer|project)|\bFAA\b|\bNASA\b|\bDoD\b|Department of (?:Defense|Energy|State|Transportation)/i.test(s))||'';
    const directGov=source.kind==='usajobs'||/\.gov(?:\/|$)/i.test(job.url||'')||/^(?:U\.?S\.? )?Department of |Federal Aviation Administration/i.test(job.company||'');
    const startupLine=lines.find(s=>!/startup (?:customers|clients)/i.test(s)&&/we are (?:a |an )?.{0,45}start[ -]?up|(?:early.stage|venture.backed|series [a-e]) (?:company|startup)|(?:a|our) (?:fast.growing )?startup/i.test(s))||'';
    const sector=directGov?'government':govLine?'government_contract':startupLine?'startup':source.sector||(/\b(?:inc\.?|corporation|corp\.?|llc|ltd\.?)\b/i.test(job.company||'')?'corporate':'unknown');
    const requiredClearance=lines.find(s=>/clearance|\bTS\/SCI\b/i.test(s)&&/required|must|active|current|possess/i.test(s)&&!/not required|no (?:security )?clearance|required to obtain|ability to obtain|able to obtain/i.test(s))||'';
    const obtainClearance=lines.find(s=>/(?:ability|able|required|eligible).{0,15}obtain.{0,35}(?:clearance|secret)|(?:sponsor|sponsorship).{0,60}security clearance/i.test(s))||'';
    const clearance=requiredClearance?'existing':obtainClearance?'sponsor':/no (?:security )?clearance|clearance.{0,12}not required|clearance (?:requirement)?[:\s]+none/i.test(all)?'none':job.clearance||'unknown';
    return {customerFAA:/\bFAA\b|Federal Aviation Administration/i.test(job.title+' '+job.description),softwareRole,remoteExplicit,hybrid,travelPercent,travelMinimumPercent,travelExtensive,travelTerms,families,categories:[...families,...(remoteExplicit?['remote']:[]),...(travel100?['travel_100']:[]),...(travelExtensive?['travel_extensive']:[]),...(business?['business']:[])],travel100,travelEvidence:travelLine||extensiveLine,contract,business,arrangements,arrangementEvidence,sector,sectorEvidence:govLine||startupLine||(directGov?'Government employer':source.sector?'Employer source classification':''),clearance,clearanceEvidence:requiredClearance||obtainClearance||job.clearanceEvidence};
  }
  function rank(job,profile,answers={},business={}) {
    const body=norm(job.description),title=norm(job.title),resume=norm([...(profile.skills||[]),...Object.values(profile.resumeEvidence||{}).flat(),...(profile.experience||[]).map(r=>r.role+' '+(r.evidence_statements||[]).join(' ')),business.services||''].join('\n'));
    const evidence=skillRules.filter(([,re])=>re.test(body)&&re.test(resume)).map(([name])=>name);
    const gaps=[],reasons=[];let score=15;
    const families=job.families||[];
    const supported=families.filter(f=>familyRules[f].test(resume));
    if(supported.length){score+=35;reasons.push('Resume supports '+supported.map(f=>categories.find(c=>c[0]===f)?.[1]||f).join(', '));}
    else gaps.push('No matching role family found in your profile');
    score+=Math.min(30,evidence.length*5);
    if(evidence.length)reasons.push('Relevant evidence: '+evidence.slice(0,5).join(', '));
    if(families.some(f=>['field','fiber','network','data_center','electronics'].includes(f))&&supported.length)score+=12;
    if(job.travel100&&Number(answers.travel_percent?.value)>=100){score+=8;reasons.push('100% travel fits your saved availability');}
    if(job.business&&business.services){score+=5;reasons.push('Business contract; compare scope with your services');}
    const senior=/\bsenior\b|\bsr\.?\b|\bstaff\b|principal|director|vice president|\bvp\b|head of|lead (?:software|engineer|developer)|engineering manager/.test(title);
    if(senior){score-=35;gaps.push('Senior or leadership role; excluded from default recommendations');}
    const requirementLines=sentences(job.description).filter(s=>/required|must|minimum|at least|\d+\+? years|proficien|expert|strong (?:knowledge|experience)|you (?:have|bring)|qualifications/i.test(s)&&!/preferred|nice.to.have|bonus|not required/i.test(s));
    const required=norm(requirementLines.join('\n'));
    for(const [name,re] of specialist)if((re.test(title)||re.test(required))&&!re.test(resume)){gaps.push(name+' requirement has no supporting resume evidence');score-=22;}
    if(/(?:classified|security cleared)/.test(title)&&job.clearance==='unknown'){gaps.push('Classified role; clearance eligibility is not established');score-=30;}
    if(/systems engineer/.test(title)&&/air defense|strategic defense|flight|avionics|aerospace|spacecraft|missile|model.based systems|sysml|cameo/.test(title+' '+required)&&!/aerospace|avionics|sysml|cameo|missile/.test(resume)){gaps.push('Aerospace / defense systems specialization is not supported');score-=30;}
    if(/bachelor|master.s degree/.test(required)&&!/equivalent (?:work |professional |practical )?experience|degree or|or equivalent|or related experience/.test(required)&&!profile.education?.completed_degree){gaps.push('Required completed degree is not confirmed in your profile');score-=25;}
    if(/ph\.?d|doctorate/.test(required)&&!profile.education?.completed_degree){gaps.push('Doctorate requirement is not supported');score-=40;}
    const years=[...required.matchAll(/(\d{1,2})\+?\s*(?:-|to)?\s*(?:\d{1,2})?\s*years?\s+(?:of\s+)?(?:professional\s+)?(?:software|development|engineering|relevant|related|industry)?\s*(?:experience)?/g)].map(m=>Number(m[1]));
    const softwareYears=globalThis.ApplicantKnowledge?.infer('years_experience:software',{profile})?.value;
    if(families.includes('software')&&years.length&&softwareYears!==undefined&&Math.max(...years)>Number(softwareYears)){gaps.push('Requires '+Math.max(...years)+' years; dated software roles support '+softwareYears);score-=25;}
    const desired=answers.target_roles?.value;
    if(Array.isArray(desired)&&desired.length){const ids=desired.map(v=>({'Field technician':'field','Fiber & telecom':'fiber','Network & systems':'network','Data centers':'data_center','Electronics':'electronics','Remote software':'software','Business contracts':'business'})[v]);if(!(job.categories||[]).some(c=>ids.includes(c))){gaps.push('Outside your selected role preferences');score-=25;}}
    const accepted=answers.work_arrangements?.value;
    if(Array.isArray(accepted)&&accepted.length&&job.arrangements?.length&&!job.arrangements.some(a=>accepted.includes(({w2:'W-2',c2c:'C2C','1099':'1099'})[a]))){gaps.push('Work arrangement is outside your saved preferences');score-=25;}
    const minimum=Number(answers.minimum_hourly?.value);
    if(minimum>0&&job.pay?.currency==='USD'&&job.pay.period==='hourly'&&job.pay.max&&job.pay.max<minimum){gaps.push('Published rate is below your minimum hourly rate');score-=30;}
    const clearance=answers.clearance_status?.value;
    const clearanceUnknown=job.clearance==='existing'&&(!clearance||['Unknown','Other / verify'].includes(clearance));
    const blocked=job.clearance==='existing'&&(clearance==='None'||job.clearanceLevel==='Top Secret'&&clearance==='Secret')||!!job.citizenshipEvidence&&answers.us_citizen?.value==='No'&&/must|required|only/i.test(job.citizenshipEvidence);
    if(blocked){score=0;gaps.push('Known eligibility blocker');}
    else if(clearanceUnknown){score-=25;gaps.push('Active clearance required; your clearance is unconfirmed');}
    if(job.marketExcluded){score=0;gaps.push('Outside your current work-location focus');}
    score=Math.max(0,Math.min(98,score));
    const recommended=score>=60&&!senior&&!blocked&&!clearanceUnknown&&!job.marketExcluded&&supported.length>0&&!gaps.length;
    return {fit:score,overall:score,matchEvidence:evidence,matchReasons:reasons,matchGaps:gaps,seniorityReview:senior,recommended,matchTier:recommended?(score>=80?'Strong match':'Relevant match'):blocked?'Not eligible':'Outside recommendations'};
  }
  const defaultRules={minimumTravel:100,allowExtensiveTravel:true,excludeFAA:false,remoteSoftware:true,sector:'all',arrangement:'all',clearance:'exclude_active',minimumHourly:0,minimumAnnual:0,requirePay:false,excludeKeywords:'',disciplines:['field','fiber','network','data_center','electronics']};
  function intake(job,rules={},business=false){
    const r={...defaultRules,...rules},reasons=[];
    if(r.excludeFAA&&job.customerFAA)reasons.push('FAA-related roles are excluded');
    if(job.softwareRole&&!job.remoteExplicit)reasons.push('Office, hybrid, or unconfirmed-remote software is excluded');
    if(business){if(!job.business)reasons.push('No explicit C2C, 1099, subcontract, or project-bid opportunity');}
    else if(job.business&&!job.arrangements?.includes('w2'))reasons.push('Business-only opportunity goes to the Contracts system');
    if(job.softwareRole){if(!r.remoteSoftware)reasons.push('Software intake is disabled');}
    else {
      if(!(job.families||[]).some(f=>r.disciplines.includes(f)))reasons.push('Outside your selected technical disciplines');
      if(Number(r.minimumTravel)>0&&!(r.allowExtensiveTravel&&job.travelExtensive)&&((job.travelMinimumPercent??job.travelPercent)===null||(job.travelMinimumPercent??job.travelPercent)===undefined||(job.travelMinimumPercent??job.travelPercent)<Number(r.minimumTravel)))reasons.push('Does not explicitly advertise '+r.minimumTravel+'% travel');
    }
    if(job.seniorityReview)reasons.push('Senior / leadership roles are excluded');
    if(r.clearance==='exclude_active'&&job.clearance==='existing')reasons.push('Active-clearance roles are excluded');
    if(r.clearance==='none'&&job.clearance!=='none')reasons.push('No-clearance requirement is not confirmed');
    if(r.clearance==='required'&&job.clearance!=='existing')reasons.push('Not an active-clearance role');
    if(r.sector==='government'&&!['government','government_contract'].includes(job.sector)||r.sector==='private'&&['government','government_contract'].includes(job.sector)||!['all','private','government'].includes(r.sector)&&job.sector!==r.sector)reasons.push('Sector does not match your intake rule');
    if(r.arrangement==='project'&&!job.projectOpportunity||r.arrangement==='contract'&&!job.contract||!['all','contract','project'].includes(r.arrangement)&&!job.arrangements?.includes(r.arrangement))reasons.push('Work arrangement does not match your intake rule');
    if(r.requirePay&&!job.pay?.min)reasons.push('Published pay is required');
    if(job.pay?.currency==='USD'&&((job.pay.period==='hourly'&&Number(r.minimumHourly)>0&&(job.pay.max||job.pay.min)<Number(r.minimumHourly))||(/year|annual/.test(job.pay.period)&&Number(r.minimumAnnual)>0&&(job.pay.max||job.pay.min)<Number(r.minimumAnnual))))reasons.push('Published pay is below your minimum');
    const excluded=String(r.excludeKeywords||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);if(excluded.some(s=>(job.title+' '+job.description).toLowerCase().includes(s)))reasons.push('Matches an excluded keyword');
    if(job.profileRecommended===false||job.profileRecommended===undefined&&job.recommended===false)reasons.push(...(job.matchGaps?.length?job.matchGaps:['Insufficient relevant resume evidence']));
    return {accepted:!reasons.length,reasons};
  }
  const tagDefinitions=[...categories.filter(([id])=>!['all','business'].includes(id)),['government','Government work'],['government_contract','Government contractor'],['corporate','Corporate'],['startup','Startup'],['w2','W-2'],['c2c','C2C'],['1099','1099'],['contract','Contract assignment'],['no_clearance','No clearance'],['sponsor_clearance','Clearance sponsorship'],['screening','Public Trust / screening'],['published_pay','Published pay'],['per_diem','Per diem'],['hotel','Hotel / lodging'],['rotation','Rotation / home time'],['pto','Paid time off'],['fiber_skill','Fiber / splicing'],['otdr','OTDR'],['cabling','Cabling'],['linux','Linux'],['python','Python'],['javascript','JavaScript'],['node','Node.js']];
  function tags(job){
    const result=[...(job.categories||[]),...(job.arrangements||[]),job.sector];
    if(['government','government_contract'].includes(job.sector))result.push('government');
    if(job.contract)result.push('contract');
    if(job.clearance==='none')result.push('no_clearance');if(job.clearance==='sponsor')result.push('sponsor_clearance');if(job.clearance==='screening')result.push('screening');
    if(job.pay?.min)result.push('published_pay');
    const positive=(value,re)=>value&&re.test(value)&&!/(?:no|not|without|unpaid|unavailable).{0,25}(?:per diem|hotel|lodging|paid time off|rotation)|(?:per diem|hotel|lodging|paid time off|rotation).{0,20}(?:not (?:paid|provided|available|covered)|unavailable)/i.test(value);
    if(positive(job.perDiem,/per diem/i))result.push('per_diem');if(positive(job.perDiem,/hotel|lodging/i))result.push('hotel');if(job.rotation)result.push('rotation');if(positive(job.pto,/paid|PTO|vacation/i))result.push('pto');
    for(const [id,name] of [['fiber_skill','Fiber & splicing'],['otdr','OTDR'],['cabling','Cabling'],['linux','Linux'],['python','Python'],['javascript','JavaScript'],['node','Node.js']])if(job.matchEvidence?.includes(name))result.push(id);
    return [...new Set(result)];
  }
  globalThis.JobbiesMatching={tagDefinitions,tags,categories,classify,rank,intake,defaultRules};
})();
