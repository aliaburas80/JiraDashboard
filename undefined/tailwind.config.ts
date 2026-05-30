// @ts-nocheck
import type { Config } from 'tailwindcss';
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {'50':'#eff6ff','100':'#dbeafe','500':'#3b82f6','600':'#2563eb','700':'#1d4ed8'},
        success: {'50':'#f0fdf4','500':'#22c55e','700':'#15803d'},
        warning: {'50':'#fffbeb','500':'#f59e0b','700':'#b45309'},
        danger:  {'50':'#fff1f2','500':'#ef4444','700':'#b91c1c'},
      },
      fontFamily: { sans: ['var(--font-inter)','ui-sans-serif','system-ui','sans-serif'] },
    },
  },
  plugins: [],
};
export default config;
