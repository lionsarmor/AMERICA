// Optional personal Linux setup: no root access, tokens, or account changes.
import { mkdir, writeFile, chmod } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec=promisify(execFile),root=fileURLToPath(new URL('../',import.meta.url));
const quote=value=>'"'+value.replaceAll('\\','\\\\').replaceAll('"','\\"').replaceAll('%','%%')+'"';
const services=join(homedir(),'.config/systemd/user');await mkdir(services,{recursive:true});
await writeFile(join(services,'america-companion.service'),`[Unit]\nDescription=Jobbies private Codex companion\nAfter=network.target\n\n[Service]\nType=simple\nWorkingDirectory=${root.replaceAll('%','%%')}\nExecStart=${quote(process.execPath)} ${quote(resolve(root,'companion/server.mjs'))}\nEnvironment=NODE_ENV=production\nUMask=0077\nRestart=on-failure\nRestartSec=5\n\n[Install]\nWantedBy=default.target\n`);
await exec('systemctl',['--user','daemon-reload']);await exec('systemctl',['--user','enable','--now','america-companion.service']);
const desktop=join(homedir(),'Desktop/lionsarmor');await mkdir(desktop,{recursive:true});
const launcher=join(desktop,'Jobbies Private.desktop');
await writeFile(launcher,`[Desktop Entry]\nType=Application\nName=Jobbies Private\nComment=Your private job workspace with Codex drafting\nExec=${quote(process.execPath)} ${quote(resolve(root,'companion/launch.mjs'))}\nPath=${root}\nTerminal=false\nIcon=applications-internet\nCategories=Office;\n`);await chmod(launcher,0o755);
console.log('Jobbies companion enabled for this user. Open http://127.0.0.1:4317/#intelligence or Jobbies Private on the desktop.');
