import {
  ApexAxisChartSeries,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexPlotOptions,
  ApexDataLabels,
  ApexTooltip,
  ApexGrid,
  ApexLegend,
} from 'ng-apexcharts';

export interface ReportRequest {
  query: string;
}

export interface ChartSeries {
  name: string;
  data: number[];
}

export interface ReportResponse {
  labels: string[];
  series: number[] | ChartSeries[];
  type: string;
}

export interface ChartRendererOptions {
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  chart: ApexChart;
  labels?: string[];
  xaxis?: ApexXAxis;
  plotOptions?: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  grid?: ApexGrid;
  legend?: ApexLegend;
}
