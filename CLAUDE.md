# Delivery Clarity — Permanent Engineering, Product, Design and Delivery Standards

> **Status:** Canonical project engineering constitution
> **Scope:** Every feature, bug fix, refactor, migration, configuration change, UI change, dependency update, test, document, pull request, and AI-generated modification
> **Enforcement:** TypeScript, ESLint, Stylelint, automated tests, architecture checks, CI, code review, design review, and release governance, tailwindcss
> **Replacement policy:** This document replaces all previous Delivery Clarity engineering-standard documents

---

# 1. Purpose

Delivery Clarity must remain:

* simple to understand;
* easy to extend;
* easy to configure;
* easy to test;
* easy to maintain;
* secure by default;
* accessible;
* responsive;
* theme-ready;
* localization-ready;
* observable;
* reversible;
* safe for AI-assisted development.

The project must not become dependent on:

* hardcoded page behavior;
* repeated JSX;
* duplicated CSS;
* inline styles;
* hidden business logic;
* deeply coupled features;
* undocumented configuration;
* unexplained abstractions;
* uncontrolled dependencies;
* client-side authorization;
* one developer’s tribal knowledge.

The codebase must be easier for the next engineer to understand than it was for the previous engineer to write.

---

# 2. Core Engineering Principles

Every implementation must optimize for the following priorities, in order:

1. Correctness
2. Security
3. Clarity
4. Maintainability
5. Accessibility
6. Testability
7. Extensibility
8. Performance
9. Reusability
10. Visual refinement

Cleverness, abstraction count, file count, and reduced line count are not engineering goals.

The preferred solution is the simplest solution that:

* meets the business requirement;
* preserves architectural boundaries;
* handles realistic edge cases;
* can be safely extended;
* can be tested;
* can be monitored;
* can be rolled back.

---

# 3. Senior Multidisciplinary Ownership

Every developer and AI agent must evaluate work as a coordinated senior team.

The required perspectives are:

* Product Manager
* Product Owner
* Program and Delivery Manager
* Agile Coach
* Principal Software Engineer
* Senior Next.js Architect
* Senior Frontend Engineer
* Senior Backend Engineer
* Solution Architect
* Domain Architect
* Data and Analytics Architect
* SCSS and Design-System Architect
* Senior UI/UX Designer
* Accessibility Engineer
* Quality Engineering Lead
* Application Security Engineer
* Performance Engineer
* DevOps and Site Reliability Engineer
* Technical Writer
* Change and Release Manager

These are active responsibilities, not decorative titles.

## 3.1 Product Manager responsibilities

The Product Manager ensures that every feature:

* solves a defined user or business problem;
* supports the Delivery Clarity product vision;
* has measurable success criteria;
* has a clear target user;
* does not introduce unnecessary product complexity;
* has a rollout and adoption strategy;
* has a retirement or replacement strategy when temporary;
* is prioritized according to value, risk, urgency, and effort.

## 3.2 Product Owner responsibilities

The Product Owner ensures that:

* acceptance criteria are explicit and testable;
* normal, empty, loading, error, permission, and exceptional states are covered;
* user roles and capabilities are defined;
* terminology is consistent;
* configuration opportunities are identified;
* scope boundaries are clear;
* data and calculation assumptions are documented;
* dependencies are understood before implementation.

## 3.3 Program and Delivery Manager responsibilities

The Delivery Manager ensures that:

* ownership is visible;
* dependencies are managed;
* risks are tracked;
* delivery is incremental;
* documentation and testing are part of scope;
* release and rollback work are planned;
* deadlines do not justify permanent architectural damage;
* high-risk changes receive the required review.

## 3.4 Principal Engineer responsibilities

The Principal Engineer ensures that:

* the simplest maintainable design is selected;
* architecture boundaries are respected;
* unnecessary abstractions are rejected;
* technical debt is not silently introduced;
* reusable contracts remain stable;
* implementation is understandable without hidden context;
* business logic does not leak into rendering;
* configuration does not become an unsafe programming language.

## 3.5 UI/UX Lead responsibilities

The UI/UX Lead ensures that:

* each page has a clear purpose;
* the primary action is identifiable;
* information hierarchy is consistent;
* interactions are predictable;
* dashboards avoid excessive density;
* configuration cannot generate unusable layouts;
* responsive, RTL, loading, empty, error, disabled, and success states are designed;
* accessibility is part of the design rather than an afterthought;
* visual decisions are represented through the design system.

## 3.6 Quality Engineering responsibilities

The Quality Engineering Lead ensures that:

* domain calculations have unit tests;
* components have behavior tests;
* feature workflows have integration tests;
* critical journeys have end-to-end tests;
* design-system components have accessibility and visual regression tests;
* configuration schemas and migrations are tested;
* failures introduced by a change are separated from existing failures.

---

# 4. Approved Technology Baseline

## 4.1 Current framework baseline

The approved framework baseline is:

```text
Next.js: 16.2.9
Router: App Router
Language: TypeScript
Rendering model: React Server Components by default
Development bundler: Turbopack
Minimum Node.js supported by Next.js: 20.9
Package manager: npm unless the repository explicitly standardizes another manager
```

The exact Next.js version must be pinned in `package.json`.

```json
{
  "dependencies": {
    "next": "16.2.9"
  }
}
```

Do not use:

```json
{
  "dependencies": {
    "next": "latest"
  }
}
```

`latest` may be used only during an approved upgrade investigation. The resolved version must then be pinned and the lockfile committed.

## 4.2 Runtime version policy

The project must pin its approved Node.js runtime in:

* `.nvmrc`;
* `package.json` under `engines`;
* CI configuration;
* deployment configuration;
* local developer documentation.

The project must not use a Node.js version below the minimum required by the approved Next.js version.

## 4.3 App Router policy

All new routes must use the App Router.

Do not introduce new Pages Router routes.

Existing Pages Router code must be migrated incrementally when touched, provided the migration does not create unrelated risk.

## 4.4 Server Component policy

Components are Server Components by default.

Add `"use client"` only when the component requires:

* event handlers;
* browser APIs;
* client-side state;
* effects;
* client-only third-party libraries;
* interactive chart behavior that cannot run on the server.

Client boundaries must be as small as practical.

Do not mark an entire page or layout as a Client Component because one child is interactive.

Preferred:

```text
Server page
├── Server data loader
├── Server-rendered summary
├── Server-rendered content
└── Small interactive Client Component
```

Avoid:

```text
Full client page
└── Browser fetches all page data after rendering
```

## 4.5 Next.js request API policy

Use the current asynchronous Next.js request APIs.

Do not use removed synchronous access patterns for:

* `cookies`;
* `headers`;
* `draftMode`;
* route `params`;
* page `searchParams`.

## 4.6 Lint command policy

`next lint` is prohibited.

Use the ESLint CLI directly:

```bash
eslint . --max-warnings=0
```

`next build` must not be treated as a replacement for linting.

Linting must run as a separate CI step.

## 4.7 Dependency policy

Before adding a dependency, confirm that:

1. The requirement cannot be reasonably satisfied by Next.js, React, the browser platform, or an existing project dependency.
2. The dependency is actively maintained.
3. Its license is acceptable.
4. Its bundle and runtime impact are acceptable.
5. Its security history is acceptable.
6. It supports the approved Next.js and React versions.
7. It does not duplicate an existing capability.
8. It has an exit or replacement strategy.
9. It provides more value than the maintenance cost it introduces.

A dependency must not be added only because it saves a few lines of code.

## 4.8 Dependency updates

### Security updates

Apply promptly in a dedicated branch and run the full verification suite.

### Patch updates

Group and verify regularly.

### Minor updates

Review for:

* behavior changes;
* bundle changes;
* deprecations;
* configuration changes;
* compatibility impact.

### Major updates

Require:

* a dedicated upgrade branch;
* review of official migration instructions;
* codemods where available;
* architecture review;
* full regression testing;
* dependency compatibility testing;
* release notes;
* rollback instructions;
* an Architecture Decision Record when the change is material.

Canary, beta, alpha, experimental, and release-candidate packages are prohibited in production unless approved through an Architecture Decision Record.

---

# 5. Simplicity and Anti-Spaghetti Architecture

Delivery Clarity must contain no:

* spaghetti code;
* “galaxy code”;
* hidden execution paths;
* circular dependencies;
* deeply nested conditional behavior;
* god components;
* god services;
* unowned shared utilities;
* duplicated business logic;
* page-specific copies of reusable behavior;
* abstraction layers without a demonstrated need.

A developer unfamiliar with a feature must be able to identify:

* where the feature starts;
* where its configuration lives;
* where its domain logic lives;
* where validation occurs;
* where permissions are enforced;
* where its UI components live;
* how it is tested;
* how it is enabled or disabled;
* how it can be extended;
* how it can be removed.

## 5.1 Single responsibility

Each function, component, module, and service must have one clear reason to change.

A React component must not simultaneously:

* fetch data;
* validate data;
* calculate business metrics;
* resolve permissions;
* transform domain models;
* control feature flags;
* and render complex presentation.

Separate those responsibilities through explicit layers.

## 5.2 Complexity controls

Avoid:

* deeply nested `if` statements;
* deeply nested ternary expressions;
* long conditional class expressions;
* large `switch` statements duplicated across files;
* large functions with multiple responsibilities;
* files containing unrelated helpers;
* generic `manager`, `common`, `misc`, or `helper` modules;
* booleans that create ambiguous state combinations.

Prefer:

* early returns;
* guard clauses;
* named functions;
* discriminated unions;
* typed variants;
* small modules;
* composition;
* explicit state machines when workflow complexity requires them.

## 5.3 Soft review thresholds

These are review triggers, not automatic reasons to split code:

* component file exceeds approximately 300 lines;
* function exceeds approximately 60 lines;
* function nesting exceeds three meaningful levels;
* component accepts more than approximately eight unrelated props;
* file owns more than one business responsibility;
* conditional complexity becomes difficult to explain;
* a change requires editing the same concept in more than two locations.

When a threshold is exceeded, the author must assess whether responsibilities should be separated.

Do not split files merely to satisfy a line count.

## 5.4 Rule of Three

Do not create a shared abstraction after the first similar implementation.

A shared abstraction should normally be introduced when:

* at least three genuine reuse cases exist;
* common behavior is stable;
* differences are understood;
* the abstraction makes usage simpler;
* the abstraction has a clear owner;
* the abstraction has a documented public contract.

Two similar implementations may remain separate when their future behavior is likely to diverge.

## 5.5 No speculative architecture

Do not build:

* plug-in systems without a confirmed requirement;
* generic workflow engines for one workflow;
* universal form builders for one form;
* configuration languages for one page;
* event buses for direct parent-child communication;
* repositories or service wrappers that add no meaningful boundary;
* factories that only call constructors;
* unnecessary adapter layers.

Build for known extension points, not imagined possibilities.

---

# 6. Project Architecture

## 6.1 Recommended structure

