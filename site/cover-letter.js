/* Factual local fallback; Codex can improve this draft using the same profile evidence. */
(() => {
  function draft(job,profile,summary,answers={}){
    const paragraphs=['Dear '+(job.company?job.company+' hiring team':'Hiring team')+',',
      'I am applying for the '+job.title+' position'+(job.company?' at '+job.company:'')+'.',
      String(summary||'').trim()];
    if(job.matchEvidence?.length)paragraphs.push('Relevant experience I can bring to this work includes '+job.matchEvidence.slice(0,6).join(', ')+'.');
    if(job.travel100&&Number(answers.travel_percent?.value)===100)paragraphs.push('I am available for 100% travel.');
    paragraphs.push('I would welcome the opportunity to discuss how my background fits the work your team needs done. Thank you for considering my application.','Sincerely,\n'+profile.name);
    return paragraphs.filter(Boolean).join('\n\n');
  }
  function rtf(value){
    let out='';for(let i=0;i<String(value).length;i++){const n=value.charCodeAt(i),c=value[i];out+=c==='\n'?'\\par\n':/[\\{}]/.test(c)?'\\'+c:n>127?'\\u'+(n>32767?n-65536:n)+'?':c;}
    return '{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\f0\\fs22\n'+out+'}';
  }
  globalThis.JobbiesCoverLetter={draft,rtf};
})();
