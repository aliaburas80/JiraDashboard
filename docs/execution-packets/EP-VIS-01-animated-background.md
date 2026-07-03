# EP-VIS-01 — Animated Data-Flow Background + Visual Redesign

```
Execution Packet ID:   EP-VIS-01
Title:                 Animated Data-Flow Background + Visual Redesign
Priority:              P1 — Brand and first-impression quality
MVP Classification:    Launch quality — affects every new user's first impression
Dependencies:          EP-011 (register page exists), EP-014 (terms/privacy exist)
Approved By:           Ali Abu Ras (Product Owner)
Status:                Ready for Codex
```

---

## Business Objective

Every new user's first interaction with Delivery Clarity is the login or registration page.
A generic form gives no signal about what the product does. An animated data-flow
background communicates instantly — "this is a live delivery analytics platform" —
before a single word is read.

The animation must feel like the product itself: work items flowing through a delivery
pipeline, nodes connecting and releasing, metrics emerging from data. Not generic
particle effects. Purpose-built, delivery-inspired motion.

---

## Required Outcome

After this packet:

1. `/login`, `/register`, `/terms`, `/privacy` all share a fullscreen animated
   Canvas background — 50 floating nodes connected by dissolving lines.
2. The form/content card floats above the animation using glass morphism.
3. The animation stops completely and is replaced by a static gradient when
   `prefers-reduced-motion: reduce` is set.
4. The Canvas resizes correctly on window resize.
5. The animation fades in over 800ms on page load (no abrupt start).
6. Performance: 60fps on modern hardware. The animation loop never blocks the main thread.
7. `tsc --noEmit` passes. `npm test` passes. `next build` passes.

---

## Scope

**Included:**
- `src/components/ui/AnimatedDataBackground.tsx` — shared Canvas component
- `src/components/ui/AnimatedDataBackground.module.scss`
- Applying the component to login, register, terms, privacy pages
- Glass morphism card style applied to login and register cards
- Updated `app/login/page.tsx` — add background, update card styling
- Updated `app/register/page.tsx` — add background, update card styling
- Updated `app/terms/page.tsx` — add background, update card styling
- Updated `app/privacy/page.tsx` — add background, update card styling
- Updated SCSS modules for all four pages

**Explicit exclusions:**
- Do NOT touch any dashboard pages, admin pages, or any other routes
- Do NOT add any npm dependencies
- Do NOT change the form logic, API calls, or validation
- Do NOT modify any API routes
- Do NOT modify tests unless a test breaks due to the new component
- Do NOT add PDF download (that is EP-VIS-02)
- Do NOT add language switching (that is EP-I18N-01)

---

## Animation Specification (Canvas)

### Component interface

```tsx
// src/components/ui/AnimatedDataBackground.tsx
'use client';

interface AnimatedDataBackgroundProps {
  className?: string;
}

export function AnimatedDataBackground({ className }: AnimatedDataBackgroundProps) {
  // Canvas fills the container (position: absolute, inset: 0)
  // Returns null when prefers-reduced-motion is true
}
```

### Node definition

```typescript
interface Node {
  x:       number; // 0 to canvas.width
  y:       number; // 0 to canvas.height
  vx:      number; // velocity x, range -0.4 to 0.4
  vy:      number; // velocity y, range -0.4 to 0.4
  radius:  number; // 2 to 5
  type:    'primary' | 'secondary' | 'accent'; // see colors below
  opacity: number; // 0.4 to 1.0
  pulse:   number; // 0 = not pulsing, 1 = peak pulse. Increments by 0.02 each frame when triggered.
}
```

### Colors

```typescript
const COLORS = {
  background: '#050508',         // near black with subtle blue tint
  nodePrimary:  'rgba(232, 93, 18, 0.85)',   // dc-accent orange — 60% of nodes
  nodeSecondary: 'rgba(99, 179, 237, 0.65)', // soft blue — 30% of nodes
  nodeAccent:   'rgba(255, 255, 255, 0.5)',  // white — 10% of nodes
  connectionBase: 'rgba(255, 255, 255, 0.04)',
  connectionActive: 'rgba(232, 93, 18, 0.18)',
  pulseGlow: 'rgba(232, 93, 18, 0.5)',
};
```

### Algorithm

