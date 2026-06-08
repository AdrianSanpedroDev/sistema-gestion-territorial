import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule,
  ChartComponent,
  ApexChart,
  ApexAxisChartSeries,
  ApexXAxis,
  ApexPlotOptions,
  ApexDataLabels,
  ApexTooltip,
  ApexGrid,
} from 'ng-apexcharts';
import { MaterialModule } from '../../../material.module';
import { ChartSeries, ReportResponse } from '../../../models/report';

export interface BarChartOptions {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  grid: ApexGrid;
}

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, MaterialModule],
  templateUrl: './bar-chart.component.html',
})
export class BarChartComponent implements OnChanges {
  @ViewChild('chart') chart: ChartComponent = Object.create(null);

  @Input() reportData: ReportResponse | null = null;

  public chartOptions: Partial<BarChartOptions> | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reportData'] && this.reportData) {
      this.buildChart(this.reportData);
    }
  }

  private buildChart(data: ReportResponse): void {
    this.chartOptions = {
      series: data.series as ChartSeries[],
      chart: {
        type: 'bar',
        height: 380,
        fontFamily: 'inherit',
        foreColor: '#adb0bb',
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          borderRadiusApplication: 'end',
        },
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        categories: data.labels,
        axisBorder: { show: false },
      },
      grid: {
        borderColor: 'rgba(0,0,0,0.1)',
        strokeDashArray: 3,
      },
      tooltip: {
        theme: 'dark',
      },
    };
  }
}