```text
app/
  (public)/
  dashboard/
  admin/
  api/
  layout.tsx
  error.tsx
  not-found.tsx

src/
  core/
    auth/
    authorization/
    configuration/
    data/
    observability/
    security/
    storage/

  features/
    flow-health/
      api/
      components/
      config/
      domain/
      hooks/
      mappers/
      schemas/
      services/
      tests/
      types/
      index.ts

    ownership/
    labels/
    epic-readiness/
    relation-map/
    release-readiness/

  shared/
    components/
    config/
    domain/
    hooks/
    lib/
    schemas/
    types/

  styles/
    _tokens.scss
    _mixins.scss
    _animations.scss
    globals.scss

  config/
    schemas/
    defaults/
    migrations/
    loaders/
    validators/
    app.config.ts
    navigation.config.ts
    routes.config.ts
    dashboards.config.ts
    widgets.config.ts
    filters.config.ts
    permissions.config.ts
    features.config.ts
    metrics.config.ts
    themes.config.ts

product/
  architecture/
  configuration/
  features/
  calculations/
  decisions/
  releases/

tests/
  accessibility/
  e2e/
  integration/
  visual/
```

The structure may be adapted to the repository, but the architectural separation must remain.

## 6.2 Dependency direction

Approved dependency direction:

```text
App composition
→ Features
→ Shared modules
→ Core infrastructure
```

Rules:

* `shared` must not import from `features`;
* `core` must not import from feature UI;
* one feature must not import another feature’s private files;
* domain code must not import React;
* domain code must not import SCSS;
* UI components must not access the database;
* configuration loaders must not render components;
* server-only modules must not enter the client bundle;
* Client Components must not import secrets or privileged infrastructure;
* circular dependencies are prohibited.

## 6.3 Feature public APIs

Each feature must expose an intentional public API through its root `index.ts`.

Forbidden:

```ts
import { privateMapper } from '@/features/flow-health/internal/mappers/privateMapper';
```

Required:

```ts
import { createFlowHealthViewModel } from '@/features/flow-health';
```

Feature internals must remain private unless intentionally promoted to the public API.

Avoid uncontrolled barrel files that re-export entire directories and increase bundle or dependency complexity.

## 6.4 Domain pipeline

Required processing direction:

```text
External data
→ Runtime validation
→ Normalization
→ Domain calculation
→ Authorization filtering
→ Presentation view model
→ Rendering
```

Business calculations must not occur in JSX, SCSS, chart callbacks, or page markup.

---

# 7. Configuration-First Architecture

Delivery Clarity must be configurable without source-code changes wherever behavior can safely be represented as validated data.

Configuration must be preferred over hardcoded JSX for:

* navigation;
* menu groups;
* menu order;
* dashboard composition;
* supported filters;
* default filters;
* widget visibility;
* page metadata;
* role visibility;
* feature availability;
* status thresholds;
* metric presentation;
* content keys;
* theme selection;
* help links;
* configurable product limits.

Configuration must never contain arbitrary executable code.

## 7.1 Configuration levels

### Level 1 — Build and environment configuration

Used for technical deployment settings:

* service endpoints;
* storage provider;
* telemetry provider;
* runtime mode;
* environment identifiers;
* server-only integration settings.

These must be validated through an environment schema.

Secrets must never be exposed through `NEXT_PUBLIC_*`.

### Level 2 — Application configuration

Used for product structure:

* modules;
* routes;
* navigation;
* dashboards;
* widgets;
* filters;
* issue types;
* semantic statuses;
* calculation selections;
* capabilities;
* role mappings.

Application configuration must be typed and schema validated.

### Level 3 — Runtime product configuration

Used for administrator-controlled behavior that can change without rebuilding:

* feature activation;
* dashboard composition;
* widget order;
* widget visibility;
* display labels;
* descriptions;
* status thresholds;
* default filters;
* readiness rules;
* notification settings;
* supported locales;
* branding;
* theme selection;
* role-based module availability;
* help and documentation links.

### Level 4 — User preferences

Used for individual preferences:

* dashboard layout;
* visible widgets;
* theme;
* locale;
* saved filters;
* table density;
* default team or project;
* collapsed navigation groups.

User preferences must not modify global product configuration.

---

# 8. Zero-Code-Change Capability

The following must normally be changeable without editing TSX, SCSS, or domain logic:

* menu title;
* menu order;
* menu grouping;
* navigation icon from the approved icon registry;
* route visibility;
* feature availability;
* role visibility;
* dashboard section order;
* widget order;
* widget visibility;
* widget title;
* widget description;
* widget size from approved options;
* default filter values;
* enabled filter options;
* semantic threshold values;
* glossary references;
* empty-state text keys;
* help links;
* documentation links;
* theme token values;
* supported locales;
* rollout percentages;
* safe product limits;
* non-sensitive approved integration endpoints.

The following require code changes and engineering review:

* a new business calculation;
* a new security behavior;
* a new authorization capability;
* a new integration protocol;
* a new persistence model;
* a new data structure;
* a new interactive component type;
* a new widget implementation;
* a new domain capability;
* a configuration schema change;
* a configuration migration;
* a new external system contract.

“Zero code change” must never mean placing executable logic inside JSON or database configuration.

---

# 9. Typed Configuration Contract

Every configuration source must have:

* a TypeScript type;
* a runtime schema;
* defaults;
* a schema version;
* validation behavior;
* migration behavior;
* documentation;
* tests;
* safe fallback behavior.

Example:

```ts
import { z } from 'zod';

export const dashboardWidgetSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'metric',
    'trend',
    'table',
    'distribution',
    'progress',
  ]),
  titleKey: z.string().min(1),
  descriptionKey: z.string().min(1).optional(),
  enabled: z.boolean().default(true),
  order: z.number().int().nonnegative(),
  roles: z.array(z.string()).default([]),
  capability: z.string().optional(),
  size: z.enum(['small', 'medium', 'large', 'full']),
  dataSource: z.string().min(1),
  options: z.record(z.string(), z.unknown()).default({}),
});

export type DashboardWidgetConfig = z.infer<
  typeof dashboardWidgetSchema
>;
```

Forbidden:

```ts
const config = JSON.parse(rawConfig);

return <Dashboard config={config} />;
```

Required:

```ts
const result = dashboardConfigSchema.safeParse(rawConfig);

if (!result.success) {
  return createConfigurationFailure(result.error);
}

return <Dashboard config={result.data} />;
```

TypeScript types alone are not runtime validation.

---

# 10. Configuration Registries

Navigation, routes, widgets, filters, metrics, capabilities, icons, features, and themes must use centralized typed registries.

Recommended configuration files:

```text
src/config/
  schemas/
  defaults/
  migrations/
  loaders/
  validators/
  app.config.ts
  navigation.config.ts
  routes.config.ts
  dashboards.config.ts
  widgets.config.ts
  filters.config.ts
  permissions.config.ts
  features.config.ts
  metrics.config.ts
  themes.config.ts
```

## 10.1 Route registry

```ts
export type RouteDefinition = {
  id: string;
  path: string;
  titleKey: string;
  descriptionKey?: string;
  navigation: {
    visible: boolean;
    groupId: string;
    order: number;
    icon: IconName;
  };
  access: {
    capability: Capability;
  };
  featureFlag?: FeatureFlag;
  helpKey?: string;
};
```

The route registry should drive:

* navigation;
* breadcrumbs;
* route labels;
* permissions;
* page metadata;
* help links;
* developer documentation references.

Do not maintain separate hardcoded lists for each concern.

## 10.2 Widget registry

```ts
export const widgetRegistry = {
  metric: MetricWidget,
  trend: TrendWidget,
  table: TableWidget,
  distribution: DistributionWidget,
  progress: ProgressWidget,
} satisfies WidgetRegistry;
```

Configuration chooses an approved widget type.

Configuration must not:

* import component paths;
* execute JavaScript;
* contain JSX;
* contain arbitrary CSS;
* contain arbitrary class names;
* contain raw SQL;
* contain unrestricted URLs;
* dynamically load unapproved modules.

Unknown widget types must produce a safe configuration error rather than crashing the route.

## 10.3 Icon registry

Configuration must reference semantic icon names from an approved icon registry.

```ts
export const iconRegistry = {
  dashboard: DashboardIcon,
  flowHealth: ActivityIcon,
  ownership: UsersIcon,
  release: RocketIcon,
} satisfies IconRegistry;
```

Do not store component imports or arbitrary SVG markup in runtime configuration.

---

# 11. Runtime Configuration Lifecycle

Runtime configuration must support:

* draft;
* validation;
* preview;
* review;
* approval;
* publishing;
* monitoring;
* rollback;
* version history;
* comparison;
* audit logging;
* environment targeting;
* safe defaults;
* last known valid recovery.

Required lifecycle:

```text
Draft
→ Validate
→ Preview
→ Review
→ Approve
→ Publish
→ Monitor
→ Roll back when required
```

Configuration metadata must include:

```ts
type ConfigurationMetadata = {
  schemaVersion: string;
  configurationVersion: number;
  environment: 'development' | 'staging' | 'production';
  createdAt: string;
  createdBy: string;
  approvedAt?: string;
  approvedBy?: string;
  changeReason: string;
};
```

A new configuration must not immediately destroy or overwrite the last known valid configuration.

## 11.1 Fallback order

```text
Validated published configuration
→ Last known valid configuration
→ Bundled validated defaults
→ Feature-safe failure state
```

Security-sensitive configuration must fail closed.

Presentation configuration may fall back to safe defaults.

---

# 12. Configuration Safety

Configuration may select only approved:

* component types;
* widget types;
* icons;
* semantic variants;
* layout spans;
* data sources;
* message keys;
* filters;
* capabilities;
* routes;
* feature flags;
* theme tokens.

Configuration may not contain:

* executable JavaScript;
* raw HTML;
* inline CSS;
* arbitrary class names;
* dynamic imports;
* unrestricted file paths;
* raw SQL;
* shell commands;
* hardcoded secrets;
* arbitrary regular expressions from untrusted users;
* unvalidated external URLs;
* component source code;
* business formulas expressed as unrestricted executable strings.

Configuration must not become a hidden programming language.

---

# 13. Design System and Styling Architecture

Every frontend contributor acts as:

* Senior Frontend Engineer
* SCSS Architect
* Design-System Governance Lead
* Accessibility Engineer
* Performance Engineer

Every frontend change must:

* contain no prohibited inline styles;
* use SCSS Modules for custom component appearance;
* use Tailwind only for approved layout utilities;
* consume design tokens;
* remain responsive;
* remain accessible;
* remain theme-ready;
* remain RTL-ready;
* avoid duplicated CSS and JSX;
* produce reusable and configurable components.

---

# 14. Inline Styles Are Prohibited

The JSX `style` prop is forbidden except for one controlled exception.

## 14.1 Forbidden

```tsx
<div style={{ background: '#fff', padding: 16 }} />

<div style={computedStyleObject} />

<style jsx>{`
  .card {
    padding: 16px;
  }
`}</style>

element.style.color = 'red';
```

## 14.2 Permitted exception — dynamic CSS custom properties only

When a value genuinely comes from runtime data and cannot be represented using a class or data attribute, it may be passed through a CSS custom property.

