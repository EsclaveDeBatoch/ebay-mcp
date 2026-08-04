import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ReportTask, ReportTaskCollection } from '@/ebay/sell/marketing/adReportTask.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const reportTaskToolNames = [
  'ebay_sell_marketing_get_report_tasks',
  'ebay_sell_marketing_create_report_task',
  'ebay_sell_marketing_get_report_task',
  'ebay_sell_marketing_delete_report_task',
] as const;

const reportTaskCreation = {
  dateFrom: '2026-07-01T00:00:00.000Z',
  dateTo: '2026-07-31T23:59:59.000Z',
  marketplaceId: 'EBAY_US',
  metricKeys: ['CLICKS'],
  reportFormat: 'TSV_GZIP',
  reportType: 'ACCOUNT_PERFORMANCE_REPORT',
};

const reportTaskFailureCalls = [
  {
    ebayArguments: { limit: '10', offset: '0' },
    toolName: 'ebay_sell_marketing_get_report_tasks',
  },
  {
    ebayArguments: reportTaskCreation,
    toolName: 'ebay_sell_marketing_create_report_task',
  },
  {
    ebayArguments: { report_task_id: 'TASK-1' },
    toolName: 'ebay_sell_marketing_get_report_task',
  },
  {
    ebayArguments: { report_task_id: 'TASK-1' },
    toolName: 'ebay_sell_marketing_delete_report_task',
  },
] as const;

const reportTaskFailureScenarios = reportTaskFailureCalls.flatMap((reportTaskCall) =>
  ebayFailures.map((ebayFailure) => ({ ebayFailure, ...reportTaskCall })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Marketing ad report task MCP exposure', () => {
  it('exposes all four operations once under the official namespace gate', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.marketing');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const reportTaskToolName of reportTaskToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === reportTaskToolName),
      ).toEqual([reportTaskToolName]);
    }
    await mcpClient.close();
  });

  it('keeps only the two resource reads in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.marketing');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(
      listedTools.tools
        .map((ebayTool) => ebayTool.name)
        .filter((listedToolName) =>
          reportTaskToolNames.some((reportTaskToolName) => reportTaskToolName === listedToolName),
        ),
    ).toEqual(['ebay_sell_marketing_get_report_tasks', 'ebay_sell_marketing_get_report_task']);
    await mcpClient.close();
  });
});

describe('Sell Marketing ad report task MCP calls', () => {
  it('returns the unchanged report task collection with exact query wire keys', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const reportTaskCollection: ReportTaskCollection = {
      total: 1,
      reportTasks: [
        {
          reportTaskId: 'TASK-1',
          reportType: 'ACCOUNT_PERFORMANCE_REPORT',
          reportTaskStatus: 'SUCCESS',
        },
      ],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<ReportTaskCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: reportTaskCollection,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_report_tasks',
      {
        limit: '10',
        offset: '0',
        report_task_statuses: 'SUCCESS',
      },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_report_task',
        searchParameters: {
          limit: '10',
          offset: '0',
          report_task_statuses: 'SUCCESS',
        },
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(reportTaskCollection, null, 2) }],
    });
    await mcpClient.close();
  });

  it('returns one unchanged report task from an encoded path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const reportTask: ReportTask = {
      reportTaskId: 'TASK/1',
      reportType: 'ACCOUNT_PERFORMANCE_REPORT',
      reportTaskStatus: 'PENDING',
    };
    const { sellerSession, getCalls } = sellerSessionReturning<ReportTask>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: reportTask,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_report_task',
      { report_task_id: 'TASK/1' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_report_task/TASK%2F1',
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(reportTask, null, 2) }],
    });
    await mcpClient.close();
  });

  it('creates one report task with a flattened direct document', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_create_report_task',
      reportTaskCreation,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_report_task',
        requestDocument: reportTaskCreation,
      },
    ]);
    expect(toolCompletion).toEqual({ content: [] });
    await mcpClient.close();
  });

  it('deletes one report task from an encoded path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, deleteCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_delete_report_task',
      { report_task_id: 'TASK/1' },
    );

    expect(deleteCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_report_task/TASK%2F1',
      },
    ]);
    expect(toolCompletion).toEqual({ content: [] });
    await mcpClient.close();
  });
});

describe('Sell Marketing ad report task MCP failures', () => {
  it.each(reportTaskFailureScenarios)(
    'surfaces $ebayFailure.kind from $toolName',
    async ({ ebayArguments, ebayFailure, toolName }) => {
      vi.stubEnv('EBAY_MCP_UI', 'off');
      const { sellerSession } = sellerSessionReturning<unknown>({
        kind: 'ebayRequestFailed',
        ebayFailure,
      });

      const { mcpClient, toolCompletion } = await callEbayTool(
        sellerSession,
        toolName,
        ebayArguments,
      );

      expect(toolCompletion).toMatchObject({
        isError: true,
        content: [{ type: 'text' }],
      });
      await mcpClient.close();
    },
  );
});

describe('Sell Marketing ad report task MCP validation', () => {
  it('rejects renamed fields and wrappers before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    const { mcpClient: getClient, toolCompletion: getCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_report_tasks',
      { reportTaskStatuses: 'SUCCESS' },
    );
    const { mcpClient: createClient, toolCompletion: createCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_create_report_task',
      { request: reportTaskCreation },
    );

    expect(getCompletion.isError).toBe(true);
    expect(createCompletion.isError).toBe(true);
    expect(getCalls).toEqual([]);
    expect(postCalls).toEqual([]);
    await getClient.close();
    await createClient.close();
  });
});
