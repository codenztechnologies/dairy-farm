// CLAUDE.md rule 3: every user-visible string goes through i18n keys (en + ur).
const TEXT_ATTRS = new Set([
  'placeholder',
  'title',
  'alt',
  'label',
  'aria-label',
  'aria-description',
  'aria-placeholder',
  'accessibilityLabel',
  'accessibilityHint',
]);
const HAS_LETTERS = /\p{L}/u;

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow literal user-visible text in JSX; use i18n keys' },
    schema: [],
    messages: {
      text: 'Hard-coded text "{{text}}". Use an i18n key (t("...")) with en and ur entries.',
      attr: 'Hard-coded text in "{{attr}}". Use an i18n key (t("...")) with en and ur entries.',
    },
  },
  create(context) {
    return {
      JSXText(node) {
        if (HAS_LETTERS.test(node.value)) {
          context.report({
            node,
            messageId: 'text',
            data: { text: node.value.trim().slice(0, 40) },
          });
        }
      },
      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier' || !TEXT_ATTRS.has(node.name.name)) return;
        const { value } = node;
        if (
          value?.type === 'Literal' &&
          typeof value.value === 'string' &&
          HAS_LETTERS.test(value.value)
        ) {
          context.report({ node: value, messageId: 'attr', data: { attr: node.name.name } });
        }
      },
    };
  },
};
