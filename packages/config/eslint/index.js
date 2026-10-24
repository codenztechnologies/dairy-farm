// Shared flat ESLint config. Packages use it from their own eslint.config.js:
//   import { base, ui, tests } from '@dairy/config/eslint';
//   export default [...base(), ...ui()];
// Rules referenced here are documented in docs/14-conventions.md and CLAUDE.md.
import js from '@eslint/js';
import importX from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import dairy from './plugin.js';

const TS_FILES = ['**/*.{ts,tsx,mts,cts}'];
const UI_FILES = ['**/*.{jsx,tsx}'];

export const ignores = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.next/**',
  '**/.turbo/**',
  '**/coverage/**',
  '**/storybook-static/**',
  '**/playwright-report/**',
  '**/test-results/**',
  '**/.expo/**',
  '**/*.generated.*',
  '.claude/skills/**',
  '**/tokens.native.ts',
];

/**
 * Rules for every package: strict TypeScript, import hygiene, safe defaults,
 * and the project rule that network calls only go through @dairy/api-client.
 * @param {{ tsconfigRootDir?: string }} [options]
 */
export function base(options = {}) {
  return tseslint.config(
    { ignores },
    js.configs.recommended,
    {
      files: TS_FILES,
      extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
      languageOptions: {
        parserOptions: {
          projectService: true,
          ...(options.tsconfigRootDir ? { tsconfigRootDir: options.tsconfigRootDir } : {}),
        },
      },
      rules: {
        '@typescript-eslint/ban-ts-comment': [
          'error',
          {
            'ts-expect-error': 'allow-with-description',
            'ts-ignore': true,
            'ts-nocheck': true,
            minimumDescriptionLength: 10,
          },
        ],
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
        ],
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/switch-exhaustiveness-check': 'error',
        '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      },
    },
    {
      plugins: { 'import-x': importX, unicorn, dairy },
      languageOptions: { globals: { ...globals.es2023 } },
      rules: {
        eqeqeq: ['error', 'always'],
        'no-console': ['error', { allow: ['warn', 'error'] }],
        'no-restricted-syntax': [
          'error',
          {
            selector: "CallExpression[callee.name='eval']",
            message: 'eval is forbidden (docs/05).',
          },
        ],
        'import-x/first': 'error',
        'import-x/no-duplicates': 'error',
        'import-x/order': [
          'error',
          {
            groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
            'newlines-between': 'never',
            alphabetize: { order: 'asc', caseInsensitive: true },
          },
        ],
        'unicorn/prefer-node-protocol': 'error',
        'unicorn/prefer-string-replace-all': 'error',
        'unicorn/prefer-includes': 'error',
        'unicorn/prefer-array-find': 'error',
        'unicorn/throw-new-error': 'error',
        'unicorn/no-instanceof-builtins': 'error',
        'dairy/no-direct-fetch': 'error',
      },
    },
  );
}

/**
 * Extra rules for code that renders UI (web, mobile, packages/ui):
 * tokens-only colours, i18n-only text, logical (RTL-safe) CSS, accessibility and hooks correctness.
 */
export function ui() {
  return [
    { files: UI_FILES, ...jsxA11y.flatConfigs.strict },
    { files: UI_FILES, ...reactHooks.configs.flat['recommended-latest'] },
    {
      files: UI_FILES,
      plugins: { dairy },
      languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
      rules: {
        'dairy/no-hardcoded-colors': 'error',
        'dairy/no-hardcoded-text': 'error',
        'dairy/no-physical-css': 'error',
      },
    },
  ];
}

/** Relaxations that are legitimate for test files only. Security and tenancy rules stay on. */
export function tests() {
  return [
    {
      files: [
        '**/*.{test,spec}.{ts,tsx,js}',
        '**/*.stories.{ts,tsx}',
        '**/.storybook/**',
        '**/tests/**',
        '**/e2e/**',
      ],
      rules: {
        'dairy/no-hardcoded-text': 'off',
        'dairy/no-hardcoded-colors': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  ];
}

/** Storybook stories keep demo state inside `render`, which is the normal pattern there. */
export function stories() {
  return [
    {
      files: ['**/*.stories.{ts,tsx}', '**/.storybook/**'],
      rules: { 'react-hooks/rules-of-hooks': 'off' },
    },
  ];
}

/** Node scripts and plain config files (JS, no type information). */
export function nodeScripts() {
  return [
    {
      files: ['**/*.{js,mjs,cjs}'],
      ...tseslint.configs.disableTypeChecked,
      languageOptions: {
        ...tseslint.configs.disableTypeChecked.languageOptions,
        globals: { ...globals.node },
      },
      rules: {
        ...tseslint.configs.disableTypeChecked.rules,
        'no-console': 'off',
      },
    },
  ];
}