```tsx
import type { CSSProperties } from 'react';

type CSSVariableProperties = CSSProperties &
  Record<`--${string}`, string | number>;

const percentage = clampPercentage(value);

// DYNAMIC CSS VARIABLE:
// Width is calculated from runtime delivery data and cannot be predefined.
const variables: CSSVariableProperties = {
  '--bar-width': `${percentage}%`,
};

<div
  className={styles.barFill}
  style={variables}
/>;
```

SCSS consumes the custom property:

```scss
.barFill {
  width: var(--bar-width, 0%);
  background: var(--color-primary);
}
```

## 14.3 Exception restrictions

The exception must:

* contain only keys starting with `--`;
* contain no object spread;
* contain no normal CSS properties;
* contain no raw hardcoded colors;
* contain no business-generated class names;
* include a comment explaining why JavaScript must provide the value;
* use validated and clamped values;
* be enforced by ESLint.

Forbidden:

```tsx
<div style={{ width: `${percentage}%` }} />

<div style={{ '--bar-color': '#ff0000' } as CSSProperties} />

<div style={{ ...variables }} />

<div style={externalStyleObject} />
```

SVG presentation attributes such as `stroke`, `strokeDasharray`, and `fill` may remain JSX attributes when required by the SVG API. Semantic colors must still come from approved tokens or mappings.

---

# 15. Tailwind Is for Layout Utilities Only

Tailwind may be used for:

* flexbox;
* grid;
* simple responsive arrangement;
* basic spacing;
* display;
* alignment;
* visibility;
* screen-reader-only content.

Examples:

```tsx
<div className="grid gap-4 lg:grid-cols-4">

<div className="flex items-center">

<span className="sr-only">
```

Tailwind must not define component identity.

Do not use Tailwind for:

* hardcoded colors;
* arbitrary colors;
* shadows;
* border identity;
* typography hierarchy;
* complex animations;
* sticky positioning;
* z-index layering;
* page-specific appearance;
* long repeated class strings;
* arbitrary widths;
* arbitrary spacing;
* arbitrary durations;
* arbitrary font sizes.

Forbidden:

```tsx
<div className="bg-[#F23A18]">

<div className="w-[437px]">

<div className="z-[999]">

<div className="text-[15px]">

<div className="duration-[275ms]">
```

## 15.1 Token-aligned Tailwind

Tailwind utilities may be used only when the Tailwind theme maps to Delivery Clarity design tokens.

Tailwind must not create a second independent system for:

* spacing;
* breakpoints;
* colors;
* typography;
* radius;
* shadows;
* animation duration;
* z-index.

Repeated or visually meaningful utility combinations must be extracted into an SCSS Module.

---

# 16. Hybrid Styling Architecture

```text
Tailwind
→ simple layout and responsive arrangement

SCSS Modules
→ component identity, interaction, animation, states, themes

Design tokens
→ all approved visual values
```

Global stylesheets are allowed only for:

* resets;
* root design tokens;
* base typography;
* shared animation registration;
* globally required accessibility behavior.

Page-specific and component-specific styles must not be placed in global files.

---

# 17. SCSS File Structure

```text
src/
  styles/
    _tokens.scss
    _mixins.scss
    _animations.scss
    globals.scss

  components/
    ComponentName/
      ComponentName.tsx
      ComponentName.module.scss
      ComponentName.test.tsx
```

When using feature folders:

```text
src/features/flow-health/components/FlowHealthCard/
  FlowHealthCard.tsx
  FlowHealthCard.module.scss
  FlowHealthCard.test.tsx
```

One SCSS Module is required per component when custom styling exists.

Page styles must use a page module:

```text
app/dashboard/flow-health/page.module.scss
```

---

# 18. Design Tokens

All reusable visual values must come from `src/styles/_tokens.scss`.

Do not hardcode in component SCSS or JSX:

* colors;
* spacing;
* dimensions;
* radii;
* shadows;
* z-index values;
* header height;
* sidebar width;
* toolbar height;
* typography sizes;
* line heights;
* animation durations;
* border widths;
* focus-ring widths;
* icon sizes.

Example tokens:

```scss
:root {
  --color-primary: var(--dc-accent);
  --color-surface: var(--dc-s1);
  --color-border: var(--dc-bdr);

  --header-height: 52px;
  --sidebar-width: 228px;
  --toolbar-height: 52px;

  --z-header: 500;
  --z-toolbar: 40;
  --z-dropdown: 600;
  --z-modal: 9999;

  --focus-ring-width: 2px;
  --focus-ring-offset: 2px;
  --focus-ring-opacity: 60%;
}
```

Raw foundational values may exist in the token layer.

Component modules must consume semantic tokens.

## 18.1 Semantic token policy

Components must consume semantic names:

```scss
.card {
  background: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text);
}
```

Components must not depend directly on tenant-specific or brand-specific raw values.

## 18.2 Theme support

Themes may replace token values but must preserve semantic token contracts.

Theme configuration must pass automated contrast validation before publishing.

---

# 19. Dynamic Numeric Visualizations

Runtime dimensions such as:

* progress widths;
* bar heights;
* chart positions;
* completion percentages;
* timeline offsets;

must use the controlled CSS-custom-property exception.

```tsx
const variables: CSSVariableProperties = {
  '--bar-width': `${clampPercentage(percentage)}%`,
};

// DYNAMIC CSS VARIABLE:
// Bar width is based on normalized delivery data.
<div
  className={styles.barFill}
  data-status={status}
  style={variables}
/>
```

Status appearance must use semantic attributes or typed variants:

```scss
.barFill[data-status='healthy'] {
  background: var(--color-success);
}

.barFill[data-status='warning'] {
  background: var(--color-warning);
}

.barFill[data-status='critical'] {
  background: var(--color-danger);
}
```

Business logic must not return colors.

Forbidden:

```ts
const color =
  score > 75
    ? '#059669'
    : score > 40
      ? '#D97706'
      : '#DC2626';
```

Required:

```ts
const status = getHealthStatus(score);
```

---

# 20. No Hardcoded Layout Assumptions

Use tokens for dimensional layout values.

Correct:

```scss
.toolbar {
  inset-block-start: var(--header-height);
}

.sidebar {
  inline-size: var(--sidebar-width);
}
```

Forbidden:

```scss
.toolbar {
  top: 52px;
}

.sidebar {
  width: 228px;
}
```

Use logical properties:

* `margin-inline-start`;
* `padding-inline-end`;
* `border-inline-start`;
* `inset-inline-end`;
* `inline-size`;
* `block-size`.

Avoid directional assumptions such as `left`, `right`, `margin-left`, and `border-right` unless the behavior is genuinely physical rather than language-directional.

---

# 21. Class Composition

Use `clsx` for conditional class composition.

Correct:

```tsx
className={clsx(
  styles.chip,
  styles[`chip--${variant}`],
  {
    [styles['chip--active']]: active,
    [styles['chip--disabled']]: disabled,
  },
)}
```

Forbidden:

```tsx
className={
  active
    ? 'a b c d e f'
    : disabled
      ? 'x y z'
      : 'p q r'
}
```

Do not pass arbitrary visual class names from business logic or configuration.

---

# 22. Dynamic Components

Reusable components must accept typed semantic props.

Correct:

```tsx
<MetricCard
  label="Completion"
  value="36%"
  status="warning"
/>
```

Forbidden:

```tsx
function CompletionCard() {
  return (
    <div style={{ color: '#D97706' }}>
      36% Completion
    </div>
  );
}
```

Typed variant pattern:

```ts
export const statusVariants = [
  'success',
  'warning',
  'danger',
  'info',
  'neutral',
] as const;

export type StatusVariant =
  (typeof statusVariants)[number];
```

```tsx
<Badge variant="warning">
  {label}
</Badge>
```

Feature components should not require structural rewrites when a centrally supported variant is added.

---

# 23. Stable Component Contracts

Component props must communicate meaning rather than styling implementation.

Preferred:

```tsx
<MetricCard
  label={label}
  value={value}
  status="warning"
  trend={trend}
  supportingText={supportingText}
/>
```

Avoid:

```tsx
<MetricCard
  red
  bold
  big
  leftIcon
  customClass="special-card"
  valueColor="#d97706"
/>
```

Avoid exposing unrestricted:

* `style`;
* raw color values;
* internal class names;
* DOM implementation details;
* arbitrary visual flags.

Use:

* semantic variants;
* named slots;
* structured composition;
* typed options;
* approved extension points.

---

# 24. Data-Driven Rendering

Menus, sidebar sections, filters, cards, widgets, actions, tabs, and route metadata must be rendered from typed configuration.

Correct:

```tsx
const sidebarSections: SidebarSectionConfig[] = [
  // Validated configuration.
];

sidebarSections.map((section) => (
  <SidebarSection
    key={section.id}
    {...section}
  />
));
```

Forbidden:

```tsx
<NavItem href="/dashboard/summary" />

<NavItem href="/dashboard/priority-attention" />

<NavItem href="/dashboard/flow-health" />

<NavItem href="/dashboard/ownership" />
```

Repeated JSX must not be maintained manually when the variation is data.

---

# 25. Component State Contracts

Do not model asynchronous state using unrelated booleans.

Avoid:

```ts
type Props = {
  loading: boolean;
  error: boolean;
  empty: boolean;
  data?: Data;
};
```

Use discriminated unions:

```ts
type DataState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };
```

This prevents impossible combinations such as loading, error, and success at the same time.

Every data-driven component must intentionally support applicable:

* idle;
* loading;
* empty;
* error;
* success;
* partial-data;
* permission-denied states.

---

# 26. Accessibility

Accessibility is a release requirement.

## 26.1 Semantic HTML

Use native semantic elements:

* `<button>`;
* `<a>`;
* `<nav>`;
* `<aside>`;
* `<main>`;
* `<header>`;
* `<section>`;
* `<table>`;
* `<progress>`;
* `<dialog>` where appropriate.

Do not use clickable `<div>` elements when a button or link is correct.

## 26.2 Focus visibility

Every interactive component must have a visible `:focus-visible` state.

```scss
.interactive:focus-visible {
  outline:
    var(--focus-ring-width)
    solid
    color-mix(
      in srgb,
      var(--color-primary) var(--focus-ring-opacity),
      transparent
    );
  outline-offset: var(--focus-ring-offset);
}
```

## 26.3 Accessible naming

Icon-only controls require an accessible name:

```tsx
<button
  type="button"
  aria-label={t('actions.close')}
>
  <CloseIcon aria-hidden="true" />
</button>
```

Decorative icons must be hidden from assistive technologies.

## 26.4 State communication

State must not be communicated through color alone.

Use combinations of:

* text;
* icon;
* label;
* pattern;
* accessible description;
* semantic markup.

## 26.5 Keyboard support

Critical workflows must be completable using the keyboard only.

Interactive components must support expected keyboard behavior.

Focus must:

* move predictably;
* remain visible;
* return to the trigger after a modal closes;
* not become trapped unintentionally;
* not move unexpectedly after data refresh.

## 26.6 Motion

All motion must respect `prefers-reduced-motion`.

```scss
@media (prefers-reduced-motion: reduce) {
  .animated {
    animation: none;
    transition: none;
  }
}
```

