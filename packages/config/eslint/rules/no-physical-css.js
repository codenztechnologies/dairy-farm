// docs/11 + CLAUDE.md rule 3: logical properties only, so RTL (Urdu) works without overrides.
const CLASS_CALLEES = new Set(['cn', 'clsx', 'cva', 'twMerge', 'classNames', 'tv']);
const CLASS_ATTRS = new Set(['className', 'class']);

const PHYSICAL_CLASS = [
  /^(?:ml|mr|pl|pr)-/,
  /^scroll-(?:ml|mr|pl|pr)-/,
  /^(?:left|right)-/,
  /^text-(?:left|right)$/,
  /^(?:float|clear)-(?:left|right)$/,
  /^(?:border|rounded)-(?:l|r|tl|tr|bl|br)(?:-|$)/,
];

const PHYSICAL_STYLE_KEYS = new Set([
  'marginLeft',
  'marginRight',
  'paddingLeft',
  'paddingRight',
  'borderLeft',
  'borderRight',
  'borderLeftWidth',
  'borderRightWidth',
  'borderLeftColor',
  'borderRightColor',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
]);

const LOGICAL_HINT = {
  ml: 'ms',
  mr: 'me',
  pl: 'ps',
  pr: 'pe',
  left: 'start',
  right: 'end',
};

/** Strip variants (md:, hover:), important (!) and negative (-) markers from a class token. */
function baseClass(token) {
  const afterVariants = token.slice(token.lastIndexOf(':') + 1);
  return afterVariants.replace(/^!/, '').replace(/^-/, '');
}

function findPhysicalClass(text) {
  for (const token of text.split(/\s+/)) {
    const base = baseClass(token);
    if (PHYSICAL_CLASS.some((re) => re.test(base))) return token;
  }
  return undefined;
}

function isClassContext(node) {
  let current = node.parent;
  for (let depth = 0; current && depth < 10; depth += 1, current = current.parent) {
    if (current.type === 'JSXAttribute') {
      return current.name.type === 'JSXIdentifier' && CLASS_ATTRS.has(current.name.name);
    }
    if (
      current.type === 'CallExpression' &&
      current.callee.type === 'Identifier' &&
      CLASS_CALLEES.has(current.callee.name)
    ) {
      return true;
    }
    if (current.type === 'Program') return false;
  }
  return false;
}

function hint(token) {
  const prefix = /^(?:.*:)?!?-?(ml|mr|pl|pr|left|right)-/.exec(token)?.[1];
  return prefix ? ` (use "${LOGICAL_HINT[prefix]}-")` : '';
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow physical (left/right) CSS in favour of logical properties' },
    schema: [],
    messages: {
      cls: 'Physical direction class "{{token}}"{{hint}}. Use logical utilities (ms/me/ps/pe/start/end) so RTL works.',
      key: 'Physical style property "{{key}}". Use the logical equivalent (e.g. marginInlineStart).',
      align: 'textAlign "{{value}}" is physical. Use "start" or "end".',
    },
  },
  create(context) {
    function checkClassText(node, text) {
      const token = findPhysicalClass(text);
      if (token) context.report({ node, messageId: 'cls', data: { token, hint: hint(token) } });
    }
    return {
      Literal(node) {
        if (typeof node.value === 'string' && isClassContext(node))
          checkClassText(node, node.value);
      },
      TemplateElement(node) {
        if (isClassContext(node)) checkClassText(node, node.value.cooked ?? node.value.raw);
      },
      Property(node) {
        if (node.computed) return;
        const key =
          node.key.type === 'Identifier'
            ? node.key.name
            : node.key.type === 'Literal'
              ? String(node.key.value)
              : undefined;
        if (key === undefined) return;
        if (PHYSICAL_STYLE_KEYS.has(key)) {
          context.report({ node: node.key, messageId: 'key', data: { key } });
        } else if (
          key === 'textAlign' &&
          node.value.type === 'Literal' &&
          (node.value.value === 'left' || node.value.value === 'right')
        ) {
          context.report({
            node: node.value,
            messageId: 'align',
            data: { value: node.value.value },
          });
        }
      },
    };
  },
};
