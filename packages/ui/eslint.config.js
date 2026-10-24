import { base, nodeScripts, stories, tests, ui } from '@dairy/config/eslint';

export default [
  ...base({ tsconfigRootDir: import.meta.dirname }),
  ...ui(),
  ...tests(),
  ...stories(),
  ...nodeScripts(),
];
