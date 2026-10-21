import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const context=vm.createContext({});context.window=context;
vm.runInContext(await readFile(new URL('../site/question-library.js',import.meta.url),'utf8'),context);
vm.runInContext(await readFile(new URL('../site/matching.js',import.meta.url),'utf8'),context);
const M=context.JobbiesMatching,profile=JSON.parse(await readFile(new URL('../site/profile-seed.json',import.meta.url),'utf8'));
const match=(title,description,extra={})=>{const j={title,description,...extra};Object.assign(j,M.classify(j));return {...j,...M.rank(j,profile,{travel_percent:{value:'100'},clearance_status:{value:'None'}})};};
test('field and fiber jobs outrank keyword-heavy senior remote software jobs',()=>{
 const field=match('Traveling Fiber Technician','100% travel. Fusion splicing, OTDR, cabling and telecom communications. Linux diagnostics. No security clearance required.');
 const senior=match('Senior Software Engineer','Remote. Python JavaScript Vue Node.js Docker AWS SQL APIs Linux. Minimum 10 years of software experience.',{remote:true});
 assert.equal(field.recommended,true);assert.equal(field.travel100,true);assert.equal(senior.recommended,false);assert(field.overall>senior.overall);
});
test('remote status alone never establishes qualification; unsupported stack requirements are visible',()=>{
 const job=match('Software Engineer','Remote. Required expertise in Java and Kubernetes. JavaScript Docker AWS Linux SQL.',{remote:true});
 assert.equal(job.recommended,false);assert(job.matchGaps.some(x=>x.includes('Java')));assert(job.matchGaps.some(x=>x.includes('Kubernetes')));
});
test('C2C, W-2, 1099 and generic contract are separate; no C2C does not match C2C',()=>{
 const no=M.classify({title:'Contract Fiber Technician',description:'W-2 only. No C2C or 1099 accepted.'});
 assert.deepEqual([...no.arrangements],['w2']);assert.equal(no.contract,true);assert.equal(no.business,false);
 const yes=M.classify({title:'Fiber Installation Subcontractor',description:'Corp-to-corp or 1099 accepted. Nationwide travel.'});
 assert.deepEqual([...yes.arrangements],['c2c','1099']);assert.equal(yes.business,true);
});
test('government contracts, startups and unknown sectors stay distinct',()=>{
 assert.equal(M.classify({title:'Field Technician',description:'Work on FAA facilities.'}).sector,'government_contract');
 assert.equal(M.classify({title:'Developer',description:'We are an early-stage startup.'}).sector,'startup');
 assert.equal(M.classify({title:'Developer',description:'Build tools for our startup customers.'}).sector,'unknown');
 assert.equal(M.classify({title:'Developer',description:'A contract role.'}).sector,'unknown');
});
test('clearance and location blockers stay outside recommendations',()=>{
 const job=match('Fiber Technician','Active Top Secret clearance required. Fusion splicing, OTDR, Linux and communications.');
 assert.equal(job.clearance,'existing');assert.equal(job.recommended,false);
 const foreign=match('Fiber Technician','Fusion splicing, OTDR, Linux and communications.',{marketExcluded:true});assert.equal(foreign.recommended,false);
});
test('intake enforces 100% technical travel and remote-only software before storage',()=>{
 const field=match('Fiber Technician','Fusion splicing, OTDR, cabling and telecom. 100 percent travel required.');
 assert.equal(M.intake(field).accepted,true);
 for(const description of ['Fusion splicing, OTDR, cabling and telecom. Travel as needed.','Fusion splicing, OTDR, cabling and telecom. 50% travel.'])assert.equal(M.intake(match('Fiber Technician',description)).accepted,false);
 for(const location of ['Chicago office','Hybrid remote — New York','Location not stated']){
  const j=match('Software Developer','JavaScript Node.js Python Linux APIs SQL.',{location});
  assert.equal(M.intake(j,{minimumTravel:0}).accepted,false,location);
 }
 const remote=match('Software Developer','JavaScript Node.js Python Linux APIs SQL.',{location:'Remote, United States'});
 assert.equal(M.intake(remote).accepted,true);assert.equal(M.intake(remote,{remoteSoftware:false}).accepted,false);
});
test('business intake is separate from W-2 jobs and respects commercial filters',()=>{
 const contract=match('Fiber Installation Subcontractor','C2C accepted. Fusion splicing, OTDR, cabling and telecom. 100% travel.',{pay:{currency:'USD',period:'hourly',min:40,max:60}});
 assert.equal(M.intake(contract).accepted,false);
 assert.equal(M.intake(contract,{minimumTravel:0},true).accepted,true);
 assert.equal(M.intake(contract,{minimumTravel:0,minimumHourly:70},true).accepted,false);
 assert.equal(M.intake(contract,{minimumTravel:0,arrangement:'1099'},true).accepted,false);
 assert.equal(M.intake(contract,{minimumTravel:0,sector:'government'},true).accepted,false);
 assert.equal(M.intake(contract,{minimumTravel:0,disciplines:['electronics']},true).accepted,false);
 assert.equal(M.intake(contract,{minimumTravel:0,excludeKeywords:'splicing'},true).accepted,false);
 const employee=match('Fiber Technician','W-2 employment. Fusion splicing, OTDR, cabling and telecom. 100% travel.');
 assert.equal(M.intake(employee).accepted,true);assert.equal(M.intake(employee,{minimumTravel:0},true).accepted,false);
 assert.equal(M.intake(employee,{requirePay:true}).accepted,false);
});

test('a remote feed cannot override an explicit hybrid or onsite requirement',()=>{
 for(const text of ['This is a hybrid role.','This position is on-site in Chicago.','This is a non-remote job.']){
  const job=match('Software Developer',text+' JavaScript Node.js Linux Python SQL APIs.',{remote:true,location:'Remote, USA'});
  assert.equal(job.remoteExplicit,false,text);assert.equal(M.intake(job).accepted,false);
 }
});
test('benefit tags require positive listing evidence',()=>{
 const job={categories:['fiber'],matchEvidence:['OTDR'],sector:'government_contract',arrangements:['w2'],perDiem:'Per diem is not provided',pay:{min:null}};
 assert.equal(M.tags(job).includes('per_diem'),false);assert(M.tags(job).includes('otdr'));assert(M.tags(job).includes('government'));
 job.perDiem='Per diem and hotel provided';assert(M.tags(job).includes('per_diem'));assert(M.tags(job).includes('hotel'));
});