```
INITIALIZATION:
  NODE_COUNT = 52
  MAX_DISTANCE = 160 (pixels — nodes within this distance draw a connecting line)
  
  For each node:
    x = random(0, canvas.width)
    y = random(0, canvas.height)
    vx = random(-0.3, 0.3) — exclude values close to 0
    vy = random(-0.3, 0.3) — exclude values close to 0
    radius = random(2, 4.5)
    type = weighted random: 60% primary, 30% secondary, 10% accent
    opacity = random(0.5, 1.0)
    pulse = 0

EACH FRAME:
  1. Fill background: ctx.fillStyle = COLORS.background; ctx.fillRect(0, 0, w, h)
  
  2. Apply global alpha = Math.min(1, frame / 48) for 800ms fade-in
     (frame counter increments each RAF call; at 60fps, 48 frames ≈ 800ms)
  
  3. For every pair of nodes (i, j where j > i):
     dist = distance(node[i], node[j])
     if dist < MAX_DISTANCE:
       lineOpacity = (1 - dist / MAX_DISTANCE) * 0.6
       // Stronger line if either node is pulsing
       if node[i].pulse > 0 or node[j].pulse > 0:
         lineOpacity *= 1.8
         ctx.strokeStyle = COLORS.connectionActive
       else:
         ctx.strokeStyle = COLORS.connectionBase
       ctx.globalAlpha = lineOpacity * fadeIn
       ctx.beginPath()
       ctx.moveTo(node[i].x, node[i].y)
       ctx.lineTo(node[j].x, node[j].y)
       ctx.lineWidth = 0.8
       ctx.stroke()
  
  4. For each node:
     a. Draw glow if pulsing:
        if node.pulse > 0:
          gradient = radialGradient at (node.x, node.y) from 0 to radius*5
          inner stop: pulseGlow at alpha node.pulse * 0.4
          outer stop: transparent
          fill circle of radius radius*5
     
     b. Draw node circle:
        ctx.globalAlpha = node.opacity * fadeIn
        ctx.fillStyle = COLORS[node.type]
        ctx.beginPath()
        ctx.arc(node.x, node.y, node.radius + (node.pulse * 1.5), 0, Math.PI * 2)
        ctx.fill()
     
     c. Update position:
        node.x += node.vx
        node.y += node.vy
        // Bounce off edges with slight damping
        if node.x < node.radius or node.x > width - node.radius: vx *= -1
        if node.y < node.radius or node.y > height - node.radius: vy *= -1
     
     d. Update pulse:
        if node.pulse > 0: node.pulse = max(0, node.pulse - 0.015)
        // Randomly trigger pulse: 1 in 2000 chance per frame per node
        if random() < 0.0005 and node.pulse === 0: node.pulse = 1.0
  
  5. Request next frame

RESIZE:
  Use ResizeObserver on the canvas container div.
  On resize: canvas.width = container.offsetWidth; canvas.height = container.offsetHeight
  Re-randomise node positions to stay within new bounds (clamp, do not teleport).
```

### Reduced motion

```typescript
// Use window.matchMedia('(prefers-reduced-motion: reduce)')
// If true: do NOT start the animation loop. Return a static div with background color only.
// Also listen for changes in case the user toggles it at runtime.
```

### Component structure

```tsx
<div className={clsx(styles.root, className)}>
  <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
</div>
```

```scss
// AnimatedDataBackground.module.scss
.root {
  position:  absolute;
  inset:     0;
  overflow:  hidden;
  z-index:   0;
}
.canvas {
  display:    block;
  inline-size: 100%;
  block-size:  100%;
}
```

---

## Page Layout Specification

### Wrapper pattern (same for all 4 pages)

```tsx
<div className={styles.page}>
  <AnimatedDataBackground className={styles.bg} />
  <div className={styles.content}>
    {/* card or legal content */}
  </div>
</div>
```

```scss
.page {
  position:  relative;
  min-block-size: 100vh;
  background: #050508; // fallback when canvas not available
  overflow:  hidden;
}
.bg {
  // inherits absolute inset: 0 from component
}
.content {
  position: relative;
  z-index:  1;
  // padding and centering as currently implemented
}
```

### Glass card (login + register pages)

The existing `.card` class should become glass morphism:

```scss
.card {
  background:        rgba(10, 10, 14, 0.75);
  backdrop-filter:   blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border:            1px solid rgba(255, 255, 255, 0.10);
  border-radius:     20px;
  padding:           clamp(28px, 5vw, 44px);
  box-shadow:
    0 0 0 1px rgba(232, 93, 18, 0.06),
    0 32px 80px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
```

