import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import '../site/employer-policy.js';
import {createAutoApply} from '../companion/auto-apply.mjs';
const P=globalThis.JobbiesEmployerPolicy;
test('companies are visible by default; user hides match company suffixes without matching unrelated names',()=>{
 assert.equal(P.blocked('Parsons',{}),false);assert.equal(P.blocked('Leidos',{}),false);
 const preferences=P.validate({employerPreferences:{x:{name:'Parsons Corporation',blocked:true,reason:'Not suitable',updatedAt:10}}}).employerPreferences;
 assert(P.blocked('PARSONS, INC.',preferences));assert(!P.blocked('Parsons Technology',preferences));
 const changed=P.merge(preferences,{parsons:{name:'Parsons',blocked:false,updatedAt:20}});assert(!P.blocked('Parsons',changed));assert(!P.blocked('Parsons',P.merge(changed,preferences)),'An older tab must not re-hide the company');
});
test('a hidden listing keeps the same identity across tracking parameters',()=>{
 const jobs={'https://example.com/jobs/1':{hidden:true,updatedAt:10}};assert(P.hidden('https://example.com/jobs/1?utm_source=board#apply',jobs));assert(!P.hidden('https://example.com/jobs/2',jobs));
});
test('the worker enforces user company/job exclusions before opening the browser, persists them, and permits explicit unhiding',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'jobbies-exclusions-'));let worker;
 const input={job:{id:'j1',url:'https://employer.example/jobs/1',company:'Test Employer'},version:1,email:'candidate@example.com',fields:[],values:{},authorization:{reviewed:true,version:1}};
 try{
  worker=await createAutoApply({directory,launch:()=>{throw Error('Excluded jobs must not open a browser');}});
  await worker.updatePolicy({employerPreferences:{employer:{name:'Test Employer',blocked:true,updatedAt:10}}});await assert.rejects(worker.apply(input),/company is blocked/);await worker.close();
  worker=await createAutoApply({directory});await assert.rejects(worker.apply(input),/company is blocked/);
  await worker.updatePolicy({employerPreferences:{employer:{name:'Test Employer',blocked:false,updatedAt:20}},jobVisibility:{[input.job.url]:{hidden:true,updatedAt:20}}});await assert.rejects(worker.apply(input),/job is hidden/);
  await worker.updatePolicy({jobVisibility:{[input.job.url]:{hidden:false,updatedAt:30}}});assert.doesNotThrow(()=>worker.checkAllowed(input));
 }finally{await worker?.close();await rm(directory,{recursive:true,force:true});}
});
