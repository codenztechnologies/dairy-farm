import { base, nodeScripts } from './eslint/index.js';

export default [...base({ tsconfigRootDir: import.meta.dirname }), ...nodeScripts()];
