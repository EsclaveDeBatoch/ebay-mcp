import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  ReportMetadata,
  ReportMetadataCollection,
} from '@/ebay/sell/marketing/adReportMetadata.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const reportMetadataToolNames = [
  'ebay_sell_marketing_get_report_metadata',
  'ebay_sell_marketing_get_report_metadata_for_report_type',
] as const;

const reportMetadataFailureCalls = [
  {
    ebayArguments: { funding_model: 'COST_PER_CLICK', channel: 'ON_SITE' },
    toolName: 'ebay_sell_marketing_get_report_metadata',
  },
  {
    ebayArguments: {
      report_type: 'ACCOUNT_PERFORMANCE_REPORT',
      funding_model: 'COST_PER_SALE',
    },
    toolName: 'ebay_sell_marketing_get_report_metadata_for_report_type',
  },
] as const;

const reportMetadataFailureScenarios = reportMetadataFailureCalls.flatMap((reportMetadataCall) =>
  ebayFailures.map((ebayFailure) => ({ ebayFailure, ...reportMetadataCall })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Marketing ad report metadata MCP exposure', () => {
  it('exposes both metadata operations under the official namespace gate', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.marketing');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const reportMetadataToolName of reportMetadataToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === reportMetadataToolName),
      ).toEqual([reportMetadataToolName]);
    }
    await mcpClient.close();
  });
});

describe('Sell Marketing ad report metadata MCP calls', () => {
  it('returns unchanged metadata collection with exact query wire keys', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const reportMetadataCollection: ReportMetadataCollection = {
      reportMetadata: [
        {
          reportType: 'ACCOUNT_PERFORMANCE_REPORT',
          maxNumberOfDimensionsToRequest: 2,
          maxNumberOfMetricsToRequest: 10,
        },
      ],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<ReportMetadataCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: reportMetadataCollection,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_report_metadata',
      { funding_model: 'COST_PER_CLICK', channel: 'ON_SITE' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_report_metadata',
        searchParameters: {
          funding_model: 'COST_PER_CLICK',
          channel: 'ON_SITE',
        },
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(reportMetadataCollection, null, 2) }],
    });
    await mcpClient.close();
  });

  it('returns unchanged metadata for one report type from an encoded path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const reportMetadata: ReportMetadata = {
      reportType: 'CAMPAIGN_PERFORMANCE_REPORT',
      maxNumberOfDimensionsToRequest: 3,
      maxNumberOfMetricsToRequest: 15,
    };
    const { sellerSession, getCalls } = sellerSessionReturning<ReportMetadata>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: reportMetadata,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_report_metadata_for_report_type',
      {
        report_type: 'CAMPAIGN/PERFORMANCE',
        funding_model: 'COST_PER_SALE',
      },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_report_metadata/CAMPAIGN%2FPERFORMANCE',
        searchParameters: {
          funding_model: 'COST_PER_SALE',
        },
      },
    ]);
    expect(toolCompletion).toEqual({
      content: [{ type: 'text', text: JSON.stringify(reportMetadata, null, 2) }],
    });
    await mcpClient.close();
  });
});

describe('Sell Marketing ad report metadata MCP failures', () => {
  it.each(reportMetadataFailureScenarios)(
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

describe('Sell Marketing ad report metadata MCP validation', () => {
  it('rejects renamed fields before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    const { mcpClient: collectionClient, toolCompletion: collectionCompletion } =
      await callEbayTool(sellerSession, 'ebay_sell_marketing_get_report_metadata', {
        fundingModel: 'COST_PER_CLICK',
      });
    const { mcpClient: typeClient, toolCompletion: typeCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_report_metadata_for_report_type',
      { reportType: 'ACCOUNT_PERFORMANCE_REPORT' },
    );

    expect(collectionCompletion.isError).toBe(true);
    expect(typeCompletion.isError).toBe(true);
    expect(getCalls).toEqual([]);
    await collectionClient.close();
    await typeClient.close();
  });
});