### Legal pages (terms + privacy) — content container

The legal content pages are long-form text. The background animates behind a
semi-transparent content layer:

```scss
.page {
  position:       relative;
  min-block-size: 100vh;
  background:     #050508;
  overflow:       hidden;
}
.inner {
  position:        relative;
  z-index:         1;
  max-inline-size: 720px;
  margin-inline:   auto;
  padding:         48px 24px 80px;
  // Glass panel behind the text
  background:      rgba(5, 5, 8, 0.7);
  backdrop-filter: blur(12px);
}
```

The `.bg` (AnimatedDataBackground) should run at a subtle opacity on the legal pages
so the text remains readable. Achieve this by wrapping the canvas in a slightly dimmed
overlay:

```scss
// On terms and privacy pages, add an overlay that dims the background slightly
.bgDim::after {
  content:    '';
  position:   absolute;
  inset:      0;
  background: rgba(5, 5, 8, 0.4);
  z-index:    0;
}
```

---

## Files to create/modify

### New
- `src/components/ui/AnimatedDataBackground.tsx`
- `src/components/ui/AnimatedDataBackground.module.scss`

### Modified
- `app/login/page.tsx` — import and add AnimatedDataBackground, update layout
- `app/login/` — create `page.module.scss` if missing, or update existing login styling
- `app/register/page.tsx` — import and add AnimatedDataBackground
- `app/register/page.module.scss` — update card to glass morphism
- `app/terms/page.tsx` — import and add AnimatedDataBackground with dim overlay
- `app/terms/page.module.scss` — update .page and .inner for glass effect
- `app/privacy/page.tsx` — import and add AnimatedDataBackground with dim overlay
- `app/privacy/page.module.scss` — same as terms

### Prohibited
- No changes to any `app/dashboard/` files
- No changes to any `app/admin/` files
- No changes to any `app/api/` files
- No new npm packages in `package.json`
- No changes to `middleware.ts`
- No changes to `prisma/schema.prisma`

---

## Accessibility requirements

- `<canvas>` must have `aria-hidden="true"` — it is purely decorative
- The animation must not cause flashing faster than 3 times per second (compliant with WCAG 2.3.1)
- When `prefers-reduced-motion: reduce` is active, the Canvas must not animate
- All form elements and text must remain fully readable above the background
- Minimum contrast ratio 4.5:1 for form labels and body text against the background

---

## Performance requirements

- Animation loop must use `requestAnimationFrame`
- Cancel RAF on component unmount (cleanup in `useEffect` return)
- No DOM manipulation inside the animation loop — only Canvas API calls
- Target 60fps. The algorithm O(n²) for n=52 nodes is acceptable (1326 distance checks per frame)
- Canvas dimensions set once on mount and on resize, not every frame

---

## Login page notes

The login page (`app/login/page.tsx`) currently uses Tailwind utility classes extensively
for its layout. When applying the animated background:

1. Keep all existing form logic, state, validation, and API calls completely unchanged
2. Only add the `<AnimatedDataBackground />` element as the first child of the outermost container
3. Ensure the outermost container has `position: relative` (add a wrapper div if needed)
4. Update the card container's background/border/shadow to match the glass morphism spec above
5. The Tailwind classes used for internal layout (`flex`, `items-center`, `gap-`, etc.) may stay

---

## Required commands after implementation

```bash
npx tsc --noEmit
npm test -- --runInBand
npx next build
npx stylelint "{app,src}/**/*.{css,scss}" --max-warnings=0
```

---

## Completion evidence required

1. Screenshots (or description) of login, register, terms, and privacy pages with the animation visible
2. Confirmation that `prefers-reduced-motion` correctly disables animation
3. Confirmation that canvas resizes correctly on viewport change
4. All required commands passed (exact output)
5. No new npm packages added
6. No existing tests broken

---

## Stop conditions

Stop and return to Claude if:
- Implementing the animation requires a new npm dependency
- Any existing test fails and the cause is not obvious
- The login page form logic needs to be changed (it must not be)
- Performance on a test device drops below 30fps (reduce NODE_COUNT to 35)
- `backdrop-filter` causes the card to be unreadable on any tested browser
