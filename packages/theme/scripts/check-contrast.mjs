// Contrast gate for packages/theme/tokens.css (run in CI: `pnpm check:contrast`, part of `pnpm verify`).
// Resolves var() references per theme and checks the semantic pairs below against WCAG 2.2.
// Text pairs need 4.5:1, UI/graphic pairs need 3:1.
import { contrastRatio, loadThemes, over, parseColor, resolve } from './tokens-lib.mjs';

const { light, dark } = loadThemes();

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
  // Text used by shared components on their actual backgrounds (banners, avatar, danger button, hover states).
  ['--color-text', '--color-info-soft', 4.5],
  ['--color-text', '--color-success-soft', 4.5],
  ['--color-text', '--color-warning-soft', 4.5],
  ['--color-text', '--color-danger-soft', 4.5],
  ['--color-info', '--color-info-soft', 4.5],
  ['--color-nav-active-text', '--color-primary-soft', 4.5],
  ['--color-text-muted', '--color-bg-sunken', 4.5],
  ['--color-text', '--color-bg-sunken', 4.5],
  ['--color-text-inverse', '--color-danger', 4.5],
  ['--color-text-inverse', '--color-danger-hover', 4.5],
  ['--color-on-primary', '--color-primary-hover', 4.5],
  ['--color-on-primary', '--color-primary-active', 4.5],
  ['--color-danger', '--color-surface', 4.5],
  ['--color-success', '--color-surface', 4.5],
  ['--color-text-subtle', '--color-bg-sunken', 4.5],
  ['--tint-green-fg', '--tint-green-bg', 4.5],
  ['--tint-blue-fg', '--tint-blue-bg', 4.5],
  ['--tint-amber-fg', '--tint-amber-bg', 4.5],
  ['--tint-violet-fg', '--tint-violet-bg', 4.5],
  ['--tint-rose-fg', '--tint-rose-bg', 4.5],
  ['--tint-slate-fg', '--tint-slate-bg', 4.5],
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
  // Translucent colours are composited over the page surface so dark-mode tints are checked too.
  const base = parseColor(resolve(vars, '--color-surface'));
  for (const [fg, bg, min] of pairs) {
    let fgColor;
    let bgColor;
    try {
      bgColor = parseColor(resolve(vars, bg));
      fgColor = parseColor(resolve(vars, fg));
    } catch (e) {
      console.error(`ERROR ${name}: ${e.message}`);
      failed++;
      continue;
    }
    if (!base || !bgColor || !fgColor) {
      console.error(`ERROR ${name}: cannot parse colour for ${fg} on ${bg}`);
      failed++;
      continue;
    }
    const solidBg = over(bgColor, base);
    const ratio = contrastRatio(over(fgColor, solidBg), solidBg);
    const ok = ratio >= min;
    if (!ok) failed++;
    console.log(
      `${ok ? 'pass' : 'FAIL'} ${name.padEnd(5)} ${ratio.toFixed(2).padStart(5)} (min ${min})  ${fg} on ${bg}`,
    );
  }
}
if (failed) {
  console.error(`\n${failed} contrast check(s) failed.`);
  process.exit(1);
}
console.log('\nAll contrast checks passed.');
