'use client';
// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// EP-VIS-01: Animated data-flow background — Canvas-based, zero dependencies.
// 52 nodes drift slowly across the canvas; nearby nodes draw connecting lines
// that pulse with orange accents, representing delivery data in motion.
// Fully respects prefers-reduced-motion — completely stops when set.

import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import styles from './AnimatedDataBackground.module.scss';

interface AnimatedDataBackgroundProps {
  className?: string;
}

// ── Types ──────────────────────────────────────────────────────────────────────

type NodeType = 'primary' | 'secondary' | 'accent';

interface Node {
  x:       number;
  y:       number;
  vx:      number;
  vy:      number;
  radius:  number;
  type:    NodeType;
  opacity: number;
  pulse:   number; // 0 = idle, 1 = peak — counts down each frame
}

// ── Constants ──────────────────────────────────────────────────────────────────

const NODE_COUNT     = 52;
const MAX_DIST       = 160;
const BG_COLOR       = '#050508';
const COLORS: Record<NodeType, string> = {
  primary:   'rgba(232, 93, 18, 0.85)',
  secondary: 'rgba(99, 179, 237, 0.65)',
  accent:    'rgba(255, 255, 255, 0.50)',
};
const LINE_BASE      = 'rgba(255, 255, 255, 0.04)';
const LINE_ACTIVE    = 'rgba(232, 93, 18, 0.22)';
const GLOW_COLOR     = 'rgba(232, 93, 18, 0.50)';
const FADE_FRAMES    = 48; // ~800ms at 60fps

// ── Helpers ────────────────────────────────────────────────────────────────────

function rnd(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function makeNode(w: number, h: number): Node {
  const r = Math.random();
  const type: NodeType = r < 0.60 ? 'primary' : r < 0.90 ? 'secondary' : 'accent';
  // Avoid near-zero velocities so nodes always move
  const vx = (Math.random() < 0.5 ? -1 : 1) * rnd(0.12, 0.35);
  const vy = (Math.random() < 0.5 ? -1 : 1) * rnd(0.12, 0.35);
  return {
    x:       rnd(0, w),
    y:       rnd(0, h),
    vx,
    vy,
    radius:  rnd(2, 4.5),
    type,
    opacity: rnd(0.5, 1.0),
    pulse:   0,
  };
}

// ── Component ──────────────────────────────────────────────────────────────────

export function AnimatedDataBackground({ className }: AnimatedDataBackgroundProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const nodesRef     = useRef<Node[]>([]);
  const rafRef       = useRef<number>(0);
  const frameRef     = useRef<number>(0);
  const reducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Respect prefers-reduced-motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return; // static background only

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── Sizing ──────────────────────────────────────────────────────────────

    function resize() {
      if (!canvas) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width  = parent.offsetWidth;
      canvas.height = parent.offsetHeight;
      // Clamp node positions to new bounds
      nodesRef.current.forEach(n => {
        n.x = Math.min(n.x, canvas!.width);
        n.y = Math.min(n.y, canvas!.height);
      });
    }

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    resize();

    // ── Init nodes ──────────────────────────────────────────────────────────

    nodesRef.current = Array.from(
      { length: NODE_COUNT },
      () => makeNode(canvas.width, canvas.height),
    );

    // ── Animation loop ──────────────────────────────────────────────────────

    function draw() {
      if (!canvas || !ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      const nodes = nodesRef.current;
      const frame = frameRef.current++;

      // Fade-in global alpha
      const fadeIn = Math.min(1, frame / FADE_FRAMES);

      // Background
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, w, h);

      // ── Draw connection lines (O(n²), n=52 → 1326 pairs) ──────────────

      for (let i = 0; i < nodes.length - 1; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist >= MAX_DIST) continue;

          const proximity = 1 - dist / MAX_DIST;
          const pulsing   = a.pulse > 0 || b.pulse > 0;

          ctx.globalAlpha = proximity * (pulsing ? 0.9 : 0.6) * fadeIn;
          ctx.strokeStyle = pulsing ? LINE_ACTIVE : LINE_BASE;
          ctx.lineWidth   = pulsing ? 1.0 : 0.7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // ── Draw nodes ──────────────────────────────────────────────────────

      nodes.forEach(n => {
        // Pulse glow
        if (n.pulse > 0) {
          const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius * 5);
          grad.addColorStop(0, `rgba(232, 93, 18, ${n.pulse * 0.35})`);
          grad.addColorStop(1, 'rgba(232, 93, 18, 0)');
          ctx.globalAlpha = fadeIn;
          ctx.fillStyle   = grad;
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.radius * 5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Node circle
        ctx.globalAlpha = n.opacity * fadeIn;
        ctx.fillStyle   = COLORS[n.type];
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + n.pulse * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Move
        n.x += n.vx;
        n.y += n.vy;

        // Bounce off edges
        if (n.x < n.radius || n.x > w - n.radius) { n.vx *= -1; n.x = Math.max(n.radius, Math.min(w - n.radius, n.x)); }
        if (n.y < n.radius || n.y > h - n.radius) { n.vy *= -1; n.y = Math.max(n.radius, Math.min(h - n.radius, n.y)); }

        // Pulse decay
        if (n.pulse > 0) n.pulse = Math.max(0, n.pulse - 0.015);

        // Random pulse trigger: 0.05% chance per frame
        if (n.pulse === 0 && Math.random() < 0.0005) n.pulse = 1.0;
      });

      ctx.globalAlpha = 1;
      rafRef.current  = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    // Also listen for runtime media-query changes
    const handleMqChange = (e: MediaQueryListEvent) => {
      if (e.matches) cancelAnimationFrame(rafRef.current);
    };
    mq.addEventListener('change', handleMqChange);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      mq.removeEventListener('change', handleMqChange);
    };
  }, []);

  // When reduced motion is set at render time, return static background only
  if (reducedMotion) return null;

  return (
    <div className={clsx(styles.root, className)} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
