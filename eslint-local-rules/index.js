// © 2026 Ali Abu Ras — local ESLint rule enforcing CLAUDE.md Rule 1 (§14).
//
// Standard `react/forbid-dom-props` can only check whether the `style` prop
// is present at all — it cannot inspect the object passed to it, so it
// flags every `style=` usage indiscriminately, including the sanctioned
// CSS-custom-property exception (§14.2). This rule does the real check:
// a `style` prop is allowed only when it resolves to an object literal
// (directly, or via a same-file variable) whose keys are ALL `--`-prefixed
// custom properties, with no object spread (§14.3 forbids spread in the
// exception). Anything else — real inline styles, mixed objects, spread,
// or a value ESLint can't statically resolve — is flagged.

const MESSAGE =
  'Inline styles are prohibited (CLAUDE.md Rule 1). Use SCSS modules or ' +
  'approved Tailwind utilities. EXCEPTION: CSS custom properties only ' +
  '(--prefixed keys) for data-driven values.';

function unwrapAssertions(node) {
  while (node && (node.type === 'TSAsExpression' || node.type === 'TSTypeAssertion')) {
    node = node.expression;
  }
  return node;
}

function isAllCssVarObject(objectExpression) {
  if (!objectExpression || objectExpression.type !== 'ObjectExpression') return false;
  for (const prop of objectExpression.properties) {
    if (prop.type === 'SpreadElement') return false; // §14.3: no object spread
    if (prop.type !== 'Property') return false;

    let keyName = null;
    if (prop.key.type === 'Literal' && typeof prop.key.value === 'string') {
      keyName = prop.key.value;
    } else if (!prop.computed && prop.key.type === 'Identifier') {
      keyName = prop.key.name;
    }
    if (!keyName || !keyName.startsWith('--')) return false;
  }
  return true;
}

function findVariable(name, scope) {
  let currentScope = scope;
  while (currentScope) {
    const variable = currentScope.variables.find(v => v.name === name);
    if (variable) return variable;
    currentScope = currentScope.upper;
  }
  return null;
}

// Resolves a same-file helper function's single `return <object>` body, e.g.
//   function barVars(pct, delayMs) { return { '--bar-width': ..., '--bar-delay': ... }; }
// Does not follow imports — a cross-file helper is a documentation-worthy
// residual, not something this rule attempts to trace.
function resolveFunctionReturnedObject(callee, scope) {
  if (callee.type !== 'Identifier') return null;
  const variable = findVariable(callee.name, scope);
  if (!variable) return null;

  const def = variable.defs.find(d => d.type === 'FunctionName' || d.type === 'Variable');
  const fnNode =
    def && def.type === 'FunctionName'
      ? def.node
      : def && def.node.init && (def.node.init.type === 'ArrowFunctionExpression' || def.node.init.type === 'FunctionExpression')
      ? def.node.init
      : null;
  if (!fnNode || !fnNode.body) return null;

  // Arrow function with an implicit object-expression body, e.g. `() => ({ ... })`
  if (fnNode.body.type === 'ObjectExpression') return fnNode.body;

  if (fnNode.body.type !== 'BlockStatement') return null;
  const returns = fnNode.body.body.filter(s => s.type === 'ReturnStatement');
  if (returns.length !== 1) return null;
  return unwrapAssertions(returns[0].argument);
}

function resolveObjectExpression(expressionNode, scope) {
  const node = unwrapAssertions(expressionNode);
  if (!node) return null;
  if (node.type === 'ObjectExpression') return node;

  if (node.type === 'Identifier') {
    const variable = findVariable(node.name, scope);
    if (!variable) return null;
    const def = variable.defs.find(d => d.type === 'Variable' && d.node.init);
    return def ? unwrapAssertions(def.node.init) : null;
  }

  if (node.type === 'CallExpression') {
    return resolveFunctionReturnedObject(node.callee, scope);
  }

  return null;
}

module.exports = {
  'forbid-non-css-var-style': {
    meta: {
      type: 'problem',
      docs: {
        description:
          'Forbid the JSX style prop except for objects containing only --prefixed CSS custom properties (CLAUDE.md §14).',
      },
      schema: [],
      messages: { forbidden: MESSAGE },
    },
    create(context) {
      return {
        JSXAttribute(node) {
          if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'style') return;

          // Only native/intrinsic elements (div, span, svg, circle, ...) are in
          // scope, matching react/forbid-dom-props' original behavior — custom
          // components (SvgIcon, Reveal, ...) declare `style` as part of their
          // own typed public API and are a separate, intentional passthrough
          // pattern this rule doesn't govern.
          const opening = node.parent;
          const tagName = opening && opening.name;
          if (!tagName || tagName.type !== 'JSXIdentifier') return;
          if (!/^[a-z]/.test(tagName.name)) return;

          if (!node.value || node.value.type !== 'JSXExpressionContainer') {
            context.report({ node, messageId: 'forbidden' });
            return;
          }

          const scope = context.getScope();
          const resolved = resolveObjectExpression(node.value.expression, scope);
          if (!isAllCssVarObject(resolved)) {
            context.report({ node, messageId: 'forbidden' });
          }
        },
      };
    },
  },
};
