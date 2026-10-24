// Contrast gate for packages/theme/tokens.css (run in CI: `pnpm check:contrast`, part of `pnpm verify`).
// Resolves var() references per theme and checks the semantic pairs below against WCAG 2.2.
// Text pairs need 4.5:1, UI/graphic pairs need 3:1.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const css = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'tokens.css'), 'utf8');

function blockVars(selectorPattern) {
  const vars = {};
  const re = new RegExp(`(?:^|\\n)(${selectorPattern})\\s*\\{([\\s\\S]*?)\\n\\}`, 'g');
  for (const m of css.matchAll(re)) {
    for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[d[1]] = d[2].trim();
  }
  return vars;
}

const root = blockVars(':root');
const light = { ...root, ...blockVars(`:root,\\s*\\[data-theme=["']light["']\\]`) };
const dark = { ...light, ...blockVars(`\\[data-theme=["']dark["']\\]`) };

function resolve(vars, name, depth = 0) {
  let v = vars[name];
  if (v === undefined) throw new Error(`Missing token ${name}`);
  const ref = v.match(/^var\((--[\w-]+)\)$/);
  if (ref && depth < 10) return resolve(vars, ref[1], depth + 1);
  return v;
}

function rgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}
function lum(hex) {
  const [r, g, b] = rgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// [foreground, background, minimum ratio]
const pairs = [
  ['--color-text', '--color-bg', 4.5],
  ['--color-text', '--color-surface', 4.5],
  ['--color-text-muted', '--color-bg', 4.5],
  ['--color-text-muted', '--color-surface', 4.5],
  ['--color-text-subtle', '--color-surface', 4.5],
  ['--color-text-link', '--color-bg', 4.5],
  ['--color-on-primary', '--color-primary', 4.5],
  ['--color-on-accent', '--color-accent', 4.5],
  ['--color-primary', '--color-bg', 4.5],
  ['--color-accent', '--color-bg', 4.5],
  ['--color-danger', '--color-bg', 4.5],
  ['--color-danger', '--color-danger-soft', 4.5],
  ['--color-warning', '--color-bg', 4.5],
  ['--color-warning', '--color-warning-soft', 4.5],
  ['--color-success', '--color-success-soft', 4.5],
  ['--color-info', '--color-bg', 4.5],
  ['--color-nav-active-text', '--color-nav-active-bg', 4.5],
  ['--color-status-lactating', '--color-status-lactating-soft', 4.5],
  ['--color-status-dry', '--color-status-dry-soft', 4.5],
  ['--color-status-pregnant', '--color-status-pregnant-soft', 4.5],
  ['--color-status-sick', '--color-status-sick-soft', 4.5],
  ['--color-status-calf', '--color-status-calf-soft', 4.5],
  ['--color-status-inactive', '--color-status-inactive-soft', 4.5],
  ['--color-text-link', '--color-surface', 4.5],
  ['--color-accent', '--color-bg', 4.5],
  ['--tint-green-fg', '--tint-green-bg', 3],
  ['--tint-blue-fg', '--tint-blue-bg', 3],
  ['--tint-amber-fg', '--tint-amber-bg', 3],
  ['--tint-violet-fg', '--tint-violet-bg', 3],
  ['--tint-rose-fg', '--tint-rose-bg', 3],
  ['--tint-slate-fg', '--tint-slate-bg', 3],
  ['--chart-session-morning', '--color-surface', 3],
  ['--chart-session-noon', '--color-surface', 3],
  ['--chart-session-evening', '--color-surface', 3],
  ['--color-border-input', '--color-bg', 3],
  ['--color-border-input', '--color-surface', 3],
  ['--color-focus-ring', '--color-bg', 3],
  ...[1, 2, 3, 4, 5, 6].map((n) => [`--chart-${n}`, '--color-surface', 3]),
];

let failed = 0;
for (const [name, vars] of [
  ['light', light],
  ['dark', dark],
]) {
  for (const [fg, bg, min] of pairs) {
    // Soft backgrounds in dark mode are translucent rgb(); they are checked visually in Storybook.
    let f, b;
    try {
      f = resolve(vars, fg);
      b = resolve(vars, bg);
    } catch (e) {
      console.error(`ERROR ${name}: ${e.message}`);
      failed++;
      continue;
    }
    if (!/^#[0-9a-f]{6}$/i.test(f) || !/^#[0-9a-f]{6}$/i.test(b)) continue;
    const r = ratio(f, b);
    const ok = r >= min;
    if (!ok) failed++;
    console.log(
      `${ok ? 'pass' : 'FAIL'} ${name.padEnd(5)} ${r.toFixed(2).padStart(5)} (min ${min})  ${fg} on ${bg}`,
    );
  }
}
if (failed) {
  console.error(`\n${failed} contrast check(s) failed.`);
  process.exit(1);
}
console.log('\nAll contrast checks passed.');
