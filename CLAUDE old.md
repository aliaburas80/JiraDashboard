# Delivery Clarity — Permanent Engineering Standards

> These rules apply to **every** frontend change, refactor, review, or new feature.
> They are enforced by ESLint, Stylelint, TypeScript, and CI — not just convention.

---

## Design System & Styling Architecture Guardian

Every developer and AI agent working on this codebase acts simultaneously as:
- Senior Frontend Engineer
- SCSS Architect
- Design-System Governance Lead
- Accessibility Engineer
- Performance Engineer

The guardian role ensures every change:
- Contains **no inline styles**
- Uses **SCSS modules** for all custom component styling
- Uses **Tailwind** only for approved utility-level layout
- Uses **design tokens** (CSS custom properties) — never hardcoded hex values
- Produces **dynamic, configurable** components — never static, page-specific ones
- Eliminates **duplicated CSS and JSX**
- Remains **responsive, accessible, and theme-ready**

---

## Rule 1 — Inline Styles Are Prohibited

The `style` prop on any JSX element is **forbidden** except for one documented exception.

### Forbidden
```tsx
<div style={{ background: '#fff', padding: 16 }} />
<div style={computedStyleObject} />
<style jsx>{`.card { padding: 16px; }`}</style>
element.style.color = 'red';
```

### Permitted exception — CSS custom properties only
When a value is genuinely dynamic (comes from data, not design), pass it via CSS custom properties:
```tsx
// ONLY --prefixed keys are permitted in the style prop
<div
  className={styles.barFill}
  style={{ '--bar-width': `${pct}%`, '--bar-color': color } as CSSProperties}
/>
```
The SCSS rule consumes these:
```scss
.barFill {
  width: var(--bar-width, 0%);
  background: var(--bar-color, var(--color-primary));
  // all other visual properties in SCSS
}
```
SVG presentation attributes (`stroke`, `strokeDasharray`, `fill`) are SVG attributes — not CSS style props — and remain as JSX attributes.

**Document every use of the CSS custom property exception with a comment explaining why JS must supply the value.**

---

## Rule 2 — Tailwind for Layout Utilities Only

Tailwind is for layout, not design identity.

### Use Tailwind for
- Flexbox/Grid (`flex`, `grid`, `items-center`, `gap-4`)
- Simple responsive arrangement (`lg:grid-cols-4`)
- Basic spacing utilities (`p-4`, `mb-2`)
- Visibility (`hidden`, `sr-only`)
- Basic display (`block`, `inline-flex`)

### Do NOT use Tailwind for
- Hardcoded hex colors: `bg-[#F23A18]`
- Arbitrary widths: `w-[437px]`
- Long class strings copied across components (extract to SCSS instead)
- Complex animations, sticky positioning, z-index layering
- Component visual identity (colors, borders, shadows, typography hierarchy)

---

## Rule 3 — Hybrid Architecture (Tailwind layout + SCSS identity)

```
Tailwind  →  utility layout (flex, grid, spacing, responsive)
SCSS      →  component appearance, tokens, animations, interactions
```

---

## Rule 4 — SCSS File Structure

```
src/
  styles/
    _tokens.scss        ← CSS custom properties (single source of truth)
    _mixins.scss        ← respond-to(), focus-visible(), status-variant()
    _animations.scss    ← shared keyframes (referenced by globals.scss)

  components/
    ComponentName/
      ComponentName.tsx
      ComponentName.module.scss   ← required when custom styling exists
```

One SCSS module per component. Global stylesheets only for resets, root tokens,
and typography. Never put page-specific styles in global files.

---

## Rule 5 — Design Tokens

All visual values come from `src/styles/_tokens.scss` CSS custom properties.

**Never hardcode** colors, radii, shadows, z-indices, header height, sidebar width,
spacing, or typography sizes directly in SCSS or JSX.

Key tokens (see `src/styles/_tokens.scss` for full list):
```scss
--color-primary: var(--dc-accent)
--color-surface: var(--dc-s1)
--color-border: var(--dc-bdr)
--header-height: 52px
--sidebar-width: 228px
--toolbar-height: 52px
--z-header: 500
--z-toolbar: 40
--z-dropdown: 600
--z-modal: 9999
```

---

## Rule 6 — Dynamic Components

Every reusable component must accept typed props — never hardcode content.

```tsx
// ✅ Correct
<MetricCard label="Completion" value="36%" status="warning" />

// ❌ Forbidden
function CompletionCard() {
  return <div style={{ color: '#D97706' }}>36% Completion</div>;
}
```

Typed variant pattern:
```tsx
type Status = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
<Badge variant="warning">{label}</Badge>
```

SCSS:
```scss
.badge { /* base */ }
.badge--warning { color: var(--color-warning); background: var(--color-warning-soft); }
```

---

## Rule 7 — Data-Driven Rendering

Menus, sidebar sections, filters, cards, and actions are rendered from
configuration arrays — never repeated manually in JSX.