## 26.7 Zoom and contrast

Critical workflows must remain usable at 200% zoom.

Text and interactive states must meet approved contrast requirements.

Automated contrast testing does not replace manual review.

## 26.8 ARIA policy

Use native HTML before ARIA.

ARIA must not replace semantic elements.

Do not add ARIA attributes unless their behavior is understood and tested.

---

# 27. Localization and RTL

Delivery Clarity must be ready for English and Arabic.

## 27.1 User-facing text

Reusable components must not hardcode user-facing text.

Use translation keys:

```tsx
<EmptyState
  title={t('dashboard.empty.title')}
  description={t('dashboard.empty.description')}
/>
```

Configuration should reference translation keys rather than duplicate translated content.

## 27.2 Formatting

Use locale-aware formatting for:

* dates;
* times;
* numbers;
* percentages;
* currencies;
* durations;
* pluralization.

Do not concatenate translated sentence fragments.

## 27.3 RTL behavior

Use CSS logical properties.

Test:

* English LTR;
* Arabic RTL;
* mixed Arabic and English;
* long labels;
* numbers inside RTL content;
* charts with RTL labels;
* table alignment;
* navigation expansion;
* icon direction.

User-facing text must not be embedded inside images.

---

# 28. Business Logic Must Not Be CSS

Business logic produces semantic domain results.

Correct:

```ts
const status:
  | 'healthy'
  | 'warning'
  | 'critical' =
  getHealthStatus(score);
```

Forbidden:

```ts
const className =
  score > 75
    ? 'green'
    : score > 40
      ? 'orange'
      : 'red';
```

Forbidden:

```ts
const color =
  score > 75
    ? '#059669'
    : '#DC2626';
```

SCSS and the design system decide how semantic states appear.

---

# 29. Domain-Driven Business Logic

Use Delivery Clarity domain language.

Preferred:

* `SprintCommitment`;
* `DeliveryPredictability`;
* `FlowHealth`;
* `ReleaseReadiness`;
* `OwnershipRisk`;
* `OrphanIssue`;
* `ScopeChange`;
* `BlockedWork`;
* `WorkItemAge`;
* `ThroughputTrend`.

Avoid:

* `dataProcessor`;
* `calculateThing`;
* `manager`;
* `helper`;
* `misc`;
* `common`;
* `resultData`.

Domain logic must remain independent from:

* React;
* Next.js routing;
* SCSS;
* chart libraries;
* browser APIs;
* database implementation;
* presentation component structure.

---

# 30. Calculation Single Source of Truth

All metrics must be calculated in domain modules.

Required pipeline:

```text
Raw Jira data
→ Validation
→ Normalization
→ Domain calculation
→ Calculation result
→ Presentation view model
→ UI
```

Forbidden inside a component:

```tsx
const predictability =
  completedStoryPoints /
  committedStoryPoints *
  100;
```

Required:

```ts
const result =
  calculateSprintPredictability(sprint);

const viewModel =
  toPredictabilityViewModel(result);
```

Every metric must define:

```ts
type MetricDefinition = {
  id: string;
  labelKey: string;
  descriptionKey: string;
  formulaDescription: string;
  unit:
    | 'count'
    | 'percentage'
    | 'days'
    | 'points'
    | 'ratio';
  direction:
    | 'higher-is-better'
    | 'lower-is-better'
    | 'neutral';
  version: string;
};
```

Every metric must document:

* definition;
* formula;
* assumptions;
* inclusions;
* exclusions;
* handling of missing values;
* zero-denominator behavior;
* rounding;
* unit;
* calculation version;
* test examples.

---

# 31. Metric Versioning

Metric definitions may evolve.

Every calculated result must be traceable to:

```ts
type CalculationMetadata = {
  metricVersion: string;
  calculatedAt: string;
  dataVersion: string;
};
```

Reports should expose the calculation version where relevant.

Do not silently change formulas and present historical reports as directly comparable without documenting the change.

---

# 32. External Data Validation

All external data is untrusted.

Validate at runtime:

* API responses;
* uploaded Jira files;
* CSV files;
* Excel files;
* persisted settings;
* URL parameters;
* search parameters;
* local storage;
* runtime configuration;
* imported JSON;
* server-action inputs.

Use schema validation before data reaches domain logic.

---

# 33. Invalid Data, Corrections and Quarantine

Imported records must be classified as:

* valid;
* valid after documented normalization;
* recoverable with warning;
* invalid and quarantined.

Every automatic correction must be recorded:

```ts
type DataCorrection = {
  issueKey?: string;
  field: string;
  originalValue: unknown;
  correctedValue?: unknown;
  reason: string;
  severity:
    | 'info'
    | 'warning'
    | 'error';
};
```

Do not silently discard or modify imported records.

Users must be able to understand why Delivery Clarity totals differ from the original Jira export.

---

# 34. Data Visualization Governance

Charts receive presentation-ready data.

Charts must not calculate business metrics.

Every visualization must:

* support loading, empty, error, and success states;
* expose an accessible text summary or equivalent table;
* remain understandable without color;
* use approved chart-series tokens;
* support reduced motion;
* handle long labels;
* handle zero and missing values;
* remain readable at supported breakpoints;
* provide keyboard-accessible interaction when interactive;
* make truncated information discoverable;
* avoid misleading axes or scales.

Use native `<progress>` where appropriate.

```tsx
<progress
  className={styles.progress}
  value={completed}
  max={total}
  aria-label={label}
/>
```

When native semantics are insufficient:

```tsx
<div
  className={styles.progress}
  role="progressbar"
  aria-label={label}
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={percentage}
>
  ...
</div>
```

---

# 35. Dynamic Value Validation

Runtime values used for presentation must be validated.

```ts
export function clampPercentage(
  value: number,
): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}
```

Do not send:

* `NaN`;
* infinite values;
* negative percentages;
* uncontrolled dimensions;
* raw imported strings;

into CSS or chart dimensions.

---

# 36. Capability-Based Authorization

Role names must not be scattered through components.

Avoid:

```ts
if (user.role === 'admin') {
  // ...
}
```

Use capabilities:

```ts
if (can(user, 'configuration.publish')) {
  // ...
}
```

Configuration may assign capabilities to roles.

Code enforces the capability.

Client-side visibility is not authorization.

Every protected operation must be validated on the server, route handler, server action, or data-access layer.

Hidden navigation does not secure an operation.

---

# 37. Feature Flags

Experimental, incomplete, or gradually released features must use typed feature flags.

```ts
export const featureFlags = [
  'relation-map',
  'advanced-flow-health',
  'ai-recommendations',
] as const;

export type FeatureFlag =
  (typeof featureFlags)[number];
```

Every feature flag must define:

* owner;
* description;
* default;
* environment;
* rollout plan;
* creation date;
* review or expiry date;
* removal plan.

Do not hide unfinished work using:

* commented JSX;
* temporary hardcoded booleans;
* user-name checks;
* arbitrary environment checks.

Expired flags must be removed from:

* code;
* configuration;
* tests;
* documentation.

---

# 38. Security

## 38.1 Authorization

Authorization must be enforced on the server.

## 38.2 Secrets

Never expose:

* API keys;
* database credentials;
* private storage keys;
* signing keys;
* server tokens;

through `NEXT_PUBLIC_*`, client bundles, logs, or configuration returned to the browser.

## 38.3 HTML safety

Do not render unsanitized HTML.

`dangerouslySetInnerHTML` requires:

* an approved sanitizer;
* documented justification;
* security review;
* tests.

## 38.4 File uploads

Validate uploaded files independently by:

* declared type;
* actual content;
* extension;
* size;
* record count;
* schema;
* supported encoding;
* malicious-content risk.

Do not trust the browser-provided MIME type alone.

## 38.5 Spreadsheet and CSV injection

When exporting spreadsheet-compatible content, values beginning with:

```text
=
+
-
@
```

must be handled safely to prevent formula execution.

## 38.6 External links

External links opened in a new tab must use safe attributes where required.

URLs loaded from configuration must be validated or allow-listed.

## 38.7 Security logging

Security logs must contain enough context for investigation without recording secrets or unnecessary personal data.

---

# 39. Privacy and Data Retention

For uploaded Jira data, define:

* where data is stored;
* encryption requirements;
* retention period;
* deletion behavior;
* backup behavior;
* audit behavior;
* authorized access;
* export behavior.

Users must be able to delete datasets where product requirements permit.

Do not send uploaded Jira data to unrelated analytics systems.

Do not log raw:

* issue descriptions;
* comments;
* email addresses;
* attachments;
* sensitive project content;

unless explicitly required, secured, and documented.

Use anonymized or internal identifiers in telemetry where possible.

---

# 40. Performance Standards

Performance is a merge requirement.

The project must define measurable budgets for:

* route JavaScript;
* shared JavaScript;
* initial page response;
* Largest Contentful Paint;
* Interaction to Next Paint;
* Cumulative Layout Shift;
* chart rendering;
* import processing;
* table rendering;
* image weight.

Initial recommended web-performance targets:

```text
Largest Contentful Paint: ≤ 2.5 seconds
Interaction to Next Paint: ≤ 200 milliseconds
Cumulative Layout Shift: ≤ 0.1
```

Final project budgets must be documented and measured in representative environments.

## 40.1 React performance rules

Do not:

* use `useMemo` or `useCallback` by habit;
* duplicate server data in client state;
* use effects to derive renderable values;
* fetch the same resource independently in sibling components;
* run expensive transformations during every render;
* render unbounded lists;
* hydrate entire pages unnecessarily.

Avoid:

```tsx
useEffect(() => {
  setFilteredData(
    filterData(data, filters),
  );
}, [data, filters]);
```

Prefer:

```tsx
const filteredData =
  filterData(data, filters);
```

Use memoization only when profiling or referential stability demonstrates the need.

## 40.2 Large datasets

Large datasets must use appropriate:

* pagination;
* aggregation;
* streaming;
* virtualization;
* web workers;
* server-side processing;
* incremental rendering.

The selected technique must match the actual bottleneck.

## 40.3 Configuration performance

Configuration must be:

* loaded at the correct boundary;
* validated once;
* normalized once;
* cached safely;
* transformed before rendering;
* passed through typed models.

Do not repeatedly fetch or parse the same configuration during component rendering.

---

# 41. Error Isolation

Use error boundaries at appropriate levels:

```text
Application boundary
Dashboard boundary
Feature boundary
Widget boundary
Import boundary
Relation-map boundary
```

A failure in one chart or widget must not unnecessarily crash an entire dashboard.

User-facing errors must provide:

* clear message;
* safe retry action;
* fallback where possible;
* technical reference identifier;
* no raw stack trace.

Error boundaries must not hide persistent failures without telemetry.

---

# 42. Observability

Critical workflows must define:

* what success means;
* what validation failure means;
* what unexpected failure means;
* what performance failure means;
* what is logged;
* what triggers an alert.

Safe operational context may include:

* application version;
* configuration version;
* schema version;
* metric version;
* route ID;
* feature ID;
* widget ID;
* dataset ID;
* import session ID;
* safe role context;
* error-boundary identifier.

