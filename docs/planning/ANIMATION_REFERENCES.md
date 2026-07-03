# Animation & Background Design References

Saved 2026-07-03. Use these for future background/animation decisions.

| Reference | What to study |
|---|---|
| https://animejs.com/ | Precise easing curves, staggered motion, SVG morphing, timeline control |
| https://www.vantajs.com/?effect=waves | Layered 3D wave mesh, dark navy palette, filled wave layers, depth |
| https://www.shadcn.io/background | Aurora gradient bleeds, dot grids, minimal motion |
| https://github.com/topics/animated-backgrounds?l=javascript&o=asc&s=forks | Canvas particle systems, constellation effects, geometric patterns |
| https://onaircode.com/javascript-html5-canvas-animated-background/ | HTML5 Canvas techniques: Matrix rain, particles, geometric animations |
| https://freefrontend.com/javascript-background-effects/ | Full catalogue: aurora, starfield, noise fields, wave forms |

## Key patterns observed

### Vanta waves (most applicable to Delivery Clarity)
- Background: very dark navy `#020817` or `#0a0e1a`
- 4-6 overlapping wave layers with different amplitudes, frequencies, phases, speeds
- Each wave is a FILLED shape (fills from curve to bottom) at 5-15% opacity
- Colors: orange accent, blue accent, subtle purple — all at low opacity so they layer
- Motion is very slow (phase increment 0.004-0.012 per frame)
- Effect: feels like 3D depth, like water or data flowing

### anime.js style
- Staggered timing on individual elements (each particle enters at t + i*50ms)
- Precise cubic-bezier easing instead of linear motion
- Clean, purposeful — every motion communicates something

### Aurora (shadcn / freefrontend)
- Large radial/conic CSS gradients animated via background-position
- Blurred blobs of colour that shift slowly
- Pairs well with dot grids
- Pure CSS — no Canvas — lowest performance cost

## Applied to Delivery Clarity

The product metaphor: **data flowing through a delivery pipeline**.
Best match: **layered sine wave curves** (stroked, not filled — feels like ECG/signal data, not ocean).
Background: `#050b16` (deeper than current `#080d1a`) so waves have more contrast.
Wave colours: orange `rgba(232,93,18,0.20)`, blue `rgba(59,130,246,0.16)`, purple `rgba(139,92,246,0.10)`, silver `rgba(255,255,255,0.06)`.
