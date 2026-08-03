import type { TrafficReport } from '@/ebay/sell/analytics/trafficReport.js';
import type { ChartPoint, ChartSeries, ChartViewModel } from '@/ui/viewModels.js';

type TrafficMetricDefinition = NonNullable<NonNullable<TrafficReport['header']>['metrics']>[number];
type TrafficReportRecord = NonNullable<TrafficReport['records']>[number];

function trafficMetricName(metricDefinition: TrafficMetricDefinition): string | undefined {
  if (metricDefinition.key === undefined) {
    return;
  }
  if (metricDefinition.localizedName === undefined) {
    return metricDefinition.key;
  }
  return metricDefinition.localizedName;
}

function trafficMetricPoint(
  reportRecord: TrafficReportRecord,
  metricPosition: number,
): ChartPoint | undefined {
  const dimensionCells = reportRecord.dimensionValues;
  if (dimensionCells === undefined) {
    return;
  }
  const [dimensionCell] = dimensionCells;
  if (dimensionCell === undefined) {
    return;
  }
  if (dimensionCell.applicable === false) {
    return;
  }
  const dimensionText = dimensionCell.value as unknown;
  if (typeof dimensionText !== 'string') {
    return;
  }

  const metricCells = reportRecord.metricValues;
  if (metricCells === undefined) {
    return;
  }
  const metricCell = metricCells[metricPosition];
  if (metricCell === undefined) {
    return;
  }
  if (metricCell.applicable === false) {
    return;
  }
  const metricText = metricCell.value as unknown;
  if (typeof metricText !== 'string') {
    return;
  }
  const metricNumber = Number(metricText);
  if (!Number.isFinite(metricNumber)) {
    return;
  }

  return { x: dimensionText, y: metricNumber };
}

function trafficMetricPoints(
  reportRecords: TrafficReportRecord[],
  metricPosition: number,
): ChartPoint[] {
  const chartPoints: ChartPoint[] = [];

  for (const reportRecord of reportRecords) {
    const chartPoint = trafficMetricPoint(reportRecord, metricPosition);
    if (chartPoint !== undefined) {
      chartPoints.push(chartPoint);
    }
  }

  return chartPoints;
}

/**
 * Projects the generated traffic report into the fields rendered by the chart app.
 * Incomplete eBay cells are omitted instead of being replaced with invented labels.
 *
 * The official OpenAPI document declares `Value.value` as an untyped object even though
 * traffic reports return scalar strings. The two `unknown` casts above mark that vendor
 * boundary; runtime type guards keep unsupported values out of the browser model.
 *
 * @param trafficReport - Generated eBay traffic report returned by the resource operation.
 * @returns Line-series view of applicable numeric report cells.
 */
export const trafficReportChart = (trafficReport: TrafficReport): ChartViewModel => {
  const reportHeader = trafficReport.header;
  if (reportHeader === undefined) {
    return { archetype: 'chart', title: 'Traffic report', kind: 'line', series: [] };
  }
  const metricDefinitions = reportHeader.metrics;
  if (metricDefinitions === undefined) {
    return { archetype: 'chart', title: 'Traffic report', kind: 'line', series: [] };
  }
  const reportRecords = trafficReport.records;
  if (reportRecords === undefined) {
    return { archetype: 'chart', title: 'Traffic report', kind: 'line', series: [] };
  }

  const chartSeries: ChartSeries[] = [];
  for (const [metricPosition, metricDefinition] of metricDefinitions.entries()) {
    const metricName = trafficMetricName(metricDefinition);
    if (metricName !== undefined) {
      chartSeries.push({
        name: metricName,
        points: trafficMetricPoints(reportRecords, metricPosition),
      });
    }
  }

  return {
    archetype: 'chart',
    title: 'Traffic report',
    kind: 'line',
    series: chartSeries,
  };
};
