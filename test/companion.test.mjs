import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createCompanion, validateWorkspace } from '../companion/server.mjs';
import { normalizeRequest, validateAnswers } from '../companion/reasoner.mjs';

const input = () => ({ job: { id: 'qa1', title: 'Fiber technician', company: 'QA', description: 'Fiber testing' }, fields: [{ id: 'experience', question: 'Describe your testing experience.', context: '', type: 'textarea', options: [] }], evidence: [{ id: 'r1', text: 'Used OTDR to test fiber links.', source: 'Resume' }] });
test('reasoning preserves evidence and rejects invented citations, option IDs, declarations, and precise skill years', () => {
  const request = normalizeRequest(input());
  const answer = { fieldId: 'experience', status: 'supported', values: ['I used OTDR to test fiber links.'], evidenceIds: ['r1'], reason: 'Supported by the resume.' };
  assert.equal(validateAnswers({ answers: [answer] }, request).answers[0].status, 'supported');
  assert.equal(validateAnswers({ answers: [{ ...answer, evidenceIds: ['invented'] }] }, request).answers[0].status, 'needs_answer');
  request.fields[0].options = [{ value: '10', label: 'Yes' }];
  assert.equal(validateAnswers({ answers: [answer] }, request).answers[0].status, 'needs_answer');
  request.fields[0].options = [];
  request.fields[0].question='Describe how you analyze an OTDR trace.';assert.equal(validateAnswers({answers:[answer]},request).answers[0].status,'supported');
  for (const question of ['Are you a US citizen?', 'Do you hold an active security clearance?', 'How many years of Python experience do you have?', 'Do you agree to this privacy policy?', 'Do you have an engineering degree?']) {
    request.fields[0].question = question;
    assert.equal(validateAnswers({ answers: [answer] }, request).answers[0].status, 'needs_answer', question);
  }
  assert.deepEqual(validateAnswers({ answers: [{ ...answer, fieldId: 'not-a-question' }] }, request).answers.map(a => a.status), ['needs_answer']);
});

test('companion authenticates local browser requests, protects files, persists backups, rejects stale writes, caches drafts and supports cancellation', async () => {
  const dataDir = await mkdtemp(join(tmpdir(), 'america-companion-test-'));
  let calls = 0, release;
  const gate = new Promise(resolve => { release = resolve; });
  const app = await createCompanion({ port: 0, dataDir, authenticate: async () => ({ installed: true, signedIn: true }), reasoner: async request => { calls++; if (request.job.id === 'wait') await gate; return { answers: [], summary: 'QA draft' }; } });
  const base = `http://127.0.0.1:${app.port}`;
  try {
    assert.equal((await fetch(base + '/api/health')).status, 401);
    const root = await fetch(base + '/'), cookie = root.headers.get('set-cookie').split(';')[0];
    assert.match(root.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
    const headers = { Cookie: cookie, Origin: base, 'X-America-Request': '1', 'Content-Type': 'application/json' };
    const request = async (path, method = 'GET', value, overrides = {}) => fetch(base + '/api/' + path, { method, headers: { ...headers, ...overrides }, body: value ? JSON.stringify(value) : undefined });
    assert.equal((await request('health')).status, 200);
    assert.equal((await request('health', 'GET', null, { Origin: 'https://evil.example' })).status, 403);
    assert.equal((await request('draft', 'POST', input(), { 'X-America-Request': '' })).status, 403);
    assert.equal((await fetch(base + '/private/companion/workspace.json', { headers })).status, 404);
    assert.equal((await fetch(base + '/%2e%2e%2fREADME.md', { headers })).status, 404);
    const bundle = { format: 'america-workspace-v1', data: { profile: { name: 'Test' }, jobs: {}, drafts: {}, answers: {} } };
    const saved = await (await request('workspace', 'PUT', bundle)).json();assert(saved.revision);
    const restored = await (await request('workspace')).json();assert.equal(restored.workspace.data.profile.name, 'Test');
    assert.equal((await request('workspace', 'PUT', bundle)).status, 400);
    assert.equal((await request('workspace', 'PUT', { ...bundle, baseRevision: saved.revision })).status, 200);
    assert.equal((await request('workspace', 'PUT', { format: 'bad' })).status, 400);
    const first = await (await request('draft', 'POST', input())).json();assert(first.id);
    let result;for (let i = 0; i < 20; i++) { result = await (await request('tasks/' + first.id)).json(); if (result.status === 'completed') break; await new Promise(resolve => setTimeout(resolve, 10)); }
    assert.equal(result.status, 'completed');
    assert.equal((await (await request('draft', 'POST', input())).json()).id, first.id);assert.equal(calls, 1);
    const waiting = input();waiting.job.id = 'wait';await request('draft', 'POST', waiting);
    const queued = input();queued.job.id = 'queued';const t = await (await request('draft', 'POST', queued)).json();
    const cancelled = await (await request('tasks/' + t.id, 'DELETE', {})).json();assert.equal(cancelled.status, 'failed');
    release();
    assert.equal(JSON.parse(await readFile(join(dataDir, 'usage.json'), 'utf8')).runs, 3);
  } finally { release();await app.close();await rm(dataDir, { recursive: true, force: true }); }
});

test('workspace validation rejects broken submission references', () => {
  assert.throws(() => validateWorkspace({ format: 'america-workspace-v1', data: { profile: { name: 'Test' }, jobs: {}, answers: {}, drafts: { bad: { jobId: 'missing', fields: [] } } } }));
});
