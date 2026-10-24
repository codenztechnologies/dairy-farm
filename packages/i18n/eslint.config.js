import { base, nodeScripts, tests, ui } from '@dairy/config/eslint';

export default [
  ...base({ tsconfigRootDir: import.meta.dirname }),
  ...ui(),
  ...tests(),
  ...nodeScripts(),
];
