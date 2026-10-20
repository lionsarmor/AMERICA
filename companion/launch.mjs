import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const exec=promisify(execFile);
await exec('systemctl',['--user','start','america-companion.service']);
await exec('xdg-open',['http://127.0.0.1:4317/#intelligence']);
