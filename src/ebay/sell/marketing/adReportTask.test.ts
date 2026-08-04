import { describe, expect, it } from 'vitest';

import {
  createReportTask,
  createReportTaskArgumentsSchema,
  deleteReportTask,
  getReportTask,
  getReportTasks,
  getReportTasksArgumentsSchema,
  reportTaskIdArgumentsSchema,
} from '@/ebay/sell/marketing/adReportTask.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

const reportTaskCreation = {
  dateFrom: '2026-07-01T00:00:00.000Z',
  dateTo: '2026-07-31T23:59:59.000Z',
  marketplaceId: 'EBAY_US',
  metricKeys: ['CLICKS', 'IMPRESSIONS'],
  reportFormat: 'TSV_GZIP' as const,
  reportType: 'ACCOUNT_PERFORMANCE_REPORT',
  dimensions: [{ dimensionKey: 'DAY' }],
  fundingModels: ['COST_PER_CLICK' as const],
  channels: ['ON_SITE' as const],
};

describe('Sell Marketing ad report task schemas', () => {
  it('accepts exact query wire keys and direct report task documents', () => {
    expect(
      getReportTasksArgumentsSchema.parse({
        limit: '10',
        offset: '0',
        report_task_statuses: 'SUCCESS,PENDING',
      }),
    ).toEqual({
      limit: '10',
      offset: '0',
      report_task_statuses: 'SUCCESS,PENDING',
    });
    expect(reportTaskIdArgumentsSchema.parse({ report_task_id: 'TASK-1' })).toEqual({
      report_task_id: 'TASK-1',
    });
    expect(createReportTaskArgumentsSchema.parse(reportTaskCreation)).toEqual(reportTaskCreation);
  });

  it.each([
    { limit: 10 },
    { limit: '0' },
    { reportTaskStatuses: 'SUCCESS' },
    { reportTaskId: 'TASK-1' },
    {
      request: reportTaskCreation,
    },
    {
      ...reportTaskCreation,
      'Content-Type': 'application/json',
    },
    {
      dateFrom: '2026-07-01T00:00:00.000Z',
      dateTo: '2026-07-31T23:59:59.000Z',
      marketplaceId: 'EBAY_US',
      reportType: 'ACCOUNT_PERFORMANCE_REPORT',
      metricKeys: [],
    },
  ])('rejects aliases, wrappers, transport headers, and invalid fields', (invalidArguments) => {
    expect(() => getReportTasksArgumentsSchema.parse(invalidArguments)).toThrow();
    expect(() => createReportTaskArgumentsSchema.parse(invalidArguments)).toThrow();
    expect(() => reportTaskIdArgumentsSchema.parse(invalidArguments)).toThrow();
  });
});

describe('Sell Marketing ad report task operations', () => {
  it('uses exact query wire keys and encoded report task paths', async () => {
    const { sellerSession, getCalls, deleteCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getReportTasks(sellerSession, {
      limit: '10',
      offset: '0',
      report_task_statuses: 'SUCCESS',
    });
    await getReportTask(sellerSession, { report_task_id: 'TASK/1' });
    await deleteReportTask(sellerSession, { report_task_id: 'TASK/1' });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_report_task',
        searchParameters: {
          limit: '10',
          offset: '0',
          report_task_statuses: 'SUCCESS',
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_report_task/TASK%2F1',
      },
    ]);
    expect(deleteCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_report_task/TASK%2F1',
      },
    ]);
  });

  it('posts a direct report task document without Content-Type', async () => {
    const { sellerSession, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    await createReportTask(sellerSession, reportTaskCreation);

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_report_task',
        requestDocument: reportTaskCreation,
      },
    ]);
  });
});
