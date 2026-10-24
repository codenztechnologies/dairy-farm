// Quiet verification runner: one line per step, full output only for failures.
// Full logs are kept in .verify-logs/ for inspection. Exits non-zero if any step fails.
// Add new gates to STEPS (and FULL_STEPS for slower ones); never remove a gate to make it pass.
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const STEPS = [
  { name: 'contrast', cmd: 'pnpm', args: ['check:contrast'] },
  { name: 'format', cmd: 'pnpm', args: ['format:check'] },
  { name: 'lint', cmd: 'pnpm', args: ['lint'] },
  { name: 'typecheck', cmd: 'pnpm', args: ['typecheck'] },
  { name: 'unit tests', cmd: 'pnpm', args: ['test'] },
];

// Slower gates, run with `pnpm verify:full` and in CI (added as they come into existence):
// integration + RLS leak suite, build, e2e.
const FULL_STEPS = [];

const full = process.argv.includes('--full');
const steps = full ? [...STEPS, ...FULL_STEPS] : STEPS;
const LOG_DIR = '.verify-logs';
const TAIL_LINES = 60;

mkdirSync(LOG_DIR, { recursive: true });

let failed = 0;
for (const step of steps) {
  const started = Date.now();
  const result = spawnSync(step.cmd, step.args, { encoding: 'utf8', shell: true });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  const logFile = `${LOG_DIR}/${step.name.replaceAll(' ', '-')}.log`;
  writeFileSync(logFile, output);

  if (result.status === 0) {
    console.log(`PASS  ${step.name} (${seconds}s)`);
    continue;
  }

  failed += 1;
  console.log(`FAIL  ${step.name} (${seconds}s) -> ${logFile}`);
  const tail = output.trimEnd().split('\n').slice(-TAIL_LINES).join('\n');
  console.log(tail);
}

console.log(failed === 0 ? '\nverify: all gates passed' : `\nverify: ${failed} gate(s) failed`);
process.exit(failed === 0 ? 0 : 1);
