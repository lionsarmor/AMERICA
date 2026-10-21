/* Employer and job exclusions shared by discovery and the private browser worker. */
(() => {
 'use strict';
 const companyKey=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').replace(/\b(?:the|incorporated|inc|corporation|corp|llc|ltd|limited|plc)\b/g,' ').replace(/\s+/g,' ').trim();
 const defaults={};
 function merge(older={},newer={}){const out={...older};for(const [key,value] of Object.entries(newer||{}))if(value&&typeof value==='object'&&(!out[key]||Number(value.updatedAt||0)>=Number(out[key].updatedAt||0)))out[key]=value;return out;}
 const companies=records=>merge(defaults,records);
 const blocked=(name,records)=>!!companies(records)[companyKey(name)]?.blocked;
 function jobKey(value){try{const u=new URL(value);for(const key of [...u.searchParams.keys()])if(/^(utm_|ref$|source$)/i.test(key))u.searchParams.delete(key);u.hash='';return u.href.replace(/\/$/,'');}catch{return String(value||'');}}
 const hidden=(url,records)=>!!records?.[jobKey(url)]?.hidden;
 function validate(input={}){
  const employerPreferences={},jobVisibility={};
  for(const record of Object.values(input.employerPreferences||{}).slice(0,1000)){
   if(!record||typeof record.name!=='string'||typeof record.blocked!=='boolean'||!Number.isFinite(record.updatedAt)||record.updatedAt<0)throw Error('Invalid company preference.');
   const name=record.name.trim().slice(0,180),key=companyKey(name);if(!key)throw Error('Enter a company name.');
   employerPreferences[key]={name,blocked:record.blocked,reason:String(record.reason||'').slice(0,300),updatedAt:record.updatedAt};
  }
  for(const [url,record] of Object.entries(input.jobVisibility||{}).slice(0,10000)){
   if(!record||typeof record.hidden!=='boolean'||!Number.isFinite(record.updatedAt)||record.updatedAt<0||!/^https?:\/\//.test(url))throw Error('Invalid hidden job preference.');
   jobVisibility[jobKey(url)]={hidden:record.hidden,reason:String(record.reason||'').slice(0,300),updatedAt:record.updatedAt};
  }
  return {employerPreferences:companies(employerPreferences),jobVisibility};
 }
 globalThis.JobbiesEmployerPolicy=Object.freeze({companyKey,jobKey,defaults,companies,blocked,hidden,merge,validate});
})();
