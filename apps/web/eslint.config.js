import { base, nodeScripts, tests, ui } from '@dairy/config/eslint';

export default [
  { ignores: ['next-env.d.ts', '.next/**'] },
  ...base({ tsconfigRootDir: import.meta.dirname }),
  ...ui(),
  ...tests(),
  ...nodeScripts(),
];
