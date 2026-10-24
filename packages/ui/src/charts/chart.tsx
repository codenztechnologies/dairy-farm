import { useEffect, useMemo, useRef } from 'react';
import { SkeletonChart } from '../components/skeleton';
import { cn } from '../lib/cn';
import { useChartTheme, type ChartTheme } from './use-chart-theme';
import type { EChartsCoreOption, EChartsType } from 'echarts/core';

interface ChartProps {
  /** ECharts option. Colours, fonts, tooltip and accessibility defaults are added by the wrapper. */
  option: EChartsCoreOption;
  /** Accessible description of what the chart shows. Pair with a data table for full access. */
  label: string;
  height?: number;
  className?: string;
}

function withTheme(option: EChartsCoreOption, theme: ChartTheme): EChartsCoreOption {
  return {
    color: [...theme.series],
    backgroundColor: 'transparent',
    textStyle: { fontFamily: theme.fontFamily, color: theme.text },
    animation: !theme.reducedMotion,
    // Decal patterns give every series a texture too, so charts survive colour-blindness and greyscale print.
    aria: { enabled: true, decal: { show: true } },
    tooltip: {
      confine: true,
      backgroundColor: theme.surface,
      borderColor: theme.border,
      textStyle: { color: theme.text, fontFamily: theme.fontFamily },
    },
    ...option,
  };
}

/** Thin ECharts wrapper: lazy-loaded, theme-aware, resizes with its container. */
export function Chart({ option, label, height = 288, className }: ChartProps) {
  const theme = useChartTheme();
  const host = useRef<HTMLDivElement>(null);
  const chart = useRef<EChartsType | undefined>(undefined);
  const latest = useRef<EChartsCoreOption>({});
  const themed = useMemo(() => withTheme(option, theme), [option, theme]);

  // Keep the newest option available to the async chart creation below (never write refs during render).
  useEffect(() => {
    latest.current = themed;
  }, [themed]);

  // Create once; dispose on unmount.
  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;
    void import('./echarts-setup').then(({ echarts }) => {
      const element = host.current;
      if (disposed || !element) return;
      const instance = echarts.init(element, undefined, { renderer: 'canvas' });
      chart.current = instance;
      instance.setOption(latest.current);
      observer = new ResizeObserver(() => {
        instance.resize();
      });
      observer.observe(element);
    });
    return () => {
      disposed = true;
      observer?.disconnect();
      chart.current?.dispose();
      chart.current = undefined;
    };
  }, []);

  // Update when data or theme changes. `true` replaces the previous option instead of merging.
  useEffect(() => {
    chart.current?.setOption(themed, true);
  }, [themed]);

  return (
    <div className={cn('relative', className)} style={{ height }}>
      <div ref={host} role="img" aria-label={label} className="size-full" />
      {theme.series.length === 0 ? <SkeletonChart className="absolute inset-0 h-full" /> : null}
    </div>
  );
}

export { withTheme };
