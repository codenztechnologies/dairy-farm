// Rule 2 (CLAUDE.md): colours come from theme tokens, never literals in components.
const COLOR_LITERAL =
  /(?<![\w&])#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})(?![\w-])|\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(/i;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow colour literals; use theme tokens (packages/theme/tokens.css)' },
    schema: [],
    messages: {
      color:
        'Hard-coded colour "{{value}}". Use a token from packages/theme/tokens.css (add one, with a dark value, if missing).',
    },
  },
  create(context) {
    function check(node, text) {
      const match = COLOR_LITERAL.exec(text);
      if (match) context.report({ node, messageId: 'color', data: { value: match[0] } });
    }
    return {
      Literal(node) {
        if (typeof node.value === 'string') check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.cooked ?? node.value.raw);
      },
    };
  },
};