```tsx
// ✅ Correct
const SIDEBAR_SECTIONS = [ ... ];
SIDEBAR_SECTIONS.map(section => <SidebarSection key={section.id} {...section} />)

// ❌ Forbidden
<NavItem href="/dashboard/summary" ... />
<NavItem href="/dashboard/priority-attention" ... />
// (15 more hardcoded items)
```

---

## Rule 8 — Dynamic Numeric Visualizations

Progress widths, bar heights, and chart dimensions that come from data
must use the CSS custom property exception (Rule 1), not direct style props.

```tsx
// ✅ Correct
<div className={styles.barFill} style={{ '--bar-width': `${pct}%` } as CSSProperties} />

// ❌ Forbidden
<div style={{ width: `${pct}%`, background: '#2563eb', height: '8px' }} />
```

For status-driven appearance, use data attributes:
```tsx
<div className={styles.healthDot} data-status={status} />
```
```scss
.healthDot[data-status="critical"] { background: var(--color-danger); }
```

---

## Rule 9 — No Hardcoded Layout Assumptions

Use tokens for all dimensional values:
```scss
// ✅ Correct
top: var(--header-height);
width: var(--sidebar-width);

// ❌ Forbidden
top: 52px;
width: 228px;
```

---

## Rule 10 — Class Composition with clsx

`clsx` is installed. Use it for conditional class composition.

```tsx
// ✅ Correct
className={clsx(styles.chip, styles[`chip--${variant}`], { [styles['chip--active']]: active })}

// ❌ Forbidden
className={active ? 'a b c d e f' : disabled ? 'x y z' : 'p q r'}
```

---

## Rule 11 — Accessibility

Every styled element must:
- Have a visible `:focus-visible` outline (use `var(--color-primary)`)
- Not communicate state through color alone
- Use semantic HTML (`<button>`, `<a>`, `<nav>`, `<aside>`, etc.)
- Have `aria-label` for icon-only actions
- Respect `prefers-reduced-motion`

```scss
// Required in every interactive component module
.interactive:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--dc-accent) 60%, transparent);
  outline-offset: 2px;
}
```

---

## Rule 12 — Business Logic ≠ CSS

Business logic produces semantic results — never hex codes or class strings.

```ts
// ✅ Correct
const status: 'healthy' | 'warning' | 'critical' = getHealthStatus(score);

// ❌ Forbidden
const color = score > 75 ? '#059669' : score > 40 ? '#D97706' : '#DC2626';
```

---

## Rule 13 — Future-Proofing

Every component must support without rewriting:
- Additional status values
- New menu items (from config, not hardcoded JSX)
- Light + dark themes (tokens abstract the color)
- Role-specific visibility
- Mobile + desktop layouts
- Empty, loading, error, and success states

---

## Rule 14 — Exceptions (Third-Party Libraries)

When a library absolutely requires a JS style object:
1. Confirm no class API exists
2. Isolate inside one adapter component
3. Declare the object outside render
4. Use design tokens inside the object
5. Comment the technical reason

```tsx
// EXCEPTION: react-beautiful-dnd requires style object for drag transforms
const draggableStyle = { transform: provided.draggableProps.style?.transform };
```

---

## Rule 15 — Definition of Done

A frontend task is **not complete** unless:
- [ ] Zero inline `style` props (except CSS custom property exception)
- [ ] All custom styling in SCSS modules
- [ ] Tailwind used only for layout utilities
- [ ] All values from design tokens
- [ ] Components accept typed props (no hardcoded content)
- [ ] Responsive behaviour implemented
- [ ] Accessibility requirements met
- [ ] `npx next build` passes
- [ ] `npx next lint` passes (no new errors)
- [ ] `npx stylelint 'src/**/*.scss'` passes

---

## Known Tech Debt (Inline Styles)

The following files contain inline styles from before these rules were adopted.
They must be progressively migrated — **do not add new inline styles to them**.

### Pages (high volume)
- `app/dashboard/*/page.tsx` — all 15 pages use inline styles for bar charts and layout
- `app/admin/users/page.tsx` — full page written with inline styles
- `app/admin/settings/page.tsx` — uses AppShell + inline styles

### Priority refactor order
1. `app/dashboard/flow-health/page.tsx` (most complex)
2. `app/dashboard/ownership/page.tsx`
3. `app/dashboard/labels/page.tsx`
4. `app/dashboard/epic-readiness/page.tsx`
5. Remaining dashboard pages (1 page per session)

When refactoring a page, create `app/dashboard/[page]/page.module.scss` and
move all inline styles into it, using CSS custom properties for dynamic values.

---

## After-Execution Memory Rules (from previous sessions)

- After every task: push code to branch + update product/docs
- Every feature must update ALL product/ files AND /help, /developer, /glossary routes
- Each new feature gets its own branch; bug fixes push immediately to current branch
- P0 has highest weight but no longer blocks P1-P4 work
