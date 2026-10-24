import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { contrastRatio, loadThemes, over, parseColor, resolve, toHex } from './tokens-lib.mjs';

test('parseColor handles hex and rgb syntaxes', () => {
  assert.deepEqual(parseColor('#fff'), { r: 255, g: 255, b: 255, a: 1 });
  assert.deepEqual(parseColor('#017D54'), { r: 1, g: 125, b: 84, a: 1 });
  assert.deepEqual(parseColor('rgb(52 201 151 / 0.16)'), { r: 52, g: 201, b: 151, a: 0.16 });
  assert.deepEqual(parseColor('rgba(0, 0, 0, 50%)'), { r: 0, g: 0, b: 0, a: 0.5 });
  assert.equal(parseColor('var(--x)'), null);
});

test('contrast ratio matches WCAG reference values', () => {
  const black = parseColor('#000');
  const white = parseColor('#fff');
  assert.equal(contrastRatio(black, white).toFixed(2), '21.00');
  assert.equal(contrastRatio(white, white).toFixed(2), '1.00');
});

test('translucent colours composite over the backdrop', () => {
  const result = over(parseColor('rgb(0 0 0 / 0.5)'), parseColor('#ffffff'));
  assert.equal(toHex(result), '#808080');
});

test('resolve follows chains and rejects missing or cyclic tokens', () => {
  assert.equal(resolve({ '--a': 'var(--b)', '--b': '#fff' }, '--a'), '#fff');
  assert.throws(() => resolve({}, '--missing'), /Missing token/);
  assert.throws(() => resolve({ '--a': 'var(--b)', '--b': 'var(--a)' }, '--a'), /cycle/);
});

test('every semantic colour resolves in both themes', () => {
  const { light, dark } = loadThemes();
  for (const vars of [light, dark]) {
    for (const name of Object.keys(vars).filter((n) => n.startsWith('--color-'))) {
      assert.doesNotThrow(() => resolve(vars, name), name);
    }
  }
});

test('generated files are up to date with tokens.css', () => {
  const script = fileURLToPath(new URL('./gen-native-tokens.mjs', import.meta.url));
  const run = spawnSync(process.execPath, [script, '--check'], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
});
