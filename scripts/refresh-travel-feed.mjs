/* Public employer listings only. No candidate data, credentials, or application writes. */
import {writeFile} from 'node:fs/promises';
const origin='https://parsons.wd5.myworkdayjobs.com',endpoint=origin+'/wday/cxs/parsons/Search';
const read=async(path,options={})=>{const response=await fetch(endpoint+path,{...options,headers:{'Content-Type':'application/json','User-Agent':'Jobbies public job discovery',...options.headers},signal:AbortSignal.timeout(25000)});if(!response.ok)throw Error('Parsons feed returned '+response.status);return response.json();};
const listed=[];
for(let offset=0;offset<100;offset+=20){
 const result=await read('/jobs',{method:'POST',body:JSON.stringify({appliedFacets:{},limit:20,offset,searchText:'100% travel'})});
 if(!Array.isArray(result.jobPostings))throw Error('Unexpected employer search response');
 listed.push(...result.jobPostings);if(offset+20>=result.total||!result.jobPostings.length)break;
}
const candidates=listed.filter(j=>/electronics?|technician|telecom|fiber|network|field service/i.test(j.title)),jobs=[];
for(const item of candidates.slice(0,40)){
 if(!item.externalPath.startsWith('/job/'))continue;
 const {jobPostingInfo:j}=await read(item.externalPath);
 if(!j?.posted||!j.canApply)continue;
 jobs.push({externalId:j.jobReqId,title:j.title,company:'Parsons',location:j.location,description:j.jobDescription,url:j.externalUrl,employment:j.timeType,published:j.startDate});
}
const feed={generatedAt:new Date().toISOString(),source:origin+'/Search',query:'100% travel — technical roles',jobs};
await writeFile(new URL('../site/travel-feed.json',import.meta.url),JSON.stringify(feed,null,2)+'\n');
console.log('Refreshed '+jobs.length+' technical travel listings from the public Parsons employer board.');
