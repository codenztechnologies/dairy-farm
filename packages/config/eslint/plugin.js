import noDirectFetch from './rules/no-direct-fetch.js';
import noHardcodedColors from './rules/no-hardcoded-colors.js';
import noHardcodedText from './rules/no-hardcoded-text.js';
import noPhysicalCss from './rules/no-physical-css.js';

export default {
  meta: { name: 'dairy' },
  rules: {
    'no-direct-fetch': noDirectFetch,
    'no-hardcoded-colors': noHardcodedColors,
    'no-hardcoded-text': noHardcodedText,
    'no-physical-css': noPhysicalCss,
  },
};
