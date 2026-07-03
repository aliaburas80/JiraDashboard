'use client';
// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Vanta-waves-inspired animated background using Canvas sine waves.
// References: vantajs.com/waves · anime.js · freefrontend.com canvas effects
// 6 overlapping sine-wave streams at different speeds, phases, amplitudes, colors.
// No npm dependencies. Fully respects prefers-reduced-motion.

import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import styles from './AnimatedDataBackground.module.scss';

interface Props { className?: string }

// ── Wave definitions ───────────────────────────────────────────────────────────
// Each wave: amplitude (px), frequency (cycles per pixel), phase offset,
// speed (phase increment per frame), strokeStyle, lineWidth, yBias (0=centre, positive=lower)

const WAVES = [
  // Orange delivery stream — wide, slow, dominant
  { amp: 90,  freq: 0.0035, phase: 0,    speed: 0.006, color: 'rgba(232,93,18,0.22)', w: 2.5, y: 0.52 },
  // Blue analytics channel — narrower, slightly faster
  { amp: 70,  freq: 0.0050, phase: 2.09, speed: 0.009, color: 'rgba(59,130,246,0.18)', w: 2.0, y: 0.48 },
  // Purple deep layer — very wide and slow, creates depth
  { amp: 120, freq: 0.0025, phase: 4.18, speed: 0.004, color: 'rgba(139,92,246,0.12)', w: 3.0, y: 0.55 },
  // Silver highlight — thin, fast, skims the surface
  { amp: 40,  freq: 0.0070, phase: 1.05, speed: 0.014, color: 'rgba(255,255,255,0.06)', w: 1.5, y: 0.45 },
  // Orange echo — same hue, different timing, reinforces brand
  { amp: 60,  freq: 0.0045, phase: 3.14, speed: 0.007, color: 'rgba(232,93,18,0.10)', w: 2.0, y: 0.60 },
  // Teal accent — complements the orange/blue
  { amp: 50,  freq: 0.0055, phase: 5.23, speed: 0.011, color: 'rgba(20,184,166,0.10)', w: 1.5, y: 0.40 },
];

export function AnimatedDataBackground({ className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const tRef      = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect prefers-reduced-motion — render static gradient only
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── Sizing ──────────────────────────────────────────────────────────────

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      canvas!.width  = parent.offsetWidth;
      canvas!.height = parent.offsetHeight;
    }

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    resize();

    // ── Draw ────────────────────────────────────────────────────────────────

    function drawFrame() {
      const w = canvas!.width;
      const h = canvas!.height;
      const t = tRef.current;

      // Deep navy background — slightly lighter gradient at centre (like Vanta)
      const bg = ctx!.createRadialGradient(w * 0.5, h * 0.35, 0, w * 0.5, h * 0.35, Math.max(w, h) * 0.8);
      bg.addColorStop(0, '#0d1630');
      bg.addColorStop(1, '#050b16');
      ctx!.fillStyle = bg;
      ctx!.fillRect(0, 0, w, h);

      // Subtle dot grid (28px spacing) — like shadcn/vanta grid
      ctx!.fillStyle = 'rgba(255,255,255,0.028)';
      const step = 28;
      for (let x = step; x < w; x += step) {
        for (let y = step; y < h; y += step) {
          ctx!.beginPath();
          ctx!.arc(x, y, 0.8, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      // ── Sine wave streams ──────────────────────────────────────────────
      WAVES.forEach(wave => {
        const midY = h * wave.y;

        ctx!.beginPath();
        ctx!.lineWidth   = wave.w;
        ctx!.strokeStyle = wave.color;
        ctx!.lineJoin    = 'round';
        ctx!.lineCap     = 'round';

        let first = true;
        // Step every 4px — good balance of smoothness vs performance
        for (let x = 0; x <= w + 4; x += 4) {
          const y = midY + wave.amp * Math.sin(x * wave.freq + wave.phase + t * wave.speed);
          if (first) { ctx!.moveTo(x, y); first = false; }
          else ctx!.lineTo(x, y);
        }
        ctx!.stroke();

        // Second echo of each wave — shifted phase, half opacity, creates depth
        ctx!.beginPath();
        ctx!.lineWidth   = wave.w * 0.6;
        ctx!.strokeStyle = wave.color.replace(/[\d.]+\)$/, v => String(parseFloat(v) * 0.4) + ')');
        ctx!.globalAlpha = 0.7;

        first = true;
        for (let x = 0; x <= w + 4; x += 4) {
          const y = midY + wave.amp * 0.55 *
            Math.sin(x * wave.freq * 1.3 + wave.phase + Math.PI + t * wave.speed * 1.2);
          if (first) { ctx!.moveTo(x, y); first = false; }
          else ctx!.lineTo(x, y);
        }
        ctx!.stroke();
        ctx!.globalAlpha = 1;
      });

      // Vignette — darkens corners to focus eye on centre/card
      const vignette = ctx!.createRadialGradient(w * 0.5, h * 0.5, h * 0.1, w * 0.5, h * 0.5, h * 1.0);
      vignette.addColorStop(0,   'rgba(5,11,22,0)');
      vignette.addColorStop(0.7, 'rgba(5,11,22,0)');
      vignette.addColorStop(1,   'rgba(5,11,22,0.75)');
      ctx!.fillStyle = vignette;
      ctx!.fillRect(0, 0, w, h);

      tRef.current++;
      rafRef.current = requestAnimationFrame(drawFrame);
    }

    rafRef.current = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <div className={clsx(styles.root, className)} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
