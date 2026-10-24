import { useMemo } from 'react';
import { Chart } from './chart';
import { useChartTheme } from './use-chart-theme';

interface SessionsChartProps {
  /** X axis labels (dates). */
  categories: readonly string[];
  /** Litres per category. Morning is stacked at the bottom, evening on top (docs/04 section 4). */
  morning: readonly number[];
  noon: readonly number[];
  evening: readonly number[];
  labels: { morning: string; noon: string; evening: string; total: string };
  chartLabel: string;
  height?: number;
}

/** Stacked daily bars by milking session plus a total line. Each series also has its own pattern. */
export function SessionsChart({
  categories,
  morning,
  noon,
  evening,
  labels,
  chartLabel,
  height,
}: SessionsChartProps) {
  const theme = useChartTheme();
  const option = useMemo(() => {
    const totals = categories.map((_, i) => (morning[i] ?? 0) + (noon[i] ?? 0) + (evening[i] ?? 0));
    const bar = (name: string, data: readonly number[], color: string) => ({
      name,
      type: 'bar' as const,
      stack: 'litres',
      data: [...data],
      itemStyle: { color },
      barMaxWidth: 36,
    });
    return {
      tooltip: { trigger: 'axis' as const },
      legend: { top: 0, textStyle: { color: theme.text } },
      grid: { left: 8, right: 8, top: 40, bottom: 8, containLabel: true },
      xAxis: {
        type: 'category' as const,
        data: [...categories],
        axisLine: { lineStyle: { color: theme.axis } },
        axisLabel: { color: theme.axis },
      },
      yAxis: {
        type: 'value' as const,
        axisLabel: { color: theme.axis },
        splitLine: { lineStyle: { color: theme.grid } },
      },
      series: [
        bar(labels.morning, morning, theme.sessions.morning),
        bar(labels.noon, noon, theme.sessions.noon),
        bar(labels.evening, evening, theme.sessions.evening),
        {
          name: labels.total,
          type: 'line' as const,
          data: totals,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { type: 'dashed' as const, width: 2 },
          itemStyle: { color: theme.series[1] ?? theme.text },
        },
      ],
    };
  }, [categories, morning, noon, evening, labels, theme]);

  return <Chart option={option} label={chartLabel} {...(height === undefined ? {} : { height })} />;
}