Telemetry must not include secrets or unnecessary imported business data.

Configuration errors must make it possible to identify:

* which version caused the issue;
* who published it;
* which environment was affected;
* which feature or widget failed;
* whether rollback resolved the issue.

---

# 43. Component Maturity Levels

Components are classified as:

## Level 1 — Local

* used by one feature;
* owned by that feature;
* not presented as a general solution.

## Level 2 — Shared

* used by multiple features;
* has a stable typed contract;
* has tests;
* has documented behavior.

## Level 3 — Design System

* reusable across the product;
* has documented variants;
* has accessibility tests;
* has visual regression coverage;
* supports themes;
* supports RTL;
* has a compatibility and deprecation policy.

Do not promote a component to shared or design-system status without a genuine reuse case.

---

# 44. Deprecation Policy

Reusable APIs must not change silently.

Breaking prop or configuration changes require:

* a migration plan;
* documentation;
* tests;
* a deprecation period when practical;
* a removal target;
* a codemod for high-volume migrations where reasonable.

Example:

```ts
type MetricCardProps = {
  /**
   * @deprecated Use `status`.
   * Planned removal: v3.
   */
  severity?: LegacySeverity;

  status?: StatusVariant;
};
```

Deprecated configuration must be migrated before removal.

---

# 45. Testing Strategy

Tests must validate behavior rather than implementation details.

Prefer:

```ts
expect(
  screen.getByRole('heading', {
    name: /flow health/i,
  }),
).toBeVisible();
```

Avoid:

```ts
expect(
  component.state.isOpen,
).toBe(true);
```

Required testing layers:

```text
Domain calculation tests
Configuration validation tests
Schema migration tests
Component behavior tests
Feature integration tests
Critical workflow E2E tests
Accessibility tests
Visual regression tests
Performance tests where applicable
```

## 45.1 Domain tests

Every calculation must test:

* normal data;
* no data;
* zero values;
* missing fields;
* invalid data;
* boundary values;
* rounding;
* negative values;
* values exceeding expected limits;
* changed scope;
* orphan records;
* calculation version behavior.

## 45.2 Configuration tests

Test:

* valid configuration;
* invalid configuration;
* defaults;
* missing fields;
* unsupported schema versions;
* migration from older versions;
* duplicate IDs;
* duplicate ordering;
* unknown widget types;
* unknown icons;
* invalid routes;
* cyclic navigation;
* unsafe URLs;
* capability enforcement;
* fallback configuration;
* rollback;
* last known valid recovery.

## 45.3 Test-data builders

Do not repeat large hardcoded test objects.

Use builders:

```ts
const issue = buildJiraIssue({
  status: 'Done',
  storyPoints: 8,
});

const sprint = buildSprint({
  issues: [issue],
});
```

Builders must support valid, invalid, missing, and edge-case data.

## 45.4 UI stress testing

Test components using:

* long project names;
* Arabic labels;
* mixed Arabic and English;
* zero values;
* 100% values;
* values above 100%;
* negative imported values;
* thousands of records;
* missing labels;
* unknown statuses;
* large numbers;
* missing assignees;
* missing sprints;
* missing releases;
* long descriptions.

Do not test only perfect demonstration data.

---

# 46. Visual Regression Testing

Critical routes and design-system components require visual regression coverage for applicable states:

* desktop;
* tablet;
* mobile;
* light theme;
* dark theme;
* LTR;
* RTL;
* empty;
* loading;
* error;
* disabled;
* long content;
* reduced motion.

A baseline must not be updated merely to make CI pass.

A baseline update requires intentional review of the visual change.

---

# 47. Storybook or Equivalent Component Documentation

Shared and design-system components should have documented examples for:

* default;
* all variants;
* all sizes;
* interactive;
* disabled;
* loading;
* empty;
* error;
* long text;
* mobile;
* dark theme;
* RTL;
* reduced motion.

The component documentation should support:

* design review;
* accessibility review;
* visual regression;
* implementation guidance;
* API discovery.

---

# 48. Architecture Enforcement

Architectural boundaries must be checked automatically using an approved dependency-analysis tool or ESLint boundary rules.

CI must reject:

* circular dependencies;
* forbidden feature imports;
* server-only imports in Client Components;
* deep imports into private feature files;
* domain imports from presentation layers where direction is invalid;
* shared modules importing feature modules.

Written architecture without automated enforcement is guidance, not governance.

---

# 49. ESLint Enforcement

ESLint must enforce, where technically possible:

* no prohibited inline style props;
* only `--*` CSS custom properties in the permitted exception;
* no object spread in style exceptions;
* no undocumented style exceptions;
* no raw color values passed through style variables;
* no unused code;
* no floating promises;
* no unsafe `any`;
* no unhandled async behavior;
* import boundaries;
* React and hooks correctness;
* accessibility rules;
* no direct server imports into client code;
* no prohibited suppression comments.

The project should use a custom local rule for the controlled `style` exception when standard rules cannot express it.

**Implemented 2026-07-22 (`STYLE-09`):** `eslint-local-rules/index.js`'s
`local-rules/forbid-non-css-var-style` is this rule — it replaced the standard
`react/forbid-dom-props` config for `style` (which could only detect the prop's presence,
not inspect its contents) with real AST resolution: only flags `style` on native/intrinsic
elements when the resolved object (literal, same-file variable, or same-file helper
function) contains a key that isn't `--`-prefixed, or contains object spread. See CLAUDE.md
§60.5a and `TODO-List.md` `STYLE-09` for the full writeup.

---

# 50. Stylelint Enforcement

Stylelint must cover SCSS and CSS in:

```text
app/
src/
components/
```

It must reject:

* hardcoded colors outside approved token files;
* invalid custom properties;
* duplicate selectors;
* invalid nesting;
* unknown properties;
* unsupported syntax;
* prohibited raw values in component modules;
* excessive specificity;
* invalid token usage.

The token file may have a controlled override allowing foundational raw values.

Component modules must consume tokens.

Warnings must fail CI.

---

# 51. TypeScript Standards

TypeScript strict mode is required.

Do not add:

* `any`;
* `@ts-ignore`;
* `@ts-nocheck`;
* unsafe type assertions;
* broad `Record<string, any>`;
* unvalidated casts from external data;

without a documented technical reason and review.

Prefer:

* `unknown` before validation;
* discriminated unions;
* branded identifiers where confusion is possible;
* `satisfies`;
* `as const`;
* generated route types;
* inferred schema types;
* exhaustive checks.

Example:

```ts
function assertNever(
  value: never,
): never {
  throw new Error(
    `Unexpected value: ${String(value)}`,
  );
}
```

Type errors must not be ignored during production builds.

---

# 52. Required Package Scripts

The repository must provide reliable scripts that match actually installed tools.

Do not add placeholder scripts that cannot run.

Recommended canonical scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",

    "typegen": "next typegen",
    "typecheck": "npm run typegen && tsc --noEmit",

    "lint": "eslint . --max-warnings=0",
    "lint:fix": "eslint . --fix",

    "lint:styles": "stylelint \"{app,src,components}/**/*.{css,scss}\" --max-warnings=0",
    "lint:styles:fix": "stylelint \"{app,src,components}/**/*.{css,scss}\" --fix",

    "format:check": "prettier --check .",
    "format:write": "prettier --write .",

    "test": "vitest run",
    "test:unit": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:a11y": "playwright test tests/accessibility",
    "test:visual": "playwright test tests/visual",

    "config:validate": "tsx scripts/validate-config.ts",
    "architecture:check": "dependency-cruiser src",

    "check:fast": "npm run typecheck && npm run lint && npm run lint:styles && npm run config:validate",

    "check:ci": "npm run format:check && npm run typecheck && npm run lint && npm run lint:styles && npm run config:validate && npm run architecture:check && npm run test:coverage && npm run test:a11y && npm run test:e2e && npm run build"
  }
}
```

If the project structure does not include one of the listed directories, adjust the Stylelint glob without reducing actual coverage.

## 52.1 Required command behavior

* `npm run lint` must fail on warnings.
* `npm run lint:styles` must fail on warnings.
* `npm run typecheck` must run independently of build.
* `npm run config:validate` must validate all bundled configuration.
* `npm run architecture:check` must enforce dependency direction.
* `npm run build` must run after the faster static checks.
* `npm run check:ci` must represent the merge-level quality gate.

## 52.2 Recommended CI order

```text
Install locked dependencies
→ Configuration validation
→ Formatting check
→ Type generation and typecheck
→ ESLint
→ Stylelint
→ Architecture check
→ Unit and domain tests
→ Accessibility tests
→ End-to-end tests
→ Production build
```

Fast failures should occur before expensive tests.

---

# 53. Change-Risk Classification

Every change must be classified.

## Low risk

Examples:

* isolated text correction;
* approved icon replacement;
* token-only visual adjustment;
* documentation correction.

Required checks:

* typecheck;
* ESLint;
* Stylelint;
* affected tests.

## Medium risk

Examples:

* reusable component;
* navigation;
* filter logic;
* dashboard composition;
* route behavior;
* state management.

Required checks:

* all low-risk checks;
* feature integration tests;
* accessibility review;
* visual regression;
* affected E2E tests.

## High risk

Examples:

* authentication;
* authorization;
* database changes;
* persistence;
* import/export;
* calculations;
* configuration schema;
* migrations;
* critical workflow;
* security behavior.

Required checks:

* full CI;
* security review;
* domain tests;
* migration validation;
* rollback validation;
* critical E2E workflows;
* performance assessment;
* documentation review;
* architecture review.

Risk may be increased by CI or reviewers.

Risk must not be reduced without a documented reason.

---

# 54. Senior Review Gates

## Product gate

Confirms:

* user problem;
* business value;
* expected outcome;
* target user;
* scope;
* success metric;
* configuration opportunities.

## Architecture gate

Confirms:

* module ownership;
* dependency direction;
* domain boundaries;
* configuration boundary;
* security boundary;
* extension model;
* migration;
* rollback.

## UI/UX gate

Confirms:

* information hierarchy;
* primary action;
* accessibility;
* responsive behavior;
* RTL;
* themes;
* loading, empty, error, and success states;
* design-system compliance.

## Engineering gate

Confirms:

* simple implementation;
* no duplication;
* no unnecessary abstraction;
* typed contracts;
* testability;
* performance;
* observability;
* maintainability.

## Release gate

Confirms:

* required checks passed;
* documentation impact declared;
* configuration migration documented;
* release notes completed;
* monitoring available;
* rollback possible.

High-risk work must pass every applicable gate.

---

# 55. Documentation Governance

Documentation is part of the product.

Required documentation structure:

```text
product/
  architecture/
  configuration/
  features/
  calculations/
  decisions/
  releases/
```

Every configurable property must document:

* purpose;
* type;
* default;
* allowed values;
* example;
* validation;
* security implications;
* whether rebuild is required;
* whether restart is required;
* whether it can be changed in the admin interface.

## 55.1 Documentation-impact assessment

Do not update every document mechanically.

Every task must state:

```text
Documentation impact

Updated:
- List affected documents and routes

Not affected:
- List relevant areas that do not require changes

