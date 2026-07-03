'use client';
// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// EP-VIS-01 (redesign): Pure CSS/SVG animated background using real product icons.
// No Canvas. No JavaScript animation loop. GPU-accelerated CSS keyframes only.
// Icons sourced from /public/icons/ — actual Jira/delivery intelligence icons.

import clsx from 'clsx';
import styles from './AnimatedDataBackground.module.scss';

interface Props {
  className?: string;
}

// ── Inline SVG paths from /public/icons/ ─────────────────────────────────────

// 0128-data-flow — branching pipeline graph
const PATH_DATA_FLOW = 'M13.75 1.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5m-2.122 0a2.251 2.251 0 1 1 0 1.5H9.563C8.976 3 8.5 3.476 8.5 4.063V7.25h3.128a2.251 2.251 0 1 1 0 1.5H8.5v3.188c0 .586.476 1.062 1.063 1.062h2.065a2.251 2.251 0 1 1 0 1.5H9.563A2.563 2.563 0 0 1 7 11.938V8.75H4.372a2.25 2.25 0 1 1 0-1.5H7V4.063A2.56 2.56 0 0 1 9.563 1.5zM2.25 7.25a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5m11.5 0a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5m0 5.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5';

// 0317-sprint — circular sprint arrow
const PATH_SPRINT = 'M8 1.5A4.75 4.75 0 0 0 8 11h5.44l-2.22-2.22 1.06-1.06 3.5 3.5a.75.75 0 0 1 0 1.06l-3.5 3.5-1.06-1.06 2.22-2.22H0V11h3.938A6.25 6.25 0 1 1 14.25 6.25h-1.5A4.75 4.75 0 0 0 8 1.5';

// 0092-chart-trend-up — upward trend line
const PATH_TREND_UP = 'M1 13V1h1.5v12a.5.5 0 0 0 .5.5h12V15H3a2 2 0 0 1-2-2M15 7.5h-1.5V5.56L9.78 9.28a.75.75 0 0 1-1.06 0L7.25 7.81l-2.22 2.22-1.06-1.06 2.75-2.75.056-.052a.75.75 0 0 1 1.004.052l1.47 1.47 3.19-3.19H10.5V3h3.75a.75.75 0 0 1 .75.75z';

// 0088-chart-bar — bar chart
const PATH_CHART_BAR = 'M1 13V1h1.5v12a.5.5 0 0 0 .5.5h12V15H3a2 2 0 0 1-2-2m4.25-4.5.077.004A.75.75 0 0 1 6 9.25v2.5a.75.75 0 0 1-.75.75h-1a.75.75 0 0 1-.75-.75v-2.5a.75.75 0 0 1 .75-.75zm4-3.5a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-.75.75h-1a.75.75 0 0 1-.75-.75v-6A.75.75 0 0 1 8.25 5zm4-3a.75.75 0 0 1 .75.75v9a.75.75 0 0 1-.75.75h-1a.75.75 0 0 1-.75-.75v-9a.75.75 0 0 1 .75-.75z';

// 0127-dashboard — grid layout
const PATH_DASHBOARD = 'M3 2.5a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h4.25v-11zm5.75 0v4.75h4.75V3a.5.5 0 0 0-.5-.5zm4.75 6.25H8.75v4.75H13a.5.5 0 0 0 .5-.5zM1 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2z';

// 0149-epic — lightning bolt
const PATH_EPIC = 'M10.271.05a.75.75 0 0 1 .479.7v4.635l3.147.63a.75.75 0 0 1 .407 1.24l-7.75 8.5a.75.75 0 0 1-1.304-.505v-4.635l-3.147-.63a.75.75 0 0 1-.407-1.24l7.75-8.5A.75.75 0 0 1 10.27.05M3.698 8.776l3.052.61v3.93l5.552-6.09-3.052-.61v-3.93z';

// 0352-task — completed task checkbox
const PATH_TASK = 'M1 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2zm2-.5a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h10a.5.5 0 0 0 .5-.5V3a.5.5 0 0 0-.5-.5zm9.326 2.98-5 6a.75.75 0 0 1-1.152 0l-2.5-3 1.152-.96L6.75 9.828l4.424-5.308z';

// 0075-board — kanban board
const PATH_BOARD = 'M2 3.5a.5.5 0 0 0-.5.5v8a.5.5 0 0 0 .5.5h2.833v-9zm4.333 0v9h3.334v-9zm4.834 0v9H14a.5.5 0 0 0 .5-.5V4a.5.5 0 0 0-.5-.5zM0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2z';

// 0353-task-in-progress — circular progress arrow
const PATH_TASK_PROG = 'M1.543 7.25h7.646L6.97 5.03l1.06-1.06 3.5 3.5a.75.75 0 0 1 0 1.06l-3.5 3.5-1.06-1.06 2.22-2.22H1.542a6.501 6.501 0 1 0 0-1.5M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8';

// ── Shared SVG wrapper ────────────────────────────────────────────────────────

function Icon({ path, className }: { path: string; className: string }) {
  return (
    <svg
      viewBox="-4 -4 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d={path} fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AnimatedDataBackground({ className }: Props) {
  return (
    <div className={clsx(styles.root, className)} aria-hidden="true">

      {/* Dot grid */}
      <div className={styles.grid} />

      {/* Ambient colour glows */}
      <div className={styles.glowOrange} />
      <div className={styles.glowBlue} />

      {/* 12 floating delivery-intelligence icons */}
      <Icon path={PATH_DATA_FLOW}  className={clsx(styles.icon, styles.iconOrange, styles.i1)}  />
      <Icon path={PATH_TREND_UP}   className={clsx(styles.icon, styles.iconBlue,   styles.i2)}  />
      <Icon path={PATH_SPRINT}     className={clsx(styles.icon, styles.iconOrange, styles.i3)}  />
      <Icon path={PATH_DASHBOARD}  className={clsx(styles.icon, styles.iconBlue,   styles.i4)}  />
      <Icon path={PATH_EPIC}       className={clsx(styles.icon, styles.iconOrange, styles.i5)}  />
      <Icon path={PATH_TASK}       className={clsx(styles.icon, styles.iconBlue,   styles.i6)}  />
      <Icon path={PATH_BOARD}      className={clsx(styles.icon, styles.iconOrange, styles.i7)}  />
      <Icon path={PATH_CHART_BAR}  className={clsx(styles.icon, styles.iconBlue,   styles.i8)}  />
      <Icon path={PATH_TASK_PROG}  className={clsx(styles.icon, styles.iconOrange, styles.i9)}  />
      <Icon path={PATH_DATA_FLOW}  className={clsx(styles.icon, styles.iconBlue,   styles.i10)} />
      <Icon path={PATH_SPRINT}     className={clsx(styles.icon, styles.iconOrange, styles.i11)} />
      <Icon path={PATH_TREND_UP}   className={clsx(styles.icon, styles.iconBlue,   styles.i12)} />
    </div>
  );
}
