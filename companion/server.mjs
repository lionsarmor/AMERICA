import http from 'node:http';
import { readFile, writeFile, mkdir, rename, stat, realpath } from 'node:fs/promises';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { loginStatus } from './runtime.mjs';
import { normalizeRequest, digest, reason } from './reasoner.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = (res, status, body) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
export function validateWorkspace(bundle) {
  const d = bundle?.data;
  if (bundle?.format !== 'america-workspace-v1' || !d?.profile || typeof d.profile.name !== 'string' || !d.jobs || !d.drafts || !d.answers || Array.isArray(d.jobs) || Array.isArray(d.drafts)) throw new Error('Choose an AMERICA workspace backup.');
  for (const draft of Object.values(d.drafts)) if (!d.jobs[draft.jobId] || !Array.isArray(draft.fields) || !draft.values || !Array.isArray(draft.missing)) throw new Error('A saved application is incomplete.');
  if (JSON.stringify(bundle).includes('"__proto__"')) throw new Error('Invalid workspace keys.');
  return bundle;
}
export async function createCompanion({ port = Number(process.env.AMERICA_PORT || 4317), dataDir = resolve(root, 'private/companion'), reasoner = reason, authenticate = loginStatus } = {}) {
  await mkdir(dataDir, { recursive: true, mode: 0o700 });
  const workDir = resolve(dataDir, 'reasoning');
  await mkdir(workDir, { recursive: true, mode: 0o700 });
  const session = randomBytes(32).toString('hex'), tasks = new Map(), cache = new Map();
  const previousRun=JSON.parse(await readFile(resolve(dataDir,'last-run.json'),'utf8').catch(()=>'null'));
  if(previousRun?.key&&previousRun.result)cache.set(previousRun.key,previousRun.result);
  const usageFile = resolve(dataDir, 'usage.json');
  let usage = JSON.parse(await readFile(usageFile, 'utf8').catch(() => '{}')), pendingWrites = Promise.resolve(), running = false, auth = null, authAt = 0, stopping = false;
  const atomic = (name, value) => {
    const operation = async () => { const target = resolve(dataDir, name), tmp = target + '.tmp'; const output = typeof value === 'function' ? await value() : value; await writeFile(tmp, JSON.stringify(output), { mode: 0o600 }); await rename(tmp, target); };
    pendingWrites = pendingWrites.catch(() => {}).then(operation); return pendingWrites;
  };
  const getAuth = async () => { if (!auth || Date.now() - authAt > 30000) { auth = await authenticate(); authAt = Date.now(); } return auth; };
  const readBody = async req => {
    const chunks = []; let size = 0;
    for await (const chunk of req) { size += chunk.length; if (size > 45 * 1024 * 1024) throw new Error('This workspace exceeds the 45 MB transfer limit.'); chunks.push(chunk); }
    try { return JSON.parse(Buffer.concat(chunks).toString()); } catch { throw new Error('Request must contain valid JSON.'); }
  };
  const runNext = async () => {
    if (running || stopping) return;
    const task = [...tasks.values()].find(t => t.status === 'queued'); if (!task) return;
    running = true; task.status = 'running'; task.controller = new AbortController();
    const timeout = setTimeout(() => task.controller.abort(), 180000);
    try { task.result = await reasoner(task.request, { workingDirectory: workDir, signal: task.controller.signal }); task.status = 'completed'; cache.set(task.key, task.result); while(cache.size>128)cache.delete(cache.keys().next().value); await atomic('last-run.json', { at: Date.now(), key: task.key, result: task.result }); }
    catch (error) { task.status = 'failed'; task.error = error.name === 'AbortError' ? 'Drafting was cancelled or timed out. You can retry.' : 'Codex could not complete this draft. Check Codex sign-in, account limits, and connection, then retry.'; }
    finally { clearTimeout(timeout); delete task.request; delete task.controller; task.finishedAt = Date.now(); running = false; void runNext(); }
  };
  const publicTask = task => ({ id: task.id, status: task.status, result: task.result, error: task.error, cached: !!task.cached });
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'no-referrer'); res.setHeader('X-Frame-Options', 'DENY');
    const host = req.headers.host;
    if (host !== `127.0.0.1:${server.address().port}` && host !== `localhost:${server.address().port}`) return json(res, 403, { error: 'Use the local AMERICA address.' });
    const origin = `http://${host}`;
    if ((req.headers.origin && req.headers.origin !== origin) || req.headers['sec-fetch-site'] === 'cross-site' && req.headers['sec-fetch-mode'] !== 'navigate') return json(res, 403, { error: 'Open AMERICA directly on this computer.' });
    let url; try { url = new URL(req.url, origin); } catch { return json(res, 400, { error: 'Invalid URL.' }); }
    try {
      if (url.pathname.startsWith('/api/')) {
        if (!(req.headers.cookie || '').split(';').some(c => c.trim() === `america_session=${session}`)) return json(res, 401, { error: 'Open the private AMERICA workspace first.' });
        if (!['GET', 'HEAD'].includes(req.method) && (req.headers.origin !== origin || req.headers['x-america-request'] !== '1' || !req.headers['content-type']?.startsWith('application/json'))) return json(res, 403, { error: 'A same-origin application request is required.' });
        if (url.pathname === '/api/health' && req.method === 'GET') return json(res, 200, { app: 'america-companion', version: 1, ...await getAuth(), active: [...tasks.values()].filter(t => ['queued', 'running'].includes(t.status)).length });
        if (url.pathname === '/api/workspace' && req.method === 'GET') {
          const saved = await readFile(resolve(dataDir, 'workspace.json'), 'utf8').catch(() => 'null'); const workspace = JSON.parse(saved); return json(res, 200, { workspace, revision: workspace?.storageRevision || null });
        }
        if (url.pathname === '/api/workspace' && req.method === 'PUT') { const value = validateWorkspace(await readBody(req)), revision = randomBytes(16).toString('hex'); await atomic('workspace.json', async () => { const current = JSON.parse(await readFile(resolve(dataDir, 'workspace.json'), 'utf8').catch(() => 'null')); if ((current?.storageRevision || null) !== (value.baseRevision || null)) throw new Error('Another window has a newer backup. Restore it or choose this browser version.'); const { baseRevision, ...bundle } = value; return { ...bundle, storageRevision: revision }; }); return json(res, 200, { savedAt: Date.now(), revision }); }
        if (url.pathname === '/api/draft' && req.method === 'POST') {
          if (!(await getAuth()).signedIn) return json(res, 409, { error: 'Codex is not signed in on this computer. Run codex login, then reconnect.' });
          const request = normalizeRequest(await readBody(req)); if (!request.fields.length) return json(res, 400, { error: 'No unanswered questions are available for reasoning.' });
          const key = digest(request), previous = [...tasks.values()].find(t => t.key === key && ['queued', 'running', 'completed'].includes(t.status));
          if (previous) return json(res, 200, publicTask(previous));
          const day = new Intl.DateTimeFormat('en-CA',{timeZone:process.env.AMERICA_TIME_ZONE||'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); if (usage.day !== day) usage = { day, runs: 0 };
          if (!cache.has(key) && usage.runs >= 24) return json(res, 429, { error: 'The companion has reached its 24-draft daily limit. Existing results and manual editing remain available.' });
          if(!cache.has(key))usage.runs++; await atomic('usage.json', usage);
          for (const [id, task] of tasks) if (tasks.size > 100 && ['completed', 'failed'].includes(task.status)) tasks.delete(id);
          const task = { id: randomBytes(16).toString('hex'), key, request, status: cache.has(key) ? 'completed' : 'queued', result: cache.get(key), cached: cache.has(key) }; tasks.set(task.id, task); void runNext(); return json(res, 202, publicTask(task));
        }
        if (url.pathname.startsWith('/api/tasks/')) {
          const task = tasks.get(url.pathname.slice('/api/tasks/'.length)); if (!task) return json(res, 404, { error: 'This task is no longer available. Start it again.' });
          if (req.method === 'DELETE') { if (task.status === 'queued') { task.status = 'failed'; task.error = 'Cancelled.'; delete task.request; } else task.controller?.abort(); return json(res, 200, publicTask(task)); }
          if (req.method === 'GET') return json(res, 200, publicTask(task));
        }
        return json(res, 404, { error: 'Unknown companion operation.' });
      }
      if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: 'Method not allowed.' });
      const site = resolve(root, 'site'), requested = resolve(site, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
      if (!requested.startsWith(site + sep) || !(await realpath(requested)).startsWith(site + sep) || !(await stat(requested)).isFile()) return json(res, 404, { error: 'File not found.' });
      if (url.pathname === '/' || url.pathname === '/index.html') res.setHeader('Set-Cookie', `america_session=${session}; HttpOnly; SameSite=Strict; Path=/`);
      res.writeHead(200, { 'Content-Type': mime[extname(requested)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(req.method === 'HEAD' ? undefined : await readFile(requested));
    } catch (error) { return json(res, error.code === 'ENOENT' ? 404 : 400, { error: error.code === 'ENOENT' ? 'File not found.' : error.message.slice(0, 300) }); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  return { server, port: server.address().port, close: async () => { stopping = true; for (const task of tasks.values()) task.controller?.abort(); await pendingWrites.catch(() => {}); await new Promise(resolve => server.close(resolve)); } };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const app = await createCompanion();
  console.log(`AMERICA private workspace: http://127.0.0.1:${app.port}/#intelligence`);
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => app.close().then(() => process.exit(0)));
}
