import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createAutoApply,applicationURL,validateAutoApplication,savedValue,questionKey} from '../companion/auto-apply.mjs';
const input={job:{id:'job:1',url:'https://employer.example/jobs/1',location:'United States'},version:1,email:'candidate@example.com',fields:[],values:{},authorization:{reviewed:true,version:1}};
test('automation requires version-specific approval and a public HTTPS employer address',()=>{
 for(const url of ['http://employer.example','https://localhost','https://127.0.0.1','https://[::1]','https://user:password@employer.example','https://employer.internal','https://employer.example:4317'])assert.equal(applicationURL(url),false);
 assert.equal(applicationURL('https://employer.wd5.myworkdayjobs.com/jobs/1'),true);
 assert.throws(()=>validateAutoApplication({...input,authorization:{reviewed:true,version:2}}),/Yes, apply/);
});
test('confirmed profile facts answer exact questions without guessing compound declarations',()=>{
 const data={...input,facts:{first_name:'Test',us_citizen:'Yes',clearance_status:'None',us_work_authorization:'Yes',travel_percent:'100'}};
 assert.equal(savedValue({label:'First Name*',options:[]},data),'Test');
 assert.equal(savedValue({label:'Are you a US citizen?',options:[]},data),'Yes');
 assert.equal(savedValue({label:'Are you a US citizen and hold an active Secret clearance?',options:[]},data),undefined);
 assert.equal(savedValue({label:'How many years of radar experience?',options:[]},data),undefined);
 data.facts[questionKey('Have you worked for this employer?')+'@https://employer.example']='No';
 assert.equal(savedValue({label:'Have you worked for this employer?',options:[]},data),'No');
 assert.equal(savedValue({label:'Have you worked for this employer?',options:[]},{...data,job:{...data.job,url:'https://another.example/job'}}),undefined);
});
test('a restart during final submission never automatically retries',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'jobbies-restart-'));let worker;
 try{await writeFile(join(directory,'tasks.json'),JSON.stringify({test:{id:'test',jobId:'job:1',version:1,status:'sending',attempted:true,createdAt:Date.now()}}));
 worker=await createAutoApply({directory,launch:()=>{throw Error('Must not launch');}});
 assert.equal(worker.get('test').status,'unknown');await assert.rejects(worker.resume('test'),/cannot be resumed/);
 }finally{await worker?.close();await rm(directory,{recursive:true,force:true});}
});
