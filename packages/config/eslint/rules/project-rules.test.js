import { test } from 'node:test';
import { RuleTester } from 'eslint';
import plugin from '../plugin.js';

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

test('dairy/no-hardcoded-colors', () => {
  tester.run('no-hardcoded-colors', plugin.rules['no-hardcoded-colors'], {
    valid: [
      "const c = 'var(--color-primary)';",
      "const c = 'text-primary bg-surface';",
      "const url = '/page#section';",
      "const entity = '&#123;';",
      "const anchor = '#bad-anchor';",
      'const c = `var(--chart-${n})`;',
    ],
    invalid: [
      { code: "const c = '#fff';", errors: [{ messageId: 'color' }] },
      { code: "const c = '#017D54';", errors: [{ messageId: 'color' }] },
      { code: "const c = '#017D54cc';", errors: [{ messageId: 'color' }] },
      { code: "const c = 'rgb(0, 0, 0)';", errors: [{ messageId: 'color' }] },
      { code: "const c = 'oklch(60% 0.1 150)';", errors: [{ messageId: 'color' }] },
      { code: 'const c = `border: 1px solid #ddd`;', errors: [{ messageId: 'color' }] },
      { code: "const s = <div style={{ color: '#000000' }} />;", errors: [{ messageId: 'color' }] },
    ],
  });
});

test('dairy/no-direct-fetch', () => {
  tester.run('no-direct-fetch', plugin.rules['no-direct-fetch'], {
    valid: ['client.get("/v1/animals");', 'const f = obj.fetch(1);', 'fetcher();'],
    invalid: [
      { code: "fetch('/x');", errors: [{ messageId: 'fetch' }] },
      { code: "window.fetch('/x');", errors: [{ messageId: 'fetch' }] },
      { code: "globalThis.fetch('/x');", errors: [{ messageId: 'fetch' }] },
      { code: 'new XMLHttpRequest();', errors: [{ messageId: 'xhr' }] },
    ],
  });
});

test('dairy/no-physical-css', () => {
  tester.run('no-physical-css', plugin.rules['no-physical-css'], {
    valid: [
      '<div className="ms-2 me-4 ps-3 pe-3 text-start" />',
      '<div className="start-0 end-0 rounded-s-md border-e" />',
      "const x = cn('flex gap-2', cond && 'ms-2');",
      "const prose = 'left-hand side of the screen';",
      "const style = { marginInlineStart: 4, textAlign: 'start' };",
      'const p = { left: 1, right: 2 };',
    ],
    invalid: [
      { code: '<div className="ml-2" />', errors: [{ messageId: 'cls' }] },
      { code: '<div className="flex md:pr-4" />', errors: [{ messageId: 'cls' }] },
      { code: '<div className="hover:-ml-2" />', errors: [{ messageId: 'cls' }] },
      { code: '<div className="text-left" />', errors: [{ messageId: 'cls' }] },
      { code: '<div className="absolute left-0" />', errors: [{ messageId: 'cls' }] },
      { code: '<div className="rounded-l-md" />', errors: [{ messageId: 'cls' }] },
      { code: '<div className="border-r" />', errors: [{ messageId: 'cls' }] },
      { code: "const x = cn('flex', cond && 'mr-2');", errors: [{ messageId: 'cls' }] },
      { code: 'const x = { marginLeft: 4 };', errors: [{ messageId: 'key' }] },
      { code: "const x = { textAlign: 'right' };", errors: [{ messageId: 'align' }] },
    ],
  });
});

test('dairy/no-hardcoded-text', () => {
  tester.run('no-hardcoded-text', plugin.rules['no-hardcoded-text'], {
    valid: [
      '<p>{t("animals.empty")}</p>',
      '<Input placeholder={t("common.search")} />',
      '<span>•</span>',
      '<span> / </span>',
      '<img alt="" src={src} />',
      '<Input type="email" name="email" />',
    ],
    invalid: [
      { code: '<p>No animals yet</p>', errors: [{ messageId: 'text' }] },
      { code: '<Text>Save</Text>', errors: [{ messageId: 'text' }] },
      { code: '<Input placeholder="Search" />', errors: [{ messageId: 'attr' }] },
      { code: '<button aria-label="Close" />', errors: [{ messageId: 'attr' }] },
      { code: '<img alt="Cow" src={s} />', errors: [{ messageId: 'attr' }] },
      { code: '<p>ٹیگ نمبر</p>', errors: [{ messageId: 'text' }] },
    ],
  });
});