Reason:
- Explain why
```

Update:

* `product/` for product behavior, architecture, calculations, and requirements;
* `/help` for end-user workflow changes;
* `/developer` for APIs, configuration, setup, architecture, and extension behavior;
* `/glossary` when terms are added, changed, or removed;
* release notes for user-facing or operational impact.

## 55.2 Architecture Decision Records

Create an ADR for material architectural decisions.

ADR structure:

```text
Title
Status
Date
Context
Decision
Alternatives considered
Consequences
Migration impact
Review date
```

Examples:

* why SCSS Modules are used;
* why Tailwind is layout-only;
* why metrics are versioned;
* why configuration is schema validated;
* why Jira credentials are not stored;
* why calculations are separate from charts.

---

# 56. Branch and Source-Control Rules

## 56.1 Branch names

Use:

```text
feature/<ticket>-<description>
fix/<ticket>-<description>
refactor/<ticket>-<description>
docs/<ticket>-<description>
chore/<ticket>-<description>
upgrade/<ticket>-<description>
```

## 56.2 Feature branches

Every new feature must use its own branch.

## 56.3 Bug fixes

A bug fix may use the current branch only when it is directly related to that branch’s scope.

Unrelated fixes require a separate branch.

## 56.4 Push requirements

Push code only after applicable local quality gates pass.

Never push:

* secrets;
* temporary debug code;
* failing generated files;
* unresolved lint errors;
* disabled tests;
* undocumented suppressions;
* unrelated changes.

## 56.5 Commit quality

Commits should be:

* focused;
* understandable;
* reversible;
* free of unrelated formatting noise.

Do not combine unrelated refactors with functional changes unless required for the implementation.

---

# 57. Release and Change Management

Every release-impacting change must define:

* user impact;
* configuration impact;
* migration impact;
* database impact;
* monitoring;
* rollout;
* rollback;
* documentation;
* support considerations.

High-risk features should use controlled rollout where appropriate.

A release must not depend on undocumented manual production edits.

Configuration changes must be versioned and auditable.

---

# 58. AI Agent Operating Rules

Every AI agent must behave as a senior contributor, not an uncontrolled code generator.

## 58.1 Before editing

The AI agent must:

1. Inspect the existing repository structure.
2. Read the relevant standards.
3. Inspect the current package versions.
4. Locate existing configuration and registries.
5. Locate existing reusable components.
6. Identify domain modules and schemas.
7. identify affected routes.
8. Identify affected tests.
9. Identify documentation impact.
10. Select the smallest safe change.

## 58.2 AI agents must not

* invent files or directories;
* assume a package is installed;
* invent successful test results;
* claim a command passed without running it;
* disable tests to finish a task;
* weaken ESLint;
* weaken Stylelint;
* weaken TypeScript;
* add `any` without justification;
* add `ts-ignore`;
* add `ts-nocheck`;
* add unexplained lint suppression;
* bypass runtime validation;
* duplicate an existing component;
* hardcode behavior that belongs in configuration;
* introduce unrelated refactors;
* create arbitrary execution through configuration;
* change package versions without reviewing compatibility;
* add dependencies without review;
* overwrite valid user work;
* silently change a business formula;
* silently change a public component API.

## 58.3 After editing

The AI agent must report:

* task summary;
* branch;
* files changed;
* configuration changed;
* schemas changed;
* migrations added;
* tests added or updated;
* documentation updated;
* commands actually executed;
* commands that passed;
* commands that failed;
* existing failures;
* newly introduced risks;
* manual validation still required;
* rollback considerations.

The AI agent must clearly distinguish:

* completed work;
* partially completed work;
* unverified assumptions;
* work that could not be completed.

---

# 59. Third-Party Library Exceptions

When a third-party library requires a JavaScript style object:

1. Confirm the library has no class-based API.
2. Isolate the requirement in one adapter component.
3. Keep the style object outside the main render where possible.
4. Use design-token references.
5. Add a technical comment.
6. Add tests.
7. Prevent the exception from spreading into feature code.

Example:

```tsx
// THIRD-PARTY EXCEPTION:
// The drag library requires transform styles
// supplied through its runtime API.
const draggableStyle = {
  transform:
    provided.draggableProps.style?.transform,
};
```

An exception for one library is not permission to use inline styles elsewhere.

---

# 60. Known Technical Debt — Inline Styles

The following legacy areas contain inline styling from before these standards.

Do not add new inline styling to them.

## 60.1 Audited scope (2026-07-19)

The lists below were re-audited on 2026-07-19 via `eslint . --max-warnings=-1 -f json` (direct ESLint
CLI, not `next lint` — `package.json`'s `lint` script still runs the §4.6-prohibited `next lint`; see
`TODO-List.md` `STYLE-07` for why it can't simply be switched yet). Re-run that command before trusting
these counts; they drift every time a file is touched.

**Result (re-audited same day after STYLE-05 closed): 658 warnings, 0 errors, across 68 files.**
All warnings are `react/forbid-dom-props` (this rule's CLAUDE.md Rule 1 message). The drop from the
2026-07-12 count (1,276/87) is primarily `STYLE-03`/Tier 2 closing (§60.3 — 269 warnings across 8 files
down to 17), `STYLE-04`/Tier 3 closing (§60.4 — 94 warnings across 7 files down to 3, of which 90
warnings across 4 files were dead code deleted rather than refactored), and `STYLE-05`/Tier 4 closing
(§60.5 — 277 warnings across 12 large files down to ~30, all legitimate documented CSS-variable
exceptions), plus incidental drift from unrelated fixes landed in between (e.g.
`app/dashboard/data-quality/page.tsx` gained one new legitimate exception when its CP3-017 sample-size
badge was added).

Full per-file ticket breakdown is tracked in `TODO-List.md` Section 18f (`STYLE-01`–`08`). This section
holds the prioritized summary; TODO-List.md holds the working checklist.

## 60.2 Refactor priority — Tier 1: highest-volume standalone pages — RESOLVED 2026-07-21

~~`app/retro/page.tsx` is done (112 → 0) and dropped from this list.~~

~~1. `app/help/page.tsx` (98)~~
~~2. `app/developer/page.tsx` (80)~~
~~3. `app/data-quality/page.tsx` (71)~~
~~4. `app/flow-health/page.tsx` (66)~~
~~5. `app/forecast/page.tsx` (59)~~

**Resolved 2026-07-21.** This tier stalled for several weeks after `app/retro/page.tsx` while Tiers 2–4
(§60.3–60.5) were completed instead. All 5 remaining files converted: `help.tsx` (98→0) and
`developer.tsx` (80→0) each needed new/extended SCSS modules covering real interactive component state
(accordion open/hover, search-result hover, calc-card expand) — all converted from JS `onMouseEnter`/
`onMouseLeave` style mutation and ternary color-picking to `data-*` attributes resolved via CSS `:hover`
and attribute selectors, per §28. `data-quality.tsx` (71→1) and `flow-health.tsx` (66→2) each had genuine
business-logic color lookups (`BAND_COLOR`/`SEV_COLOR`, bottleneck/aging bar tones) converted to
`data-band`/`data-severity`/`data-tone` attributes; both files' only remaining warnings are documented
`--score-width`/`--bar-width` CSS-variable exceptions. `forecast.tsx` (59→56) turned out to already be
mostly converted from an earlier, undocumented pass — only 4 real violations remained (an SVG
`verticalAlign`, a `trend.color` ternary, two static `marginBottom` overrides), all fixed; the other 56
warnings were already-legitimate exceptions. Repo-wide `react/forbid-dom-props`: 658 → 338 across 62
files. See `TODO-List.md` `STYLE-02` for full per-file detail and branch names.

## 60.3 Refactor priority — Tier 2: `app/dashboard/*/page.tsx` (269 warnings, 8 files)

As of 2026-07-11, `delivery-controls`, `visual-analytics`, and `kanban-health` were **removed** in a nav
consolidation (see RELEASE_NOTES.md) — every widget on those three pages duplicated a chart, table, or
KPI card already shown on a more specific page, so removing them lost no data. `delivery-composition`
and `ownership` were trimmed of their duplicate widgets in the same change (their counts below reflect
that trim, not remediation); `epic-readiness` gained two columns absorbed from `ownership`'s removed
epic table, so its count rose slightly.

A second same-day pass merged two more pairs: `actions` (Smart Actions) into `priority-attention` — both
answered "what needs action right now," one as raw signal tables, the other as generated recommendations
from the same signals — and `sprint-status` + `quarter-statistics` into a single `trends` page with a
Sprints/Quarters toggle, since both answered "how are we trending over time" at different granularity.
12 routed pages became 10.

A third pass on 2026-07-12 merged `delivery-composition` into `data-quality` as a second section (both
were compact single-widget pages; `data-quality`'s count absorbed the donut's warnings). 10 routed pages
became 9.

~~1. `app/dashboard/flow-health/page.tsx` (52)~~
~~2. `app/dashboard/labels/page.tsx` (49)~~
~~3. `app/dashboard/data-quality/page.tsx` (45)~~
~~4. `app/dashboard/epic-readiness/page.tsx` (44)~~
~~5. `app/dashboard/trends/page.tsx` (41)~~
~~6. `app/dashboard/priority-attention/page.tsx` (24)~~
~~7. `app/dashboard/ownership/page.tsx` (13)~~
~~8. `app/dashboard/key-metrics/page.tsx` (1)~~

**Resolved 2026-07-19 — all 8 files converted to SCSS Modules + design tokens.** 269 warnings → 17,
every one of the 17 a legitimate, documented CSS-variable exception (a `--bar-width`/`--bar-delay`/
similar runtime-computed geometry value, per §14.2) — none are unaddressed violations.
`app/dashboard/key-metrics/page.tsx` needed no change at all: its sole warning was already the correct,
documented exception via the shared `barCssVars()` helper. `app/dashboard/priority-attention/page.tsx`
had a partial prior conversion (`.actionCard`/`.actionList` etc. already existed, unused by parts of the
page) — finished rather than restarted. Business-logic color-picking (`HEALTH_COLORS`, `TYPE_COLORS`,
per-threshold hex ternaries) was replaced with semantic `data-*` attributes resolved entirely in SCSS,
per §28 — JS no longer returns color values anywhere in this tier except where a CSS custom property was
the only way to express genuinely dynamic values (bar widths, conic-gradient stops, stagger delays), and
even those pass `var(--token)` references, never raw hex. Added a new `--chart-series-1..6` token set to
`src/styles/_tokens.scss` for `labels`'s issue-type rotating palette — the first token layer entry for
"categorical, non-status" chart colors (§34). See branch `refactor/style-03-tier2-dashboard-pages`.

## 60.4 Refactor priority — Tier 3: shared `src/components/dashboard/**` — RESOLVED 2026-07-19

~~Higher leverage than a single page — these render inside multiple dashboard routes, so one fix
benefits several pages at once. They also carry broader regression risk for the same reason: changes
here need manual verification across every page that mounts the component, not just one route.~~

~~`SprintThroughputPanel.tsx` (33), `KanbanThroughputPanel.tsx` (31), `MidSprintDeliveryPanel.tsx` (21)~~

**Resolved 2026-07-19.** A fresh re-audit found the real scope was 94 warnings/7 files, not the stale
160/14 figure above — most of that gap had already closed via unrelated work between audits. Of those 94,
**90 lived in four components with zero live callers** (`SprintThroughputPanel.tsx` 33,
`KanbanThroughputPanel.tsx` 31, `MidSprintDeliveryPanel.tsx` 21, `DataQualityCard.tsx` 5 — confirmed via
`grep` for both the component name and its import path; the only matches were prose mentions in
`/developer`, not JSX usage). Same shape as `ORPHAN-02`: presented to the owner, who chose deletion over
refactoring dead code. All four removed; their underlying domain types and calculation services
(`throughput.service.ts`, `kanbanFlow.service.ts`, `midSprint.service.ts`) remain live and in active use
by `/forecast`, `/sprint-kanban`, and `SprintVelocityChart` — only the orphaned presentational panels were
deleted, not the domain layer.

The remaining 4 warnings across the 3 actually-live files: `DashboardTopbar.tsx`'s nav-dropdown status dot
was a real violation — a `STATUS_DOT` hex lookup keyed by a fixed `DCShellNavStatus` union
(`critical`/`warning`/`success`/`info`/`neutral`) passed through inline `style={{ background }}`. Replaced
with a `data-status` attribute resolved in SCSS against existing `--color-danger`/`--color-warning`/
`--color-success`/`--color-info` tokens (§28) — the neutral fallback maps to `--color-text-muted` (closest
existing token; no exact prior match existed). `DashboardTopbar.tsx`'s `--drop-top`/`--drop-left` panel
position and `DashboardNavSidebar.tsx`'s `--progress-width` health bar were already correct, documented
`--*`-only exceptions (§14.2) — verified, not changed. `DashboardPageShell.tsx`'s shared `MiniKpiCard`
(`--kpi-bg`/`--kpi-border`/`--kpi-color`/`--delay`) is a generic component taking `color`/`bg`/`border` as
caller-supplied props, not a fixed enum — also a correct exception, verified, not changed.

94 → 3 warnings; all 3 are legitimate exceptions, not remaining violations. `SprintComparePanel.tsx` and
the two files formerly tracked here as orphaned (`DashboardSectionSwitcher.tsx`, `LayoutBuilderPanel.tsx`)
had already dropped out of this tier on 2026-07-18 — deleted as dead code, not refactored — see §60.6a.
See branch `refactor/style-04-tier3-orphans-and-shared-components`.

## 60.5 Refactor priority — Tier 4: remaining standalone pages — RESOLVED 2026-07-19

~~256 warnings across the remaining standalone pages under `app/`. See `TODO-List.md` `STYLE-05` for
the full file list.~~

**Resolved 2026-07-19.** A fresh re-audit found the real scope was 12 large files (sprint-kanban 39,
members 32, portfolio 30, glossary 26, delivery-mix 23, customer 20, charts 18, roadmap 16, teams 14,
release-readiness 13, trends 6 — 277 warnings) plus a ~10-file small remainder at ≤3 warnings each
(admin/audit, column-mapping, summary, work-explorer, promo/**, and all 7 `landing/components/**`
files). All 12 large files converted from JS color lookups (finite health/verdict/status/category
enums) to `data-*` attributes resolved in SCSS (§28), following the same pattern established in
§60.3/§60.4 — `data-tier`/`data-band`/`data-verdict`/`data-status`/`data-health`/`data-cat` depending
on the page's domain vocabulary. Two pages (`sprint-kanban`, `portfolio`) already had partial
CSS-var-exception scaffolding from a prior pass but were piping *colors* through it rather than
resolving them via selectors — fixed to match the established convention (CSS vars reserved for
genuinely runtime-computed geometry only). `charts.tsx` and `teams.tsx` each contain generic,
reusable chart primitives (`HBar`/`VBar`/`AnimatedDonut`/`MiniBar`/`CompareBar`) that take `color` as
a caller-supplied prop from several non-unifiable threshold schemes — left as the sanctioned
"generic component" exception (§14.2), the same treatment already given to `DashboardPageShell`'s
`MiniKpiCard`.

Auditing the small remainder found all of it — `admin/audit`, `column-mapping`, `summary`, and all 7
`landing/components/**` files — was **already** using the correct, documented `--*`-only CSS-variable
exception pattern; zero changes needed (same outcome as `key-metrics/page.tsx` in §60.3).
`promo/page.tsx` and `promo/PromoNav.tsx`'s only warnings are unrelated `@next/next/no-img-element`,
out of scope. `work-explorer/page.tsx` had one tracked warning (already a correct exception) plus two
*untracked* violations the audit surfaced by hand: `style=` passed to the custom `SvgIcon` component
isn't caught by `react/forbid-dom-props` (the rule only inspects native DOM elements), so a 9-way
issue-type color lookup and a static brand-color icon had slipped through undetected. Both fixed —
the type lookup now wraps `SvgIcon` in a `data-type`-carrying `<span>` that resolves color via
`currentColor`; the static color moved directly into its SCSS class.

277 → ~30 warnings across the 12 large files (all legitimate documented exceptions — see individual
`TODO-List.md` `STYLE-05` entries for exact per-file before/after counts). Repo-wide: 807 → 658
warnings, 70 → 68 files. See branch `refactor/style-05-tier4-standalone-pages`.

## 60.5a Refactor priority — Tier 5: remaining shared components — RESOLVED 2026-07-22

`src/components/explore/**`, `src/components/admin/**`, `src/components/dc-shell/**`,
`src/components/tour/**`, and the long tail of files at ≤7 warnings each. Not part of the
`STYLE-05` pass above — Tier 5 targets `src/components/**`, a distinct scope from Tier 4's
`app/**` standalone pages.

**Resolved 2026-07-22.** A fresh re-audit found the real scope was 338 warnings/62 files
repo-wide (not the stale 158/? figure this section previously named), of which the
`src/components/**` share was roughly 20 files. Converted: `DataRetentionSettings.tsx`
(23→0), `AdminConsoleLayout.tsx` (13→2, shared by 6 admin pages — each page's arbitrary
stat-card tone/color destructured into `--tone-bg`/`--tone-color`/`--value-color`
internally, no caller changes needed), `ThemeCustomizerPanel.tsx` (7→2, also fixed a
latent `var(--dc-accent,#2563eb)14` invalid-CSS-concatenation bug — a `var()` call with a
literal alpha suffix silently concatenated onto it, replaced with `color-mix()`),
`DCKpiCard.tsx` (6→0, extended the pre-existing global `.dc-kpi-*` utility classes in
`app/globals.scss` rather than introducing a parallel module), `IssueTypeHierarchySettings.tsx`
(5→5, all now sanctioned per-issue-type admin-color exceptions), `TrendChart.tsx` (5→3),
`ChartCustomizerPanel.tsx`+`SprintVelocityChart.tsx` (4→0, 4→2 — the latter's
`completionColor()` threshold function renamed to `completionBand()` returning a
`'good'|'warning'|'critical'` union instead of a hex string, consumed via `data-band`),
`RelationDetailsTable.tsx`/`RelationLegend.tsx`/`OnboardingChecklist.tsx`/`DataSourceBadge.tsx`/
`KpiCard.tsx`/`MetricConfidenceBadge.tsx`/`SectionNav.tsx`/`ColumnMappingPreview.tsx` (batch
of small files, each 2-4 warnings). `RelationCharts.tsx`/`WorkItemGraph.tsx` were converted
in the same pass but originally counted under this repo's earlier Tier-5 estimate.

**`ORPHAN-05`**: `DCTopbar.tsx`/`DCActionBoard.tsx`/`DCPageSidebar.tsx`/`DeliveryClarityShell.tsx`
(13+6+4 = 23 of Tier 5's tracked warnings) turned out to be dead code — confirmed zero live
callers via `grep`, presented to the owner, deleted rather than converted. `navigation.ts`,
`DCKpiCard.tsx`, and `DCStatusChip.tsx` in the same directory remain live and were converted
normally.

A second audit pass of the files still showing 1 warning each (assumed to already be
sanctioned exceptions from earlier tiers) found 5 were actually real, unconverted
violations: `NotificationBell.tsx` (a fully static `top: 56` value with no runtime
dependency), `AppShell.tsx` (a `STATUS_DOT` hex lookup via inline `style` — the same
pattern already fixed for `DashboardTopbar.tsx`'s equivalent dot in `STYLE-04`, fixed
identically here), `RelationStatsCards.tsx` (a generic `StatCard`'s `color` prop passed as
a raw `style={{ color }}` instead of a `--*` custom property), and
`DataQualitySummary.tsx`/`MissingFieldImpactPanel.tsx` (both had a genuinely dynamic
`width: pct%` that was never actually routed through the required CSS-variable exception —
CLAUDE.md §14.2 requires even runtime-computed values to go through a `--*` property, not
a raw one). `ProductTour.tsx`, `DashboardNavSidebar.tsx`, `DashboardPageShell.tsx`, and
`DashboardTopbar.tsx`'s remaining 1-warning-each were re-verified as genuinely already
correct, documented exceptions from earlier tiers — no change needed.

**`SvgIcon.tsx`'s 1 warning is deliberately left unconverted.** It's the base icon-mask
primitive nearly every component in the codebase renders through, and its `style` prop
merges caller-supplied styling (`...style`) with internally computed, genuinely
per-instance values (icon-mask URL from the `name` prop, width/height from the `size`
prop) — CLAUDE.md §14.3 prohibits object spread in the style exception, and there is no
way to preserve this component's public API (which the entire codebase's "generic
component color passthrough via `style={{ color }}`" pattern depends on) without either
redesigning it — a cross-cutting change touching dozens of call sites, well beyond a
single-file conversion — or silently restructuring the merge to dodge the linter's AST
check without fixing the underlying architectural tension. Left as accepted, documented
technical debt pending a dedicated design decision, not silently converted.

**What looked like `app/**` Tier 4 drift turned out to be a false alarm (`STYLE-09`,
resolved 2026-07-22).** The `app/**` standalone pages Tier 4 (§60.5) claimed resolved down
to ~30 warnings on 2026-07-19 showed ~195 warnings on a fresh raw count (`forecast` 56,
`sprint-kanban` 22, `charts` 13, `portfolio` 13, `customer` 12, `delivery-mix` 11, `roadmap`
9, plus smaller amounts elsewhere) — initially assumed to mean new feature work had
reintroduced real inline styles. A full manual audit of every flagged line in all of these
files found every one was already a correctly-implemented `--*`-only CSS-variable exception;
the raw count simply scales with how much data renders (more sprints/epics/KPIs means more
per-item animated bars, each needing its own delay/color variable) — not with real debt.
The actual problem was tooling, not application code: `react/forbid-dom-props` can only
detect that a `style` prop exists, not inspect what's inside it, so it flags a sanctioned
exception identically to a real violation. Fixed by building a genuine local ESLint rule
(`eslint-local-rules/index.js`, `local-rules/forbid-non-css-var-style`, via the new
`eslint-plugin-local-rules` devDependency) that resolves the `style` value — a literal
object, a same-file variable, or a same-file helper function's returned object — and only
flags it when a key isn't `--`-prefixed or object spread is present (§14.3); it's also
scoped to native/intrinsic elements only, matching the original rule's behavior (custom
components like `SvgIcon`/`Reveal` declare `style` as their own typed prop — a separate,
intentional passthrough pattern, not something this rule governs). Repo-wide:
`react/forbid-dom-props` 338 → 217 (§60.5a's own conversions), then 217 → 3 real
`local-rules/forbid-non-css-var-style` warnings after the rule replaced it — the remaining
3 are `SvgIcon.tsx` (accepted debt, above), a cross-file helper call the rule doesn't
attempt to resolve, and a `useState`-driven value set imperatively in a `useLayoutEffect`
(both already manually verified correct). `npm run lint` (§4.6/§52) now runs
`eslint . --max-warnings=8` (the 3 above plus 5 pre-existing, unrelated
`@next/next/no-img-element` warnings) — see `STYLE-07`.

## 60.6 Resolved: legacy `frontend/` Create React App (removed 2026-07-14)

`frontend/` was a second, fully standalone Create React App project (own `package.json`, `node_modules`,
`build`, `react-scripts`) — not part of the Next.js app, not imported by or referenced from `app/` or
`src/` anywhere, last touched 2026-05-30. Running ESLint from the repo root reached into it anyway (since
nothing excluded it) and applied this project's Next.js-oriented rules to a project that wasn't one — it
contributed 59 of the then-1,281 warnings under that mismatch. **Resolved via `TODO-List.md` `ORPHAN-01`**
during the full-application product audit (`docs/product-audit/04-remove-merge-keep.md` R-10): explicit
owner decision made to remove `frontend/`, `backend/` (a second, separate Express API server, discovered
alongside `frontend/` during the same audit), and `promotion/` (static marketing assets, unrelated to the
live `app/promo/` route) — all three confirmed unreferenced by the live app, `render.yaml`,
`docker-compose.yml`, or any CI config before deletion. Removing `frontend/` also resolved the 59-warning
lint-scope mismatch as a side effect — the §60.1 baseline warning count no longer needs to exclude it.

## 60.6a Resolved: orphaned dashboard components deleted (2026-07-18)

`src/components/dashboard/DashboardSectionSwitcher.tsx` and `LayoutBuilderPanel.tsx` (and the
`section-*` ids in `src/lib/dashboardSections.ts` they read) were not imported or mounted by any route
under `app/` — discovered while auditing `app/dashboard/*` for the 2026-07-11 nav consolidation above.
A later pass found four more files in the same directory with zero live callers:
`DraggableMetricTable.tsx`, `SaveSnapshotButton.tsx`, `SprintComparePanel.tsx`, `WhatChangedPanel.tsx`.
**Resolved 2026-07-18**: explicit owner decision made to delete all six (1,118 lines), plus
`src/lib/dashboardSections.ts` and `src/lib/layoutBuilder.ts` (fully orphaned once their only two
consumers were gone) and their 2 dedicated test files — re-verified zero references before deleting.
See `TODO-List.md` `ORPHAN-02` for full detail and the branch name.
`src/components/dashboard/DashboardSidebarNav.tsx` was deliberately left untouched — it was never part
of this finding's scope, and its SCSS module turned out to still be live (imported by the current
`DashboardNavSidebar.tsx` under the old filename) — that `.tsx`-only orphan question remains open,
tracked separately in `ORPHAN-02`.

When refactoring a page:

* create `page.module.scss`;
* move custom presentation into the module;
* use design tokens;
* use CSS custom properties only for validated runtime dimensions;
* move repeated JSX into typed components;
* move repeated data into configuration;
* preserve behavior;
* add regression tests;
* avoid unrelated page redesign unless approved.

---

# 61. Progressive Technical-Debt Rule

Technical debt must be reduced when related code is changed.

Do not use a small task as justification for rewriting an unrelated subsystem.

When touching legacy code:

* do not make it worse;
* do not add new violations;
* improve directly affected code when safe;
* document deferred issues;
* avoid expanding scope without approval.

---

# 62. Priority Rules

* P0 work has the highest weight.
* P0 work does not permanently block all P1–P4 work.
* Delivery decisions must consider urgency, risk, dependency, value, and available capacity.
* Priority must not be used to bypass security, data integrity, or critical quality gates.
* Emergency exceptions must be documented and followed by corrective work.

---

# 63. Full Definition of Done

A task is not complete until all applicable items pass.

## 63.1 Product

* [ ] The user or operational problem is defined.
* [ ] The target user is identified.
* [ ] Acceptance criteria are satisfied.
* [ ] Scope boundaries are clear.
* [ ] Success can be measured.
* [ ] Configuration opportunities were evaluated.
* [ ] No unrelated product behavior was added.

## 63.2 Architecture

* [ ] The feature has a clear module and owner.
* [ ] Dependencies follow approved direction.
* [ ] No circular dependencies exist.
* [ ] Domain logic is separated from rendering.
* [ ] Runtime data is schema validated.
* [ ] Server and client boundaries are appropriate.
* [ ] Configuration is used where appropriate.
* [ ] Configuration does not allow arbitrary execution.
* [ ] Existing extension points are reused.
* [ ] No unnecessary abstraction was introduced.
* [ ] No duplicated business logic was introduced.

## 63.3 Configuration

* [ ] Configuration is typed.
* [ ] Configuration is runtime validated.
* [ ] Defaults are defined.
* [ ] Schema version is defined.
* [ ] Migration exists when required.
* [ ] Invalid configuration fails safely.
* [ ] Last known valid recovery is supported where applicable.
* [ ] Configuration changes are auditable.
* [ ] Zero-code-change opportunities were used appropriately.

## 63.4 Code quality

* [ ] Code is readable and intentionally named.
* [ ] No spaghetti or galaxy code was introduced.
* [ ] Functions and components have focused responsibilities.
* [ ] No unrelated files were modified.
* [ ] No uncontrolled shared utilities were introduced.
* [ ] No `any` was introduced without approval.
* [ ] No `ts-ignore` or `ts-nocheck` was added.
* [ ] No unexplained lint suppression was added.
* [ ] No tests were disabled.
* [ ] Public APIs are typed and stable.
* [ ] Complex logic has focused tests.

## 63.5 Styling

* [ ] No prohibited inline styles exist.
* [ ] Permitted style objects contain only documented `--*` custom properties.
* [ ] Custom appearance is in SCSS Modules.
* [ ] Tailwind is used only for approved layout utilities.
* [ ] No arbitrary Tailwind values were introduced.
* [ ] Design tokens are used.
* [ ] No hardcoded colors exist outside the token layer.
* [ ] No duplicated component CSS was introduced.
* [ ] Dynamic values are validated and clamped.
* [ ] Theme compatibility is preserved.

## 63.6 UI/UX

* [ ] The page has a clear purpose.
* [ ] The primary action is identifiable.
* [ ] Information hierarchy is consistent.
* [ ] Responsive behavior is implemented.
* [ ] Mobile, tablet, and desktop layouts are checked.
* [ ] English LTR behavior is checked.
* [ ] Arabic RTL behavior is checked where applicable.
* [ ] Long-content behavior is checked.
* [ ] Loading state exists.
* [ ] Empty state exists.
* [ ] Error state exists.
* [ ] Disabled state exists where applicable.
* [ ] Success feedback exists where applicable.
* [ ] Configuration cannot generate an unsupported layout.

## 63.7 Accessibility

* [ ] Semantic HTML is used.
* [ ] Keyboard operation is verified.
* [ ] Focus visibility is present.
* [ ] Focus behavior is predictable.
* [ ] Icon-only controls have accessible names.
* [ ] State is not communicated by color alone.
* [ ] Dynamic visualizations expose accessible values.
* [ ] Motion respects reduced-motion preferences.
* [ ] 200% zoom remains usable.
* [ ] Automated accessibility tests pass.
* [ ] No new critical or serious accessibility issue exists.

## 63.8 Security and privacy

* [ ] Authorization is enforced on the server.
* [ ] External data is validated.
* [ ] Upload type, content, and size are validated.
* [ ] CSV and spreadsheet export is safe.
* [ ] No secret is exposed to the client.
* [ ] Configuration URLs are validated.
* [ ] Sensitive content is not unnecessarily logged.
* [ ] Data-retention impact is understood.
* [ ] Audit requirements are satisfied.

## 63.9 Performance

* [ ] Client boundaries are minimized.
* [ ] No unnecessary client-side fetching exists.
* [ ] No unnecessary state duplication exists.
* [ ] No expensive transformation runs repeatedly without reason.
* [ ] Large lists are paginated or virtualized where required.
* [ ] Configuration is not repeatedly parsed.
* [ ] Bundle impact is acceptable.
* [ ] Rendering impact is acceptable.
* [ ] Performance budgets remain satisfied.

## 63.10 Testing

* [ ] Domain tests pass.
* [ ] Configuration tests pass.
* [ ] Component tests pass.
* [ ] Integration tests pass where applicable.
* [ ] Critical E2E tests pass.
* [ ] Accessibility tests pass.
* [ ] Visual tests pass where applicable.
* [ ] Edge cases and invalid inputs are tested.
* [ ] Existing failures are distinguished from introduced failures.

## 63.11 Commands

* [ ] `npm run config:validate` passes.
* [ ] `npm run architecture:check` passes.
* [ ] `npm run format:check` passes.
* [ ] `npm run typecheck` passes.
* [ ] `npm run lint` passes with zero warnings.
* [ ] `npm run lint:styles` passes with zero warnings.
* [ ] Required automated tests pass.
* [ ] `npm run build` passes.
* [ ] No command is reported as successful unless it was actually executed successfully.

## 63.12 Documentation and delivery

* [ ] Documentation impact is declared.
* [ ] Relevant `product/` documents are updated.
* [ ] Relevant `/help` content is updated.
* [ ] Relevant `/developer` content is updated.
* [ ] Relevant `/glossary` content is updated.
* [ ] Calculation documentation is updated where applicable.
* [ ] Release notes describe user impact.
* [ ] Configuration migration is documented.
* [ ] Monitoring is defined.
* [ ] Rollback is possible.
* [ ] Changed files are listed.
* [ ] Code is pushed only after applicable checks pass.

---

# 64. Final Engineering Principle

Delivery Clarity must be easy to understand before it is easy to extend.

It must be easy to configure before it is easy to customize.

It must be easy to maintain before it is made technically impressive.

The following should normally require configuration rather than component rewrites:

* content;
* navigation;
* dashboard composition;
* labels;
* thresholds;
* role visibility;
* theme values;
* filters;
* feature rollout;
* help references.

New business capabilities require explicit, typed, tested, reviewed code.

Configuration selects approved capabilities.

Configuration does not create arbitrary capabilities.

Every change must leave Delivery Clarity:

* simpler or no more complex than necessary;
* modular;
* typed;
* validated;
* accessible;
* secure;
* observable;
* testable;
* configurable;
* expandable;
* reversible;
* understandable by the next engineer.
