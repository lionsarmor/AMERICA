import { access, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
export async function findCodex() {
  const candidates = process.env.AMERICA_CODEX_BIN ? [process.env.AMERICA_CODEX_BIN] : (process.env.PATH || '').split(':').map(dir => join(dir, 'codex'));
  if (!process.env.AMERICA_CODEX_BIN) {
    const extensions = join(homedir(), '.vscode/extensions');
    for (const name of (await readdir(extensions).catch(() => [])).filter(name => name.startsWith('openai.chatgpt-')).sort().reverse()) candidates.push(join(extensions, name, 'bin/linux-x86_64/codex'));
  }
  for (const path of candidates) try { await access(path, constants.X_OK); return path; } catch {}
  return null;
}
export async function loginStatus() {
  const binary = await findCodex();
  if (!binary) return { installed: false, signedIn: false, message: 'Install Codex on this computer to enable intelligent drafts.' };
  try {
    const { stdout, stderr } = await exec(binary, ['login', 'status'], { timeout: 8000, maxBuffer: 32768 });
    const signedIn = /logged in|authenticated|signed in/i.test(stdout + stderr);
    return { installed: true, signedIn, message: signedIn ? 'Codex is signed in on this computer.' : 'Run codex login on this computer.' };
  } catch { return { installed: true, signedIn: false, message: 'Codex needs sign-in. Run codex login on this computer.' }; }
}
