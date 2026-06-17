'use client';

import type { CSSProperties } from 'react';
import { iconUrl, isIconName, type IconName } from '@/lib/icons';

interface SvgIconProps {
  name: IconName | string;
  size?: number | string;
  className?: string;
  title?: string;
  style?: CSSProperties;
}

export function SvgIcon({ name, size = '1em', className, title, style }: SvgIconProps) {
  const src = isIconName(name) ? iconUrl(name) : name.startsWith('/icons/') ? name : iconUrl('question');
  const dimension = typeof size === 'number' ? `${size}px` : size;

  return (
    <span
      aria-hidden={title ? undefined : true}
      aria-label={title}
      role={title ? 'img' : undefined}
      className={className}
      style={{
        display: 'inline-block',
        width: dimension,
        height: dimension,
        flexShrink: 0,
        backgroundColor: 'currentColor',
        WebkitMask: `url("${src}") center / contain no-repeat`,
        mask: `url("${src}") center / contain no-repeat`,
        ...style,
      }}
    />
  );
}
