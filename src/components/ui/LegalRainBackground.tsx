'use client';
// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Arrow-rain background for legal pages.
// Draws the chevron from public/icons/0012-svg-0012.svg rotated 90° CW so the
// sharp edge points DOWN, then animates them falling like data rain.
// position: fixed so the rain fills the viewport while the user scrolls the text.
// No npm dependencies. Respects prefers-reduced-motion.

import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import styles from './LegalRainBackground.module.scss';

interface Props { className?: string }

// Path from public/icons/0012-svg-0012.svg — right-pointing chevron in 16×16 viewBox.
// ctx.rotate(Math.PI / 2) turns it into a down-pointing chevron (rain direction).
const CHEVRON = 'm6.03 1.47 6 6a.75.75 0 0 1 .052 1.004l-.052.056-6 6-1.06-1.06L10.44 8 4.97 2.53z';

const DROP_COUNT = 42;

// Brand palette — orange weighted double because it is the primary accent.
const PALETTE = [
  [232, 93, 18],   // orange
  [232, 93, 18],   // orange (extra weight)
  [59, 130, 246],  // blue
  [139, 92, 246],  // purple
  [20, 184, 166],  // teal
] as const;

interface Drop {
  x:       number;
  y:       number;
  speed:   number;
  size:    number;
  opacity: number;
  rgb:     readonly [number, number, number];
}

function spawnDrop(w: number, h: number, scatter: boolean): Drop {
  return {
    x:       Math.random() * w,
    y:       scatter ? Math.random() * h : -(16 + Math.random() * 60),
    speed:   0.5 + Math.random() * 2.2,
    size:    10 + Math.random() * 18,
    opacity: 0.18 + Math.random() * 0.52,
    rgb:     PALETTE[Math.floor(Math.random() * PALETTE.length)],
  };
}

export function LegalRainBackground({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const dropsRef  = useRef<Drop[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Compile SVG path once — reused every frame (no per-frame allocation)
    const chevronPath = new Path2D(CHEVRON);

    function resize() {
      canvas!.width  = window.innerWidth;
      canvas!.height = window.innerHeight;
      dropsRef.current = Array.from({ length: DROP_COUNT }, () =>
        spawnDrop(canvas!.width, canvas!.height, true),
      );
    }

    window.addEventListener('resize', resize);
    resize();

    function drawFrame() {
      const w = canvas!.width;
      const h = canvas!.height;

      // Deep navy radial gradient — lighter at centre to draw the eye inward
      const bg = ctx!.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.3, Math.max(w, h) * 0.9);
      bg.addColorStop(0, '#0e1628');
      bg.addColorStop(1, '#050b16');
      ctx!.fillStyle = bg;
      ctx!.fillRect(0, 0, w, h);

      // Subtle dot grid (32 px spacing)
      ctx!.fillStyle = 'rgba(255,255,255,0.018)';
      const step = 32;
      for (let gx = step; gx < w; gx += step) {
        for (let gy = step; gy < h; gy += step) {
          ctx!.beginPath();
          ctx!.arc(gx, gy, 0.7, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      // Falling arrows
      const drops = dropsRef.current;
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        const [r, g, b] = d.rgb;
        const s = d.size / 16; // scale from 16×16 SVG viewBox

        ctx!.save();
        ctx!.translate(d.x, d.y);
        ctx!.rotate(Math.PI / 2);  // right-chevron → down-chevron
        ctx!.scale(s, s);
        ctx!.translate(-8, -8);    // centre on the 16×16 viewBox
        ctx!.fillStyle = `rgba(${r},${g},${b},${d.opacity})`;
        ctx!.fill(chevronPath);
        ctx!.restore();

        // Advance
        d.y += d.speed;
        if (d.y - d.size > h) {
          drops[i] = spawnDrop(w, h, false);
        }
      }

      // Corner vignette — draws the eye away from edges
      const vig = ctx!.createRadialGradient(w * 0.5, h * 0.5, h * 0.1, w * 0.5, h * 0.5, h * 1.1);
      vig.addColorStop(0,    'rgba(5,11,22,0)');
      vig.addColorStop(0.6,  'rgba(5,11,22,0)');
      vig.addColorStop(1,    'rgba(5,11,22,0.70)');
      ctx!.fillStyle = vig;
      ctx!.fillRect(0, 0, w, h);

      rafRef.current = requestAnimationFrame(drawFrame);
    }

    rafRef.current = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className={clsx(styles.root, className)} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
