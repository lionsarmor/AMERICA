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

test('extensive travel is opt-in/out and ranges are labeled without claiming guaranteed 100% travel',()=>{
 const j=match('Low Voltage Technician','This role requires extensive nationwide travel. Fiber splicing, OTDR testing, cabling and telecom communications. No security clearance required.');
 assert.equal(j.travel100,false);assert.equal(j.travelExtensive,true);assert.match(j.travelTerms,/% not stated/);assert.equal(M.intake(j,{allowExtensiveTravel:true}).accepted,true);assert.equal(M.intake(j,{allowExtensiveTravel:false}).accepted,false);
 const ranged=match('Traveling Fiber Technician','Travel 75–100% of the time. Fiber splicing, OTDR testing, cabling and telecom communications. No security clearance required.');assert.equal(ranged.travel100,false);assert.equal(ranged.travelTerms,'75–100% travel');assert.equal(M.intake(ranged,{allowExtensiveTravel:false}).accepted,false);assert.equal(M.intake(ranged,{allowExtensiveTravel:true}).accepted,true);
});
test('tech at your bases and remote tech stay, jobs that make you live elsewhere do not',()=>{
 const bases=['Azle, TX','Rock Springs, WY','Casper, WY'];
 const rules={bases};
 const local=match('Fiber Technician','Fusion splicing, OTDR, cabling and telecom. No security clearance required.',{location:'Casper, WY'});
 assert.equal(M.intake(local,rules).accepted,true);
 assert.equal(M.placement(local,bases).primary,'Casper, WY');
 assert.equal(M.placement(local,bases).kind,'local');
 const dallas=match('Fiber Technician','Fusion splicing, OTDR, cabling and telecom.',{location:'Dallas, TX'});
 assert.equal(M.intake(dallas,rules).accepted,false);
 assert.equal(M.placement(dallas,bases).labels.length,0);
 const remote=match('Network Technician','Remote. Network installation, Linux diagnostics, and cabling.',{location:'Remote, United States',remote:true});
 assert.equal(M.intake(remote,rules).accepted,true);
 assert.deepEqual(M.placement(remote,bases).labels,bases);
 const software=match('Software Developer','JavaScript Node.js Python Linux APIs SQL.',{location:'Azle, TX'});
 assert.equal(M.intake(software,rules).accepted,true);
 const move=match('Fiber Technician','100% travel. Must reside in Dallas, TX. Fusion splicing, OTDR, cabling and telecom.',{location:'Dallas, TX'});
 assert.equal(M.intake(move,rules).accepted,false);
 const travel=match('Traveling Fiber Technician','100% travel. Fusion splicing, OTDR, cabling and telecom.',{location:'United States'});
 assert.equal(M.placement(travel,bases).kind,'travel');
 assert.deepEqual(M.placement(travel,bases).labels,bases);
});
test('an ask can name the work, and a small shop is tiered from the listing',()=>{
  const bases=profile.bases;
  const brief=M.askBrief('100% travel fiber technician',bases);
  assert.equal(brief.travel100,true);assert.ok(brief.families.includes('fiber'));
  assert.equal(M.askBrief('Tech work in Casper, WY',bases).place,'Casper, WY');
  const fiber=match('Traveling Fiber Technician','100% travel. W-2 employment. Fusion splicing, OTDR, cabling and telecom. No security clearance required.');
  const remote=match('Remote Software Engineer','Fully remote software. JavaScript, Node.js, Linux.',{remote:true,location:'Remote - United States'});
  assert.equal(M.askScore(remote,brief),-1);assert.ok(M.askScore(fiber,brief)>0);
  const c2c=match('Fiber Installation Subcontractor','Corp-to-corp. Fusion splicing, OTDR, cabling, and telecom site teardown. Insurance certificate required. No security clearance required.');
  const shop={services:'Fiber splicing and site teardown',insurance:''};
  const good=M.shopTier(c2c,profile,shop);
  assert.equal(good.tier,'good');assert.ok(good.needs.includes('C2C'));assert.ok(good.missing.some(item=>/Insurance/.test(item)));
  assert.equal(M.shopTier(fiber,profile,shop).tier,'possible');
  const itad=match('Data Center Decommission Technician','Certified ITAD and NAID certification required. Rack pull and copper removal.');
  assert.equal(M.shopTier(itad,profile,shop).tier,'later');
  const bonded=match('Fiber Subcontractor','C2C. Must be bonded. Fusion splicing, OTDR, cabling and telecom.');
  assert.equal(M.shopTier(bonded,profile,shop).tier,'later');
  const away=match('Fiber Technician','Must reside in Dallas, TX. Fusion splicing, OTDR, cabling and telecom.',{location:'Dallas, TX'});
  assert.equal(M.shopTier(away,profile,shop).tier,'later');
  const cleared=match('Fiber Technician','Active Secret clearance required. Fusion splicing, OTDR, cabling and telecom.');
  assert.equal(M.shopTier(cleared,profile,shop).tier,'later');
  const decom=M.askBrief('Data center decommission and copper removal',bases);
  const pull=match('Legacy removal technician','Rack pull, copper removal, and fiber teardown. C2C. No security clearance required.');
  assert.ok(M.askScore(pull,decom)>0);
  assert.equal(M.askScore(remote,decom),-1);
});
test('government and FAA filters are user-controlled, independent and reversible',()=>{
 const gov=match('Electronics Technician','100% travel. FAA infrastructure contract for a government agency. Fiber splicing, OTDR testing, cabling and telecom communications. No security clearance required.');
 assert.equal(M.intake(gov,{sector:'all',excludeFAA:false}).accepted,true);assert.equal(M.intake(gov,{sector:'private'}).accepted,false);assert.equal(M.intake(gov,{excludeFAA:true}).accepted,false);assert.equal(M.intake(gov,{sector:'all',excludeFAA:false}).accepted,true);
});
