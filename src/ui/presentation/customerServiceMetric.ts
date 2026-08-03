import type { CustomerServiceMetric } from '@/ebay/sell/analytics/customerServiceMetric.js';
import type { ChartPoint, ChartSeries, ChartViewModel } from '@/ui/viewModels.js';

type CustomerDimensionMetric = NonNullable<CustomerServiceMetric['dimensionMetrics']>[number];
type CustomerSellerMetric = NonNullable<CustomerDimensionMetric['metrics']>[number];
type CustomerMetricPoint = {
  readonly metricName: string;
  readonly chartPoint: ChartPoint;
};

function customerDimensionName(
  customerDimensionMetric: CustomerDimensionMetric,
): string | undefined {
  const customerDimension = customerDimensionMetric.dimension;
  if (customerDimension === undefined) {
    return;
  }
  if (customerDimension.value !== undefined) {
    return customerDimension.value;
  }
  return customerDimension.name;
}

function customerMetricPoint(
  dimensionName: string,
  sellerMetric: CustomerSellerMetric,
): CustomerMetricPoint | undefined {
  const metricName = sellerMetric.metricKey;
  if (metricName === undefined) {
    return;
  }
  const metricText = sellerMetric.value;
  if (metricText === undefined) {
    return;
  }
  const metricNumber = Number(metricText);
  if (!Number.isFinite(metricNumber)) {
    return;
  }

  return { metricName, chartPoint: { x: dimensionName, y: metricNumber } };
}

function customerDimensionPoints(
  customerDimensionMetric: CustomerDimensionMetric,
): CustomerMetricPoint[] {
  const dimensionName = customerDimensionName(customerDimensionMetric);
  if (dimensionName === undefined) {
    return [];
  }
  const sellerMetrics = customerDimensionMetric.metrics;
  if (sellerMetrics === undefined) {
    return [];
  }

  const customerPoints: CustomerMetricPoint[] = [];
  for (const sellerMetric of sellerMetrics) {
    const customerPoint = customerMetricPoint(dimensionName, sellerMetric);
    if (customerPoint !== undefined) {
      customerPoints.push(customerPoint);
    }
  }
  return customerPoints;
}

function appendCustomerPoint(
  pointsByMetric: Map<string, ChartPoint[]>,
  customerPoint: CustomerMetricPoint,
): void {
  const existingPoints = pointsByMetric.get(customerPoint.metricName);
  if (existingPoints === undefined) {
    pointsByMetric.set(customerPoint.metricName, [customerPoint.chartPoint]);
    return;
  }
  existingPoints.push(customerPoint.chartPoint);
}

function customerMetricSeries(customerServiceMetric: CustomerServiceMetric): ChartSeries[] {
  const pointsByMetric = new Map<string, ChartPoint[]>();
  const { dimensionMetrics } = customerServiceMetric;
  if (dimensionMetrics !== undefined) {
    for (const dimensionMetric of dimensionMetrics) {
      for (const customerPoint of customerDimensionPoints(dimensionMetric)) {
        appendCustomerPoint(pointsByMetric, customerPoint);
      }
    }
  }

  const chartSeries: ChartSeries[] = [];
  for (const [metricName, chartPoints] of pointsByMetric) {
    chartSeries.push({ name: metricName, points: chartPoints });
  }
  return chartSeries;
}

/**
 * Projects generated customer service metrics into grouped bar-chart series.
 * Incomplete dimensions, unnamed metrics, and non-numeric measurements are omitted.
 *
 * @param customerServiceMetric - Generated eBay customer service metric document.
 * @returns Bar-series presentation grouped by eBay metric key.
 */
export const customerServiceMetricChart = (
  customerServiceMetric: CustomerServiceMetric,
): ChartViewModel => ({
  archetype: 'chart',
  title: 'Customer service metrics',
  kind: 'bar',
  series: customerMetricSeries(customerServiceMetric),
});
