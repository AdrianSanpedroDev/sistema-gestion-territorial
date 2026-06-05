export interface ReportRequest {
  query: string;
}

export interface ChartSeries {
  name: string;
  data: number[];
}

export interface ReportResponse {
  labels: string[];
  series: ChartSeries[];
  type: string;
}
