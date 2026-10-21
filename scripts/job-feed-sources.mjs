// Public employer listing endpoints. No applicant credentials or write operations.
export const jobFeedSources=[
 {id:'wachter-travel',company:'Wachter',kind:'lever',board:'wachter',home:'https://jobs.lever.co/wachter',focus:'Telecom, structured cabling, low voltage, rollout projects'},
 {id:'networkconnex-travel',company:'Network Connex',kind:'lever',board:'networkconnex',home:'https://jobs.lever.co/networkconnex',focus:'Fiber splicing, outside plant, data centers'},
 {id:'brightspeed-travel',company:'Brightspeed',kind:'smartrecruiters',board:'Brightspeed',query:'mobile',home:'https://jobs.smartrecruiters.com/Brightspeed',focus:'Mobile fiber service and telecom'},
 {id:'crown-travel',company:'Crown Innovations',kind:'smartrecruiters',board:'CrownInnovationsInc',home:'https://jobs.smartrecruiters.com/CrownInnovationsInc',focus:'Electronics installation, telecom, FAA projects'},
 {id:'jci-travel',company:'Johnson Controls',kind:'workday',host:'jci.wd5',tenant:'jci',board:'JCI',queries:['traveling','field service','controls technician'],focus:'Controls, electronics, field support and commissioning'},
 {id:'hitachi-travel',company:'Hitachi Energy',kind:'workday',host:'hitachi.wd1',tenant:'hitachi',board:'hitachi',queries:['field service technician','field service','commissioning'],focus:'Field service, diagnostics and infrastructure'},
 {id:'agilent-travel',company:'Agilent',kind:'workday',host:'agilent.wd5',tenant:'agilent',board:'Agilent_Careers',queries:['field service','field support'],focus:'Electronic instrumentation, service and diagnostics'},
 {id:'carrier-travel',company:'Carrier',kind:'workday',host:'carrier.wd5',tenant:'carrier',board:'jobs',queries:['controls technician','field service','commissioning'],focus:'Controls, commissioning and field service'},
 {id:'danaher-travel',company:'Danaher',kind:'workday',host:'danaher.wd1',tenant:'danaher',board:'DanaherJobs',queries:['field service','field technician'],focus:'Instrumentation and electronic field service'},
 {id:'thermofisher-travel',company:'Thermo Fisher Scientific',kind:'workday',host:'thermofisher.wd5',tenant:'thermofisher',board:'ThermoFisherCareers',queries:['field service','field technician'],focus:'Instrumentation, diagnostics and field support'},
 {id:'jabil-travel',company:'Jabil',kind:'workday',host:'jabil.wd5',tenant:'jabil',board:'Jabil_Careers',queries:['field service','network technician'],focus:'Electronics, technical support and infrastructure'},
 {id:'parsons-travel',company:'Parsons',kind:'workday',host:'parsons.wd5',tenant:'parsons',board:'Search',queries:['100% travel'],focus:'Travel electronics, infrastructure and FAA projects'}
].map(s=>({...s,home:s.home||'https://'+s.host+'.myworkdayjobs.com/'+s.board}));
