/* Public listing aggregation. No candidate data, credentials, or application writes. */
import {readFile,writeFile} from 'node:fs/promises';
import {jobFeedSources} from './job-feed-sources.mjs';
import {listingSources,publicListings} from './public-listing-adapters.mjs';
import '../site/matching.js';
const M=globalThis.JobbiesMatching;
const previous=JSON.parse(await readFile(new URL('../site/travel-feed.json',import.meta.url),'utf8').catch(()=> '{}'));
for(const job of previous.jobs||[])if(!job.provider){const source=[...jobFeedSources,...listingSources].find(s=>s.company===job.company);if(source)job.provider=source.id;}
const clean=value=>String(value||'').replace(/<\/(?:p|div|li|h\d|ul|section)>|<br\s*\/?>/gi,'\n').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/[ \t]+/g,' ').trim();
const technical=title=>/fiber|fibre|splic|telecom|cabling|low.voltage|technician|field service|commissioning|infrastructure|network|electronics|installation|rollout/i.test(title)&&!/(?:director|vice president|sales|recruiter|account executive)/i.test(title);
const us=location=>/\bUS\b|\bUSA\b|United States|^US[- ,]|\bRemote\b|\b[A-Z]{2}\b/.test(location||'')&&!/India|Malaysia|China|Germany|France|United Kingdom|Australia|Japan|Singapore|Brazil/i.test(location||'');
async function read(url,options={}){const r=await fetch(url,{...options,headers:{'User-Agent':'Jobbies public employer discovery',...options.headers},signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('Employer feed returned '+r.status);return r.json();}
async function concurrent(list,count,fn){let index=0;const out=[];await Promise.all(Array.from({length:Math.min(count,list.length)},async()=>{while(index<list.length){const value=await fn(list[index++]);if(value)out.push(value);}}));return out;}
async function listings(source){
 if(['dice','phenom','remoteok','himalayas','arbeitnow','rss','freelancer'].includes(source.kind))return publicListings(source);
 if(source.kind==='lever'){
  const raw=await read('https://api.lever.co/v0/postings/'+source.board+'?mode=json');if(!Array.isArray(raw))throw Error('Invalid Lever response');
  return raw.filter(j=>technical(j.text)).map(j=>({externalId:j.id,title:j.text,company:source.company,location:j.categories?.location||'United States',description:clean(j.descriptionPlain||j.description)+'\n'+(j.lists||[]).map(l=>l.text+'\n'+clean(l.content)).join('\n'),url:j.hostedUrl||j.applyUrl,employment:j.categories?.commitment||'',published:new Date(j.createdAt).toISOString()}));
 }
 if(source.kind==='smartrecruiters'){
  const url='https://api.smartrecruiters.com/v1/companies/'+source.board+'/postings';const raw=await read(url+'?limit=100'+(source.query?'&q='+encodeURIComponent(source.query):''));if(!Array.isArray(raw.content))throw Error('Invalid SmartRecruiters response');
  return concurrent(raw.content.filter(j=>technical(j.name)&&(!j.location?.country||j.location.country.toLowerCase()==='us')).slice(0,60),3,async item=>{
   const j=await read(url+'/'+item.id);if(!j.id||!j.jobAd?.sections)return null;return {externalId:j.id,title:j.name,company:source.company,location:[j.location?.city,j.location?.region,j.location?.country?.toUpperCase()].filter(Boolean).join(', '),description:Object.values(j.jobAd.sections).map(s=>clean(s.text)).join('\n'),url:j.applyUrl||'https://jobs.smartrecruiters.com/'+source.board+'/'+j.id,employment:j.typeOfEmployment?.label||'',published:j.releasedDate||''};
  });
 }
 const origin='https://'+source.host+'.myworkdayjobs.com',endpoint=origin+'/wday/cxs/'+source.tenant+'/'+source.board;
 const search=body=>read(endpoint+'/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 const first=await search({appliedFacets:{},limit:20,offset:0,searchText:source.queries[0]});if(!Array.isArray(first.jobPostings))throw Error('Invalid Workday response');
 const country=first.facets?.find(f=>f.values?.some(v=>/United States/i.test(v.descriptor)));const usCountry=country?.values.find(v=>/United States/i.test(v.descriptor));const appliedFacets=usCountry?{[country.facetParameter]:[usCountry.id]}:{};
 const found=new Map();
 for(const query of source.queries){for(let offset=0;offset<40;offset+=20){const result=await search({appliedFacets,limit:20,offset,searchText:query});for(const j of result.jobPostings||[])if(technical(j.title)&&(usCountry||us(j.locationsText)||/^\d+ Locations?$/i.test(j.locationsText||'')))found.set(j.externalPath,j);if(offset+20>=result.total)break;}}
 return concurrent([...found.values()].slice(0,45),3,async item=>{
  if(!item.externalPath?.startsWith('/job/'))return null;const {jobPostingInfo:j}=await read(endpoint+item.externalPath);if(!j?.canApply)return null;
  return {externalId:j.jobReqId,title:j.title,company:source.company,location:j.location||item.locationsText,description:clean(j.jobDescription),url:j.externalUrl||origin+'/'+source.board+item.externalPath,employment:j.timeType||'',published:j.startDate||''};
 });
}
const requested=new Set(process.argv.slice(2));const reports=requested.size?{...(previous.sources||{})}:{},jobs=requested.size?(previous.jobs||[]).filter(j=>!requested.has(j.provider)):[];
const allSources=[...jobFeedSources,...listingSources];
await concurrent(allSources.filter(s=>!requested.size||requested.has(s.id)),3,async source=>{
 try{const all=await listings(source),selected=all.filter(j=>{const facts=M.classify(j);return facts.families.length;});jobs.push(...selected.map(j=>({...j,provider:source.id})));reports[source.id]={company:source.company,home:source.home,state:'ok',read:all.length,jobs:selected.length,generatedAt:new Date().toISOString()};console.log(source.company+': '+selected.length+' technical listings ('+all.length+' technical roles read)');}
 catch(error){const old=previous.jobs?.filter(j=>j.provider===source.id||j.company===source.company)||[];jobs.push(...old.map(j=>({...j,provider:source.id})));reports[source.id]={company:source.company,home:source.home,state:'error',error:String(error.message).slice(0,200),jobs:old.length,generatedAt:previous.sources?.[source.id]?.generatedAt||previous.generatedAt||null};console.log(source.company+': refresh failed; retained '+old.length+' prior listings');}
});
if(!Object.values(reports).some(r=>r.state==='ok'))throw Error('All employer feeds failed. The existing snapshot was left unchanged.');
const unique=[...new Map(jobs.filter(j=>{try{const u=new URL(j.url);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}}).map(j=>[j.provider+'|'+j.url,j])).values()];const feed={generatedAt:new Date().toISOString(),source:'Public employer boards, job boards, staffing and project marketplaces',query:'Technical employee and business opportunities; filtered in your workspace',sources:reports,jobs:unique};
await writeFile(new URL('../site/travel-feed.json',import.meta.url),JSON.stringify(feed,null,2)+'\n');
await writeFile(new URL('../site/job-sources.json',import.meta.url),JSON.stringify({version:'2026-10-21-multi-source-v2',sources:allSources.map(s=>({id:s.id,name:s.company,...(!listingSources.includes(s)?{company:s.company}:{}),group:s.group||'Direct employers',kind:'snapshot',url:'travel-feed.json',home:s.home,interval:6*3600000,enabled:true,note:s.focus+' · Public employer listings refreshed every six hours.'}))},null,2)+'\n');
console.log('Refreshed '+unique.length+' technical listings across '+Object.values(reports).filter(s=>s.state==='ok').length+' working employer, staffing, board and project feeds.');
