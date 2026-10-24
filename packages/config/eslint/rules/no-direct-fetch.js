// docs/14: network calls go through the generated typed client in packages/api-client only.
const GLOBAL_OBJECTS = new Set(['window', 'globalThis', 'self', 'global']);

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow direct fetch/XMLHttpRequest outside packages/api-client' },
    schema: [],
    messages: {
      fetch:
        'Do not call fetch directly. Use the typed client from @dairy/api-client (it adds auth, request ids, retries and error mapping).',
      xhr: 'Do not use XMLHttpRequest. Use the typed client from @dairy/api-client.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const { callee } = node;
        const isBare = callee.type === 'Identifier' && callee.name === 'fetch';
        const isMember =
          callee.type === 'MemberExpression' &&
          !callee.computed &&
          callee.object.type === 'Identifier' &&
          GLOBAL_OBJECTS.has(callee.object.name) &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'fetch';
        if (isBare || isMember) context.report({ node, messageId: 'fetch' });
      },
      NewExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'XMLHttpRequest') {
          context.report({ node, messageId: 'xhr' });
        }
      },
    };
  },
};
