/* Chat front door. The saved profile stays. You describe the work, keep a bucket, and choose what gets sent. */
(() => {
  'use strict';
  const E = () => window.JobEngine;
  const esc = escapeHTML;
  const prompts = ['100% travel fiber technician', 'Remote software from my bases', 'Tech work in Casper, WY'];
  function agent() {
    const data = E().data;
    data.agent ||= { messages: [], brief: '', bucket: [], results: [], pendingQuestion: null, asks: 0 };
    data.agent.messages ||= [];
    data.agent.bucket ||= [];
    data.agent.results ||= [];
    return data.agent;
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
    if (/^(save|bucket|apply|send|remove|show)\b/i.test(value)) return false;
    if (/\b(job|jobs|travel|remote|fiber|technician|software|apply|save|bucket)\b/i.test(value) && value.split(/\s+/).length > 4) return false;
    if (key === 'us_citizen') return /^(yes|no)\b/i.test(value);
    if (key === 'clearance_status') return /\b(none|secret|unknown|top)\b/i.test(value);
    return true;
  }
  function acceptedJobs() {
    return Object.values(E().data.jobs).filter(job => E().jobDecision(job).accepted && !E().companyBlocked(job.company) && !E().isHidden(job));
  }
  function terms(text) { return String(text || '').toLowerCase().split(/[^a-z0-9+#.]+/).filter(word => word.length > 2 && !['the', 'and', 'for', 'with', 'job', 'jobs', 'want', 'need', 'from'].includes(word)); }
  function search(brief) {
    const words = terms(brief);
    const ranked = acceptedJobs().map(job => {
      const hay = `${job.title} ${job.company} ${job.location} ${(job.description || '').slice(0, 2500)}`.toLowerCase();
      const hits = words.reduce((count, word) => count + (hay.includes(word) ? 1 : 0), 0);
      return { job, hits };
    }).filter(row => !words.length || row.hits > 0).sort((a, b) => b.hits - a.hits || b.job.fit - a.job.fit);
    return ranked.slice(0, 8).map(row => row.job);
  }
  function numbers(text) { return [...String(text).matchAll(/\b(\d{1,2})\b/g)].map(match => Number(match[1])); }
  function listed(ids) { return ids.map(id => E().data.jobs[id]).filter(Boolean); }
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
    return `I'm working from the profile saved for ${profile.name || 'you'}. Skills on file include ${skills}. Your bases are ${bases}. Both resumes stay attached.\n\nDescribe the job you want. I'll pull listings. Save the ones you like into a bucket, then tell me which ones to apply to.\n\nGmail is not connected. When an application needs a fact I don't have, I'll ask you here instead of guessing.`;
  }
  function listingLines(jobs) {
    return jobs.map((job, index) => `${index + 1}. ${job.title} — ${job.company} · ${job.location}${job.placement?.note ? ' · ' + job.placement.note : ''}`).join('\n');
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
      reply = jobs.length ? `Your bucket:\n${listingLines(jobs)}\n\nSay apply 1, or apply to the bucket.` : 'The bucket is empty. Describe a job, then say save 1.';
    } else if (/^remove\b/.test(lower)) {
      const drop = new Set(numbers(cleaned).map(number => data.bucket[number - 1]).filter(Boolean));
      data.bucket = data.bucket.filter(id => !drop.has(id));
      reply = data.bucket.length ? `Removed. ${data.bucket.length} still in the bucket.` : 'The bucket is empty.';
    } else if (/^(save|bucket)\b/.test(lower) || /\bsave (them|these|all|\d)/.test(lower)) {
      const picks = /\ball\b/.test(lower) ? data.results.slice() : numbers(cleaned).map(number => data.results[number - 1]).filter(Boolean);
      for (const id of picks) if (!data.bucket.includes(id)) data.bucket.push(id);
      reply = picks.length ? `Saved ${picks.length} into the bucket. It now has ${data.bucket.length}. Say apply to the bucket when you want them sent.` : 'Use the numbers I just showed: save 1, save 1 and 3, or save all.';
    } else if (/^(apply|send)\b/.test(lower) || /\bapply to\b|\bsend (them|the bucket|these)\b/.test(lower)) {
      const jobs = chooseJobs(cleaned);
      reply = jobs.length ? await sendSelected(jobs) : /\bbucket\b/.test(lower) && !data.bucket.length ? 'The bucket is empty. Save listings first, then say apply to the bucket.' : 'Tell me which ones: apply 1, apply 1 and 3, or apply to the bucket.';
    } else {
      data.brief = cleaned;
      searching = true;
      E().emit();
      try {
        for (let wait = 0; wait < 40 && E().busy; wait++) await new Promise(resolve => setTimeout(resolve, 250));
        await E().pull({ refresh: true, prepare: false });
      } catch (error) { reply = `I could not refresh the feeds (${error.message}). I'll search what is already saved.\n`; }
      finally { searching = false; }
      const found = search(cleaned);
      data.results = found.map(job => job.id);
      attached = data.results.slice();
      reply += found.length
        ? `I found ${found.length} for “${cleaned}”.\n${listingLines(found)}\n\nSay save 1, save 1 and 2, or save all.`
        : `Nothing currently matches “${cleaned}”. I only keep 100% travel, tech roles at your bases, and remote tech. Try different words.`;
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
    return listed(ids).map(job => `<div class="agent-job"><div><strong>${esc(job.title)}</strong><span>${esc(job.company)} · ${esc(job.location)}</span></div><div><button type="button" class="secondary-button" data-agent-save="${esc(job.id)}">${saved.has(job.id) ? 'Saved' : 'Save'}</button><button type="button" class="secondary-button" data-agent-apply="${esc(job.id)}">Apply</button></div></div>`).join('');
  }
  function render(root) {
    const data = agent();
    const input = root.querySelector('#agent-input');
    const draft = input?.value || '';
    const focused = document.activeElement === input;
    const profile = E().data.profile || {};
    const bucket = listed(data.bucket);
    const log = (data.messages.length ? data.messages.map(message => `<article class="agent-bubble ${message.role}"><span>${message.role === 'you' ? 'You' : 'Jobbies'}</span><p>${esc(message.text)}</p>${message.role === 'agent' && message.jobs?.length ? jobButtons(message.jobs) : ''}</article>`).join('') : `<article class="agent-bubble agent"><span>Jobbies</span><p>${esc(welcome())}</p><div class="agent-prompts">${prompts.map(prompt => `<button type="button" class="type-chip" data-agent-prompt="${esc(prompt)}">${esc(prompt)}</button>`).join('')}</div></article>`) + (searching ? `<article class="agent-bubble agent"><span>Jobbies</span><p>Pulling listings…</p></article>` : '');
    root.innerHTML = `<section class="agent-shell"><aside class="agent-side"><h2>Your profile</h2><p><strong>${esc(profile.name || 'Profile not loaded')}</strong></p><p>${esc((profile.bases || []).join(' · '))}</p><p>${(profile.skills || []).length} skills saved from your resumes.</p><div class="resume-links">${['technician', 'software'].map(track => { const resume = profile.resumes?.[track]; const url = resume && E().resumeURL(resume); return url ? `<a class="secondary-button" href="${esc(url)}" download="${esc(resume.name)}">${track === 'technician' ? 'Technician' : 'Software'} resume</a>` : ''; }).join('')}</div><p class="workspace-footnote">Gmail is not connected. Missing facts are asked in the chat.</p><h3>Bucket <span>${bucket.length}</span></h3>${bucket.map((job, index) => `<div class="agent-bucket-row"><span>${index + 1}. ${esc(job.title)}</span><small>${esc(job.company)}</small><button type="button" data-agent-remove="${index + 1}">Remove</button></div>`).join('') || '<p>Nothing saved yet.</p>'}</aside><div class="agent-chat"><div class="agent-log" id="agent-log">${log}</div><form id="agent-form"><label class="sr-only" for="agent-input">Describe the job you want</label><textarea id="agent-input" rows="3" maxlength="2000" placeholder="Describe the job you want. Example: 100% travel fiber, or remote software."></textarea><button class="primary-button" type="submit">Send</button></form></div></section>`;
    const next = root.querySelector('#agent-input');
    if (draft) next.value = draft;
    if (focused) next.focus();
    const scroller = root.querySelector('#agent-log');
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }
  let busy = false;
  let searching = false;
  async function remember(id) {
    const job = E().data.jobs[id];
    if (!job) return;
    const data = agent();
    const fresh = !data.bucket.includes(id);
    if (fresh) data.bucket.push(id);
    data.messages.push({ role: 'agent', text: fresh ? `Saved “${job.title}” at ${job.company} into the bucket. It now has ${data.bucket.length}.` : `“${job.title}” is already in the bucket.`, at: Date.now() });
    data.messages = data.messages.slice(-40);
    await E().save();
    E().emit();
  }
  async function applyJob(id) {
    const job = E().data.jobs[id];
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
    const save = event.target.closest('[data-agent-save]');
    if (save) { event.preventDefault(); event.stopPropagation(); remember(save.dataset.agentSave); return; }
    const apply = event.target.closest('[data-agent-apply]');
    if (apply) { event.preventDefault(); event.stopPropagation(); applyJob(apply.dataset.agentApply); return; }
    const remove = event.target.closest('[data-agent-remove]');
    if (remove) { event.preventDefault(); event.stopPropagation(); submit('remove ' + remove.dataset.agentRemove); }
  }, true);
  window.JobbiesAgent = { render, submit, handle };
})();
