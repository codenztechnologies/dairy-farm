// CI gate (docs/11 section 1): en and ur must have identical keys and identical ICU variables.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const LOCALES_DIR = fileURLToPath(new URL('../locales', import.meta.url));
const SOURCE = 'en';

function flatten(object, prefix = '') {
  const out = {};
  for (const [key, value] of Object.entries(object)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out[path] = value;
    else Object.assign(out, flatten(value, path));
  }
  return out;
}

/** Variable names used by an ICU message, e.g. "{count, plural, ...}" -> count. */
function variables(message) {
  const names = new Set();
  for (const m of message.matchAll(/\{\s*([A-Za-z_][\w]*)\s*[,}]/g)) names.add(m[1]);
  return [...names].sort();
}

function load(locale) {
  const dir = join(LOCALES_DIR, locale);
  const out = {};
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const namespace = file.replace('.json', '');
    const flat = flatten(JSON.parse(readFileSync(join(dir, file), 'utf8')));
    for (const [key, value] of Object.entries(flat)) out[`${namespace}:${key}`] = value;
  }
  return out;
}

const locales = readdirSync(LOCALES_DIR).filter((l) => l !== SOURCE);
const source = load(SOURCE);

for (const locale of locales) {
  const target = load(locale);

  test(`${locale} has exactly the keys of ${SOURCE}`, () => {
    const missing = Object.keys(source).filter((k) => !(k in target));
    const extra = Object.keys(target).filter((k) => !(k in source));
    assert.deepEqual({ missing, extra }, { missing: [], extra: [] });
  });

  test(`${locale} uses the same placeholders as ${SOURCE}`, () => {
    const mismatches = Object.keys(source)
      .filter((k) => k in target)
      .filter((k) => variables(source[k]).join() !== variables(target[k]).join())
      .map((k) => k);
    assert.deepEqual(mismatches, []);
  });

  test(`${locale} has no empty strings`, () => {
    assert.deepEqual(
      Object.entries(target)
        .filter(([, v]) => v.trim() === '')
        .map(([k]) => k),
      [],
    );
  });
}
