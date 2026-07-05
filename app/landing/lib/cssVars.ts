// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Shared type for the CLAUDE.md §14.2 dynamic-CSS-custom-property exception,
// used across every landing section that renders per-item colors/positions/
// delays/widths from data.

import type { CSSProperties } from 'react';

export type CSSVariableProperties = CSSProperties & Record<`--${string}`, string>;
