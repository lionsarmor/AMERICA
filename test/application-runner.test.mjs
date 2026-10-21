import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {supportedApplicationURL,validateApplication,createApplicationRunner} from '../companion/application-runner.mjs';
const input=()=>({job:{id:'greenhouse:test',url:'https://job-boards.greenhouse.io/test/jobs/123'},version:1,email:'candidate@example.com',fields:[{id:'first_name',label:'First name',required:true,type:'input_text'},{id:'email',label:'Email',required:true,type:'input_text'}],values:{first_name:'Test',email:'candidate@example.com'}});
test('application submission accepts only supported employer forms and complete versioned data',()=>{
 for(const url of ['http://job-boards.greenhouse.io/test/jobs/123','https://evil.example/jobs/123','https://job-boards.greenhouse.io@localhost/jobs/123','https://job-boards.greenhouse.io/test'])assert.equal(supportedApplicationURL(url),false);
 assert.equal(supportedApplicationURL(input().job.url),true);assert.equal(validateApplication(input()).version,1);
 assert.throws(()=>validateApplication({...input(),values:{}}),/Finish the required answer/);
});
test('persisted uncertain submissions cannot be retried even after a companion restart',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'jobbies-apply-'));
 let runner;try{
  const {createHash}=await import('node:crypto');const data=input(),u=new URL(data.job.url),key=createHash('sha256').update(u.origin+u.pathname+'\n'+data.email).digest('hex');
  await writeFile(join(directory,'receipts.json'),JSON.stringify({[key]:{status:'sending'}}));
  runner=await createApplicationRunner({directory,launch:()=>{throw Error('Browser should not launch')}});
  await assert.rejects(runner.prepare(data),/previous send may have reached/);
 }finally{await runner?.close();await rm(directory,{recursive:true,force:true});}
});
