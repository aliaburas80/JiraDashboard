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

// © 2026 Ali Abu Ras — ORG-05b (product/MULTI_TENANT_ORG_DESIGN.md §3.1).
//
// Bans direct `prisma.<orgScopedModel>.*` calls outside src/server/tenancy/ —
// every org-scoped model must be read/written through scopedRepository() so
// organizationId injection can never be forgotten by a route. This is a
// "shrink-only" allowlist: files already migrated onto scopedRepository must
// be removed from ORG_SCOPED_MIGRATION_ALLOWLIST, and no new file may be
// added to it — a genuinely new route must use scopedRepository from day one.

const ORG_SCOPED_MODELS = [
  'user',
  'importLog',
  'dashboardSnapshot',
  'auditEvent',
  'userAddRequest',
  'notification',
  'jiraConnection',
];

// Not part of the shrink-only allowlist — permanent, deliberate exemptions.
const PERMANENT_EXEMPTIONS = [
  'src/server/tenancy/', // the module these calls are required to go through
  'src/lib/prisma.ts', // the singleton client definition itself
  'prisma/seed', // seed/backfill scripts run outside a request's org context
  'prisma/backfillDefaultOrganization', // ORG-04's migration backfill script
  '__tests__', // tests exercise the raw client directly, same as elsewhere in this repo
  'tests/e2e/', // e2e setup/teardown seeds and cleans data directly, same reasoning
  '.spec.ts', // Playwright spec files, wherever they live
  'src/lib/system-error-logger.ts', // shared chokepoint requiring explicit organizationId from callers (design doc §3.1)
];

// Existing call sites as of 2026-08-09 (ORG-05b rebuild) — none of these are
// yet migrated onto scopedRepository(). This list must only shrink.
const ORG_SCOPED_MIGRATION_ALLOWLIST = [
  'app/api/account/delete/route.ts',
  'app/api/admin/app-config/route.ts',
  'app/api/admin/audit-events/route.ts',
  'app/api/admin/audit-events/stats/route.ts',
  'app/api/admin/backup/route.ts',
  'app/api/admin/diagnostics/route.ts',
  'app/api/admin/jira-connections/[id]/fields/route.ts',
  'app/api/admin/jira-connections/[id]/route.ts',
  'app/api/admin/jira-connections/[id]/sync/route.ts',
  'app/api/admin/jira-connections/[id]/test/route.ts',
  'app/api/admin/jira-connections/route.ts',
  'app/api/admin/restore/route.ts',
  'app/api/admin/storage/auto-restore/route.ts',
  'app/api/admin/storage/download/route.ts',
  'app/api/admin/user-add-requests/[id]/accept/route.ts',
  'app/api/admin/user-add-requests/[id]/reject/route.ts',
  'app/api/admin/user-add-requests/route.ts',
  'app/api/admin/users/route.ts',
  'app/api/auth/change-password/route.ts',
  'app/api/auth/forgot-password/route.ts',
  'app/api/auth/login/route.ts',
  'app/api/auth/logout/route.ts',
  'app/api/auth/me/route.ts',
  'app/api/auth/register/route.ts',
  'app/api/auth/resend-verification/route.ts',
  'app/api/auth/reset-password/route.ts',
  'app/api/auth/verify-email/route.ts',
  'app/api/backend-view/route.ts',
  'app/api/consent/route.ts',
  'app/api/demo-request/route.ts',
  'app/api/imports/export/route.ts',
  'app/api/imports/route.ts',
  'app/api/members/route.ts',
  'app/api/metrics/route.ts',
  'app/api/notifications/[id]/read/route.ts',
  'app/api/notifications/route.ts',
  'app/api/profile/image/route.ts',
  'app/api/profile/route.ts',
  'app/api/snapshots/[id]/route.ts',
  'app/api/snapshots/route.ts',
  'app/api/trends/route.ts',
  'app/api/user-add-requests/mine/route.ts',
  'app/api/user-add-requests/route.ts',
  'app/developer/page.tsx',
  'app/glossary/page.tsx',
  'src/lib/accountLifecycle.ts',
  'src/lib/consent.ts',
  'src/services/jira/connectionSyncRunner.ts',
  'src/services/settings/dataRetention.service.ts',
  'src/services/settings/userReset.service.ts',
  'src/services/storage/autoRestore.ts',
];

const ORG_SCOPED_MESSAGE =
  'Direct prisma.{{model}}.{{method}}() is banned for org-scoped models ' +
  '(ORG-05b) — use scopedRepository(organizationId).{{model}}.{{method}}() ' +
  'instead. See product/MULTI_TENANT_ORG_DESIGN.md §3.1.';

function isExempt(filename) {
  const normalized = filename.split('\\').join('/');
  if (PERMANENT_EXEMPTIONS.some((p) => normalized.includes(p))) return true;
  return ORG_SCOPED_MIGRATION_ALLOWLIST.some((allowed) => normalized.endsWith(allowed));
}

module.exports = {
  'no-direct-org-scoped-prisma': {
    meta: {
      type: 'problem',
      docs: {
        description:
          'Ban direct prisma.<orgScopedModel>.* calls outside scopedRepository() (ORG-05b).',
      },
      schema: [],
      messages: { forbidden: ORG_SCOPED_MESSAGE },
    },
    create(context) {
      if (isExempt(context.getFilename())) return {};

      return {
        MemberExpression(node) {
          // Match prisma.<model>.<method>(...) — a chain of two MemberExpressions
          // where the base is an Identifier named "prisma".
          if (node.object.type !== 'MemberExpression') return;
          const inner = node.object;
          if (inner.object.type !== 'Identifier' || inner.object.name !== 'prisma') return;
          if (inner.property.type !== 'Identifier') return;
          if (node.property.type !== 'Identifier') return;

          const model = inner.property.name;
          if (!ORG_SCOPED_MODELS.includes(model)) return;

          context.report({
            node,
            messageId: 'forbidden',
            data: { model, method: node.property.name },
          });
        },
      };
    },
  },
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
