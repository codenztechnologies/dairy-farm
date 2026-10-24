import { base, nodeScripts, tests } from '@dairy/config/eslint';

export default [...base({ tsconfigRootDir: import.meta.dirname }), ...tests(), ...nodeScripts()];
