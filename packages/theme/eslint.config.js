import { base, nodeScripts } from '@dairy/config/eslint';

export default [...base({ tsconfigRootDir: import.meta.dirname }), ...nodeScripts()];
