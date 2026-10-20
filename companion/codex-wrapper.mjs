#!/usr/bin/env node
// Keep authentication in Codex while excluding unrelated user tools/configuration.
import { spawn } from 'node:child_process';
import { findCodex } from './runtime.mjs';
const binary = await findCodex();
if (!binary) { process.stderr.write('Codex is not installed.\n'); process.exit(1); }
const args = process.argv.slice(2).map(arg => arg === '--experimental-json' ? '--json' : arg);
args.splice(1, 0, '--ignore-user-config', '--ephemeral');
const child = spawn(binary, args, { stdio: 'inherit', env: process.env });
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => child.kill(signal));
child.on('error', () => process.exit(1));
child.on('exit', code => process.exit(code ?? 1));
