/* Chat front door. The saved profile stays. You describe the work, keep a bucket, and choose what gets sent. */
(() => {
  'use strict';
  const E = () => window.JobEngine;
  const esc = escapeHTML;
  const jobPrompts = ['100% travel fiber technician', 'Remote software from my bases', 'Tech work in Casper, WY'];
  const contractPrompts = ['Fiber splicing and site teardown, C2C', 'Data center decommission and copper removal', 'Remote software delivery for a small company'];
  const lockedContracts = () => location.pathname.endsWith('contracts.html');
  function agent() {
    const data = E().data;
    data.agent ||= { messages: [], brief: '', bucket: [], results: [], pendingQuestion: null, asks: 0, mode: 'jobs' };
    data.agent.messages ||= [];
    data.agent.bucket ||= [];
    data.agent.results ||= [];
    if (!data.agent.mode) data.agent.mode = lockedContracts() ? 'contracts' : 'jobs';
    return data.agent;
  }
  function mode() { return lockedContracts() || agent().mode === 'contracts' ? 'contracts' : 'jobs'; }
  function prompts() { return mode() === 'contracts' ? contractPrompts : jobPrompts; }
  function jobById(id) {
    const data = E().data;
    return data.jobs[id] || data.businessLeads?.[id] || data.businessPool?.[id] || data.jobPool?.[id] || null;
  }
  function known(key) { const fact = E().resolveFact(key); return fact?.known ? fact.value : ''; }
  function nextQuestion() {
    const questions = [
      ['clearance_status', 'What is your current security clearance? None, Secret, Top Secret, or Unknown.'],
      ['us_citizen', 'Are you a US citizen? Yes or no.'],
      ['start_date', 'When can you start?']
    ];
    return questions.find(([key]) => !known(key)) || null;
  }
  function looksLikeAnswer(text, key) {
    const value = text.trim();
    if (!value || value.length > 80) return false;
    if (/^(save|bucket|apply|send|remove|show|jobs?|contracts?|business)\b/i.test(value)) return false;
    if (/\b(job|jobs|travel|remote|fiber|technician|software|apply|save|bucket)\b/i.test(value) && value.split(/\s+/).length > 4) return false;
    if (key === 'us_citizen') return /^(yes|no)\b/i.test(value);
    if (key === 'clearance_status') return /\b(none|secret|unknown|top)\b/i.test(value);
    return true;
  }
  function acceptedJobs() {
    return Object.values(E().data.jobs).filter(job => E().jobDecision(job).accepted && !E().companyBlocked(job.company) && !E().isHidden(job));
  }
  function contractPool() {
    const data = E().data;
    const map = new Map();
    for (const job of [...Object.values(data.businessLeads || {}), ...Object.values(data.businessPool || {}), ...Object.values(data.jobPool || {}), ...Object.values(data.jobs || {})]) {
      if (!job?.id || E().companyBlocked(job.company) || E().isHidden(job)) continue;
      if (!map.has(job.id)) map.set(job.id, job);
    }
    return [...map.values()];
  }
  function tierFor(job) { return window.JobbiesMatching.shopTier(job, E().data.profile || {}, E().data.businessProfile || {}); }
  function search(briefText) {
    const M = window.JobbiesMatching;
    const brief = M.askBrief(briefText, E().data.profile?.bases || []);
    const pool = mode() === 'contracts' ? contractPool() : acceptedJobs();
    let rows = pool.map(job => ({ job, score: M.askScore(job, brief) })).filter(row => row.score >= 0);
    let note = '';
    if (mode() === 'jobs' && brief.travel100) {
      const travel = rows.filter(row => row.job.travel100 || row.job.travelExtensive);
      if (travel.length) rows = travel;
      else if (rows.length) note = 'None of the matching listings advertise 100% or extensive travel. These are the closest accepted roles.\n';
    }
    if (mode() === 'jobs' && brief.remote && !brief.travel100) {
      const remote = rows.filter(row => row.job.remoteExplicit && !row.job.hybrid);
      if (remote.length) rows = remote;
    }
    if (mode() === 'jobs' && brief.place) {
      const local = rows.filter(row => row.job.placement?.kind === 'local' && row.job.placement.primary === brief.place);
      if (local.length) rows = local;
      else if (rows.length) note += `None of these are on site in ${brief.place}.\n`;
    }
    rows.sort((a, b) => b.score - a.score || (b.job.fit || 0) - (a.job.fit || 0));
    if (mode() === 'contracts') {
      const tierRank = { good: 0, possible: 1, later: 2 };
      rows.forEach(row => { row.tier = tierFor(row.job); });
      rows.sort((a, b) => tierRank[a.tier.tier] - tierRank[b.tier.tier] || b.score - a.score);
      const ready = rows.filter(row => row.tier.tier !== 'later').slice(0, 6);
      const later = rows.filter(row => row.tier.tier === 'later').slice(0, 2);
      rows = [...ready, ...later];
    } else rows = rows.slice(0, 8);
    return { jobs: rows.map(row => row.job), note, brief };
  }
  function numbers(text) { return [...String(text).matchAll(/\b(\d{1,2})\b/g)].map(match => Number(match[1])); }
  function listed(ids) { return ids.map(id => jobById(id)).filter(Boolean); }
  function chooseJobs(text) {
    const data = agent();
    const lower = String(text || '').toLowerCase();
    const mentionsBucket = /\bbucket\b/.test(lower);
    const wantsAll = /\b(all|these|them)\b/.test(lower);
    const chosen = numbers(text);
    const source = listed(mentionsBucket ? data.bucket : data.results);
    if (chosen.length) return chosen.map(number => source[number - 1]).filter(Boolean);
    if (wantsAll || mentionsBucket) return source;
    return [];
  }
  function welcome() {
    const profile = E().data.profile || {};
    const skills = (profile.skills || []).slice(0, 6).join(', ') || 'the skills on your resumes';
    const bases = (profile.bases || []).join(' · ') || 'your saved bases';
    const business = E().data.businessProfile || {};
    const service = (business.services || '').trim();
    if (mode() === 'contracts') return `Contracts ask. Describe the service you want to sell${service ? `, starting from “${service.slice(0, 180)}”` : ''}. I will pull listings for that kind of work and mark each one: what it requires, what your resumes already cover, and whether it fits a small company.\n\nGood for your shop means the listing is a contract and the scope matches your evidence. Same kind of work, posted as a job means you would have to ask about C2C or 1099. Not for this shop yet means a requirement is missing, such as clearance, bonding, certified destruction, or living in another city.\n\nSave the ones you want. Say draft 1 to write a proposal on this computer. Nothing is sent.`;
    return `I'm working from the profile saved for ${profile.name || 'you'}. Skills on file include ${skills}. Your bases are ${bases}. Both resumes stay attached.\n\nDescribe the job you want. Name the trade, 100% travel, remote, or one of your bases. I'll pull listings and show what each one requires.\n\nGmail is not connected. When an application needs a fact I don't have, I'll ask you here.`;
  }
  function detailLine(job) {
    const tier = tierFor(job);
    const need = tier.needs.length ? `Requires: ${tier.needs.join(', ')}.` : 'No extra requirement was stated.';
    const have = tier.have.length ? ` You have: ${tier.have.join(', ')}.` : '';
    const missing = tier.missing.length ? ` Still needed: ${tier.missing.join('; ')}.` : '';
    return `${tier.label}. ${need}${have}${missing}`;
  }
  function listingLines(jobs) {
    return jobs.map((job, index) => `${index + 1}. ${job.title} — ${job.company} · ${job.location}${job.placement?.note ? ' · ' + job.placement.note : ''}\n   ${detailLine(job)}`).join('\n');
  }
  async function sendSelected(jobs) {
    const lines = [];
    for (const job of jobs) {
      try {
        await E().prepare(job.id);
        const draft = E().data.drafts[job.id];
        if (draft?.missing?.length) {
          lines.push(`${job.company} — ${job.title}: prepared, but ${draft.missing.length} answer${draft.missing.length === 1 ? '' : 's'} still need you before I send it.`);
          continue;
        }
        if (!E().approve(job.id, { automated: true })) {
          lines.push(`${job.company} — ${job.title}: prepared. I could not approve it yet. Open Review & send.`);
          continue;
        }
        if (window.JobbiesAutomation?.apply) {
          await JobbiesAutomation.apply(job.id);
          lines.push(`${job.company} — ${job.title}: approved. The application worker is sending it from this computer.`);
        } else lines.push(`${job.company} — ${job.title}: approved and waiting for the application worker.`);
      } catch (error) {
        lines.push(`${job.company} — ${job.title}: ${error.message}`);
      }
    }
    return lines.join('\n');
  }
  function contractShaped(job) { return !!(job.business || job.arrangements?.includes('c2c') || job.arrangements?.includes('1099')); }
  async function draftOne(job) {
    const tier = tierFor(job);
    if (tier.tier === 'later') return `${job.company} — ${job.title}: ${tier.label}. I did not draft a proposal. ${tier.missing.join('; ') || tier.needs.join(', ')}`;
    if (!contractShaped(job)) return `${job.company} — ${job.title}: this is posted as a job. I did not draft a contract or send anything. Switch to Jobs and say apply if you want the employee application.`;
    const profile = E().data.businessProfile || {};
    const proposal = [profile.name || '[Company name]', 'Proposal for ' + job.title, '', 'Service you asked for: ' + (agent().brief || ''), 'Relevant services: ' + (profile.services || '[Add services in the company profile]'), tier.have.length ? 'Matching evidence: ' + tier.have.join(', ') : '', tier.needs.length ? 'Listing requirements to confirm: ' + tier.needs.join(', ') : '', 'Scope, deliverables, schedule, and payment terms must be agreed before work begins.', 'This draft was not sent.'].filter(Boolean).join('\n');
    let lead = E().data.businessLeads?.[job.id];
    try {
      if (!lead) lead = await E().importBusinessLead(job);
      await E().saveBusinessLead(lead.id, { stage: 'draft', proposal, note: tier.label });
    } catch (error) { return `${job.company} — ${job.title}: ${error.message}`; }
    return `${job.company} — ${job.title}: proposal draft saved in your contract pipeline. Nothing was sent.`;
  }
  async function draftSelected(jobs) {
    const lines = [];
    for (const job of jobs) lines.push(await draftOne(job));
    return lines.join('\n');
  }
  async function handle(text) {
    const data = agent();
    const cleaned = String(text || '').trim().slice(0, 2000);
    if (!cleaned) return;
    data.messages.push({ role: 'you', text: cleaned, at: Date.now() });
    const lower = cleaned.toLowerCase();
    let reply = '';
    let attached = [];
    if (data.pendingQuestion && looksLikeAnswer(cleaned, data.pendingQuestion.key)) {
      await E().answer(data.pendingQuestion.key, cleaned);
      data.pendingQuestion = null;
      reply = 'Saved on your profile. I will reuse it on applications.';
    } else if (/^(show )?bucket\b|^what'?s in (the )?bucket|^show saved\b/.test(lower)) {
      const jobs = listed(data.bucket);
      reply = jobs.length ? `Your bucket:\n${listingLines(jobs)}\n\n${mode() === 'contracts' ? 'Say draft 1, or draft the bucket. Nothing is sent.' : 'Say apply 1, or apply to the bucket.'}` : 'The bucket is empty. Describe the work, then say save 1.';
    } else if (/^remove\b/.test(lower)) {
      const drop = new Set(numbers(cleaned).map(number => data.bucket[number - 1]).filter(Boolean));
      data.bucket = data.bucket.filter(id => !drop.has(id));
      reply = data.bucket.length ? `Removed. ${data.bucket.length} still in the bucket.` : 'The bucket is empty.';
    } else if (/^(save|bucket)\b/.test(lower) || /\bsave (them|these|all|\d)/.test(lower)) {
      const picks = /\ball\b/.test(lower) ? data.results.slice() : numbers(cleaned).map(number => data.results[number - 1]).filter(Boolean);
      for (const id of picks) if (!data.bucket.includes(id)) data.bucket.push(id);
      reply = picks.length ? `Saved ${picks.length} into the bucket. It now has ${data.bucket.length}. ${mode() === 'contracts' ? 'Say draft 1 when you want a proposal saved on this computer.' : 'Say apply to the bucket when you want them sent.'}` : 'Use the numbers I just showed: save 1, save 1 and 3, or save all.';
    } else if (/^(jobs?|contracts?|business|ask for (?:jobs|contracts))\s*$/i.test(cleaned)) {
      data.mode = /contract|business/i.test(cleaned) ? 'contracts' : 'jobs';
      reply = mode() === 'contracts' ? 'Contracts ask is on. Describe the service you want to sell.' : 'Jobs ask is on. Describe the role, the travel, or the base.';
    } else if (mode() === 'contracts' && (/^(draft|proposal)\b/.test(lower) || /\bdraft (them|the bucket|these|all)\b/.test(lower))) {
      const jobs = chooseJobs(cleaned.replace(/\bdraft\b/g, 'apply'));
      reply = jobs.length ? await draftSelected(jobs) : 'Tell me which ones: draft 1, draft 1 and 3, or draft the bucket. Nothing is sent.';
    } else if (/^(apply|send)\b/.test(lower) || /\bapply to\b|\bsend (them|the bucket|these)\b/.test(lower)) {
      const jobs = chooseJobs(cleaned);
      if (!jobs.length) reply = /\bbucket\b/.test(lower) && !data.bucket.length ? 'The bucket is empty. Save listings first.' : mode() === 'contracts' ? 'Tell me which ones: draft 1, or draft the bucket. I do not send proposals from here.' : 'Tell me which ones: apply 1, apply 1 and 3, or apply to the bucket.';
      else reply = mode() === 'contracts' ? await draftSelected(jobs) : await sendSelected(jobs);
    } else {
      if (/\b(contracts?|c2c|1099|subcontract|rfp|rfq|small business)\b/.test(lower) && !/\bjobs?\b|\bw-?2\b|\bemployment\b/.test(lower)) data.mode = 'contracts';
      else if (/\bjobs?\b|\bw-?2\b|\bemployment\b/.test(lower) && !/\b(contracts?|c2c|1099|subcontract)\b/.test(lower)) data.mode = 'jobs';
      data.brief = cleaned;
      searching = true;
      E().emit();
      try {
        for (let wait = 0; wait < 40 && E().busy; wait++) await new Promise(resolve => setTimeout(resolve, 250));
        await E().pull({ refresh: true, prepare: false });
      } catch (error) { reply = `I could not refresh the feeds (${error.message}). I'll search what is already saved.\n`; }
      finally { searching = false; }
      const found = search(cleaned);
      data.results = found.jobs.map(job => job.id);
      attached = data.results.slice();
      if (!found.jobs.length) reply += mode() === 'contracts' ? `Nothing in the saved listings matches “${cleaned}”. Name the trade, the equipment, or the kind of site.` : `Nothing currently matches “${cleaned}”. I only keep 100% travel, tech roles at your bases, and remote tech. Try the trade, the base, or remote.`;
      else {
        const counts = found.jobs.reduce((total, job) => { const key = tierFor(job).tier; total[key] = (total[key] || 0) + 1; return total; }, {});
        const summary = mode() === 'contracts' ? `${counts.good || 0} fit a small company, ${counts.possible || 0} need a contract-term check, ${counts.later || 0} are not for this shop yet.` : 'Each line shows what the listing requires and what your profile already covers.';
        reply += `${found.note || ''}I found ${found.jobs.length} for “${cleaned}”. ${summary}\n${listingLines(found.jobs)}\n\nSay save 1, save 1 and 2, or save all.`;
      }
      data.asks = (data.asks || 0) + 1;
      const question = nextQuestion();
      if (question && data.asks % 3 === 1) {
        data.pendingQuestion = { key: question[0] };
        reply += `\n\nOne profile gap, whenever you want to answer it: ${question[1]}`;
      }
    }
    data.messages.push({ role: 'agent', text: reply, jobs: attached, at: Date.now() });
    data.messages = data.messages.slice(-40);
    await E().save();
    E().emit();
  }
  function jobButtons(ids) {
    const saved = new Set(agent().bucket);
    return listed(ids).map(job => {
      const tier = tierFor(job);
      const action = mode() === 'contracts'
        ? (tier.tier === 'later' || !contractShaped(job) ? '' : `<button type="button" class="secondary-button" data-agent-draft="${esc(job.id)}">Draft</button>`)
        : `<button type="button" class="secondary-button" data-agent-apply="${esc(job.id)}">Apply</button>`;
      return `<div class="agent-job"><div><strong>${esc(job.title)}</strong><span>${esc(job.company)} · ${esc(job.location)}</span><em class="agent-tier ${esc(tier.tier)}">${esc(tier.label)}</em><small class="agent-need">${esc([tier.needs.length ? 'Requires: ' + tier.needs.join(', ') : '', tier.have.length ? 'You have: ' + tier.have.join(', ') : '', tier.missing.length ? 'Still needed: ' + tier.missing.join('; ') : ''].filter(Boolean).join('. '))}</small></div><div><button type="button" class="secondary-button" data-agent-save="${esc(job.id)}">${saved.has(job.id) ? 'Saved' : 'Save'}</button>${action}</div></div>`;
    }).join('');
  }
  function render(root) {
    const data = agent();
    const input = root.querySelector('#agent-input');
    const draft = input?.value || '';
    const focused = document.activeElement === input;
    const profile = E().data.profile || {};
    const bucket = listed(data.bucket);
    const log = (data.messages.length ? data.messages.map(message => `<article class="agent-bubble ${message.role}"><span>${message.role === 'you' ? 'You' : 'Jobbies'}</span><p>${esc(message.text)}</p>${message.role === 'agent' && message.jobs?.length ? jobButtons(message.jobs) : ''}</article>`).join('') : `<article class="agent-bubble agent"><span>Jobbies</span><p>${esc(welcome())}</p><div class="agent-prompts">${prompts().map(prompt => `<button type="button" class="type-chip" data-agent-prompt="${esc(prompt)}">${esc(prompt)}</button>`).join('')}</div></article>`) + (searching ? `<article class="agent-bubble agent"><span>Jobbies</span><p>Pulling listings…</p></article>` : '');
    root.innerHTML = `<section class="agent-shell"><aside class="agent-side"><h2>Your profile</h2><p><strong>${esc(profile.name || 'Profile not loaded')}</strong></p><p>${esc((profile.bases || []).join(' · '))}</p><p>${(profile.skills || []).length} skills saved from your resumes.</p><div class="resume-links">${['technician', 'software'].map(track => { const resume = profile.resumes?.[track]; const url = resume && E().resumeURL(resume); return url ? `<a class="secondary-button" href="${esc(url)}" download="${esc(resume.name)}">${track === 'technician' ? 'Technician' : 'Software'} resume</a>` : ''; }).join('')}</div><p>${mode() === 'contracts' ? 'Asking for contracts.' : 'Asking for jobs.'} ${(E().data.businessProfile?.services || '').trim() ? 'Company services are saved.' : 'Company services are blank.'}</p><p><a href="roddy.html">Roddy Technical Services</a> · <a href="resumes/Roddy_Technical_Services_Capability.docx" download>Capability resume</a></p><p class="workspace-footnote">Gmail is not connected. Missing facts are asked in the chat. Contract drafts stay on this computer.</p><h3>Bucket <span>${bucket.length}</span></h3>${bucket.map((job, index) => `<div class="agent-bucket-row"><span>${index + 1}. ${esc(job.title)}</span><small>${esc(job.company)}</small><button type="button" data-agent-remove="${index + 1}">Remove</button></div>`).join('') || '<p>Nothing saved yet.</p>'}</aside><div class="agent-chat"><div class="agent-log" id="agent-log">${log}</div><form id="agent-form"><div class="agent-modes" role="group" aria-label="What to ask for">${lockedContracts() ? '' : `<button type="button" data-agent-mode="jobs" aria-pressed="${mode() === 'jobs'}">Jobs</button>`}<button type="button" data-agent-mode="contracts" aria-pressed="${mode() === 'contracts'}">Contracts</button></div><label class="sr-only" for="agent-input">${mode() === 'contracts' ? 'Describe the service you want to sell' : 'Describe the job you want'}</label><textarea id="agent-input" rows="3" maxlength="2000" placeholder="${mode() === 'contracts' ? 'Describe the service. Example: fiber splicing and site teardown, C2C.' : 'Describe the job. Example: 100% travel fiber, remote software, or tech work in Casper.'}"></textarea><button class="primary-button" type="submit">Send</button></form></div></section>`;
    const next = root.querySelector('#agent-input');
    if (draft) next.value = draft;
    if (focused) next.focus();
    const scroller = root.querySelector('#agent-log');
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }
  let busy = false;
  let searching = false;
  async function remember(id) {
    const job = jobById(id);
    if (!job) return;
    const data = agent();
    const fresh = !data.bucket.includes(id);
    if (fresh) data.bucket.push(id);
    data.messages.push({ role: 'agent', text: fresh ? `Saved “${job.title}” at ${job.company} into the bucket. It now has ${data.bucket.length}.` : `“${job.title}” is already in the bucket.`, at: Date.now() });
    data.messages = data.messages.slice(-40);
    await E().save();
    E().emit();
  }
  async function draftJob(id) {
    const job = jobById(id);
    if (!job || busy) return;
    busy = true;
    const data = agent();
    data.messages.push({ role: 'you', text: `Draft a proposal for ${job.title} — ${job.company}`, at: Date.now() });
    E().emit();
    try { data.messages.push({ role: 'agent', text: await draftOne(job), at: Date.now() }); }
    catch (error) { data.messages.push({ role: 'agent', text: error.message, at: Date.now() }); }
    finally { data.messages = data.messages.slice(-40); busy = false; await E().save(); E().emit(); }
  }
  function setMode(next) {
    if (lockedContracts()) return;
    agent().mode = next === 'contracts' ? 'contracts' : 'jobs';
    E().save();
    E().emit();
  }
  async function applyJob(id) {
    const job = jobById(id);
    if (mode() === 'contracts') { draftJob(id); return; }
    if (!job || busy) return;
    busy = true;
    const data = agent();
    data.messages.push({ role: 'you', text: `Apply to ${job.title} — ${job.company}`, at: Date.now() });
    E().emit();
    try {
      const reply = await sendSelected([job]);
      data.messages.push({ role: 'agent', text: reply, at: Date.now() });
    } catch (error) {
      data.messages.push({ role: 'agent', text: error.message, at: Date.now() });
    } finally {
      data.messages = data.messages.slice(-40);
      busy = false;
      await E().save();
      E().emit();
    }
  }
  async function submit(text) {
    const box = document.querySelector('#agent-input');
    const value = text ?? box?.value;
    if (!value?.trim() || busy) return;
    busy = true;
    if (box) box.value = '';
    try { await handle(value); } catch (error) { agent().messages.push({ role: 'agent', text: error.message, at: Date.now() }); await E().save(); E().emit(); }
    finally { busy = false; }
  }
  document.addEventListener('click', event => {
    const prompt = event.target.closest('[data-agent-prompt]');
    if (prompt) { event.preventDefault(); event.stopPropagation(); submit(prompt.dataset.agentPrompt); return; }
    const pickMode = event.target.closest('[data-agent-mode]');
    if (pickMode) { event.preventDefault(); event.stopPropagation(); setMode(pickMode.dataset.agentMode); return; }
    const save = event.target.closest('[data-agent-save]');
    if (save) { event.preventDefault(); event.stopPropagation(); remember(save.dataset.agentSave); return; }
    const draft = event.target.closest('[data-agent-draft]');
    if (draft) { event.preventDefault(); event.stopPropagation(); draftJob(draft.dataset.agentDraft); return; }
    const apply = event.target.closest('[data-agent-apply]');
    if (apply) { event.preventDefault(); event.stopPropagation(); applyJob(apply.dataset.agentApply); return; }
    const remove = event.target.closest('[data-agent-remove]');
    if (remove) { event.preventDefault(); event.stopPropagation(); submit('remove ' + remove.dataset.agentRemove); }
  }, true);
  window.JobbiesAgent = { render, submit, handle };
})();
