// Root config: covers plain JS (scripts/, packages without their own config such as theme).
// Packages with TypeScript define their own eslint.config.js using @dairy/config/eslint.
import { base, nodeScripts } from './packages/config/eslint/index.js';

export default [...base(), ...nodeScripts()];
