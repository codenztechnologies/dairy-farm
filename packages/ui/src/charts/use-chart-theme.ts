import { useSyncExternalStore } from 'react';

/** Chart colours read from the live CSS tokens, so light/dark and re-theming need no chart edits. */
export interface ChartTheme {
  series: readonly string[];
  sessions: { morning: string; noon: string; evening: string };
  axis: string;
  grid: string;
  text: string;
  surface: string;
  border: string;
  fontFamily: string;
  reducedMotion: boolean;
}

const FALLBACK: ChartTheme = {
  series: [],
  sessions: { morning: '', noon: '', evening: '' },
  axis: '',
  grid: '',
  text: '',
  surface: '',
  border: '',
  fontFamily: 'sans-serif',
  reducedMotion: false,
};

let cached: ChartTheme | undefined;
let cachedKey = '';

function read(): ChartTheme {
  const style = getComputedStyle(document.documentElement);
  const get = (name: string) => style.getPropertyValue(name).trim();
  const series = [1, 2, 3, 4, 5, 6].map((n) => get(`--chart-${String(n)}`));
  const next: ChartTheme = {
    series,
    sessions: {
      morning: get('--chart-session-morning'),
      noon: get('--chart-session-noon'),
      evening: get('--chart-session-evening'),
    },
    axis: get('--chart-axis'),
    grid: get('--chart-grid'),
    text: get('--color-text'),
    surface: get('--color-surface'),
    border: get('--color-border'),
    fontFamily: get('--font-body'),
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  };
  const key = JSON.stringify(next);
  if (key !== cachedKey) {
    cachedKey = key;
    cached = next;
  }
  return cached ?? next;
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'lang', 'dir'],
  });
  const dark = window.matchMedia('(prefers-color-scheme: dark)');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  dark.addEventListener('change', onChange);
  motion.addEventListener('change', onChange);
  return () => {
    observer.disconnect();
    dark.removeEventListener('change', onChange);
    motion.removeEventListener('change', onChange);
  };
}

export function useChartTheme(): ChartTheme {
  return useSyncExternalStore(subscribe, read, () => FALLBACK);
}
