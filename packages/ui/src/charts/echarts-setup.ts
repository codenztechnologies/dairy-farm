// Loaded lazily (dynamic import) so ECharts stays out of the initial bundle. Register only what we use.
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  AriaComponent,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  TransformComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { LabelLayout, UniversalTransition } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  AriaComponent,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  TransformComponent,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
]);

export { echarts };
