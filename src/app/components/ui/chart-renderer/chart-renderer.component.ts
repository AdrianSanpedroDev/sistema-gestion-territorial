import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import { MaterialModule } from '../../../material.module';
import {
  ChartRendererOptions,
  ChartSeries,
  ReportResponse,
} from '../../../models/report';

@Component({
  selector: 'app-chart-renderer',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, MaterialModule],
  templateUrl: './chart-renderer.component.html',
})
export class ChartRendererComponent implements OnChanges {
  @ViewChild('chart') chart: ChartComponent = Object.create(null);

  @Input() reportData: ReportResponse | null = null;

  chartOptions: Partial<ChartRendererOptions> | null = null;
  isEmpty = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['reportData']) return;

    if (!this.reportData) {
      this.chartOptions = null;
      this.isEmpty = false;
      return;
    }

    if (this.reportData.labels.length === 0 || this.reportData.series.length === 0) {
      this.chartOptions = null;
      this.isEmpty = true;
      return;
    }

    this.isEmpty = false;
    const type = this.reportData.type;

    if (type === 'bar') {
      this.chartOptions = this.buildBar(this.reportData);
    } else if (type === 'line' || type === 'series') {
      this.chartOptions = this.buildLine(this.reportData);
    } else if (type === 'pie') {
      this.chartOptions = this.buildPie(this.reportData);
    }
  }

  private buildBar(data: ReportResponse): Partial<ChartRendererOptions> {
    return {
      series: data.series as ChartSeries[],
      chart: { type: 'bar', height: 380, fontFamily: 'inherit', foreColor: '#adb0bb', toolbar: { show: false } },
      xaxis: { categories: data.labels, axisBorder: { show: false } },
      plotOptions: { bar: { horizontal: true, borderRadius: 4, borderRadiusApplication: 'end' } },
      dataLabels: { enabled: false },
      grid: { borderColor: 'rgba(0,0,0,0.1)', strokeDashArray: 3 },
      tooltip: { theme: 'dark' },
    };
  }

  private buildLine(data: ReportResponse): Partial<ChartRendererOptions> {
    return {
      series: data.series as ChartSeries[],
      chart: { type: 'line', height: 380, fontFamily: 'inherit', foreColor: '#adb0bb', toolbar: { show: false } },
      xaxis: { categories: data.labels, axisBorder: { show: false } },
      dataLabels: { enabled: false },
      grid: { borderColor: 'rgba(0,0,0,0.1)', strokeDashArray: 3 },
      tooltip: { theme: 'dark' },
    };
  }

  private buildPie(data: ReportResponse): Partial<ChartRendererOptions> {
    return {
      series: data.series as number[],
      chart: { type: 'pie', height: 380, fontFamily: 'inherit', foreColor: '#adb0bb' },
      labels: data.labels,
      dataLabels: { enabled: true },
      tooltip: { theme: 'dark' },
      legend: { position: 'bottom' },
    };
  }
}
