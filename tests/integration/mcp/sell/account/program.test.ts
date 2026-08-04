import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ProgramEnrollmentCollection } from '@/ebay/sell/account/program.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const sellerProgramToolNames = [
  'ebay_sell_account_get_opted_in_programs',
  'ebay_sell_account_opt_in_to_program',
  'ebay_sell_account_opt_out_of_program',
] as const;

const legacySellerProgramToolNames = [
  'ebay_get_opted_in_programs',
  'ebay_opt_in_to_program',
  'ebay_opt_out_of_program',
] as const;

const sellerProgramFailureCalls = [
  { ebayArguments: {}, toolName: 'ebay_sell_account_get_opted_in_programs' },
  {
    ebayArguments: { programType: 'OUT_OF_STOCK_CONTROL' },
    toolName: 'ebay_sell_account_opt_in_to_program',
  },
  {
    ebayArguments: { programType: 'SELLING_POLICY_MANAGEMENT' },
    toolName: 'ebay_sell_account_opt_out_of_program',
  },
] as const;

const sellerProgramFailureScenarios = sellerProgramFailureCalls.flatMap((programCall) =>
  ebayFailures.map((ebayFailure) => ({ ebayFailure, ...programCall })),
);

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Account seller-program MCP exposure', () => {
  it('exposes three official operations once without compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<ProgramEnrollmentCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { programs: [] },
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const sellerProgramToolName of sellerProgramToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === sellerProgramToolName),
      ).toEqual([sellerProgramToolName]);
    }
    for (const legacySellerProgramToolName of legacySellerProgramToolNames) {
      expect(listedToolNames).not.toContain(legacySellerProgramToolName);
    }
    await mcpClient.close();
  });

  it('keeps the program collection read and excludes program writes in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.account');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<ProgramEnrollmentCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { programs: [] },
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);
    expect(listedToolNames).toContain('ebay_sell_account_get_opted_in_programs');
    expect(listedToolNames).not.toContain('ebay_sell_account_opt_in_to_program');
    expect(listedToolNames).not.toContain('ebay_sell_account_opt_out_of_program');
    await mcpClient.close();
  });
});

describe('Sell Account seller-program MCP reads', () => {
  it('returns the unchanged eBay enrollment collection', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const programEnrollmentCollection: ProgramEnrollmentCollection = {
      programs: [{ programType: 'OUT_OF_STOCK_CONTROL' }],
    };
    const { sellerSession, getCalls } = sellerSessionReturning<ProgramEnrollmentCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: programEnrollmentCollection,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_get_opted_in_programs',
      {},
    );

    expect(getCalls).toEqual([{ endpoint: '/sell/account/v1/program/get_opted_in_programs' }]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(programEnrollmentCollection, null, 2) }],
    });
    await mcpClient.close();
  });
});

describe('Sell Account seller-program MCP writes', () => {
  it.each([
    ['ebay_sell_account_opt_in_to_program', '/sell/account/v1/program/opt_in'],
    ['ebay_sell_account_opt_out_of_program', '/sell/account/v1/program/opt_out'],
  ] as const)('posts the direct eBay document through %s', async (toolName, endpoint) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<Record<string, never>>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const programEnrollment = { programType: 'SELLING_POLICY_MANAGEMENT' };

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      toolName,
      programEnrollment,
    );

    expect(postCalls).toEqual([{ endpoint, requestDocument: programEnrollment }]);
    expect(toolCompletion).toEqual({ content: [{ type: 'text', text: '{}' }] });
    await mcpClient.close();
  });
});

describe('Sell Account seller-program MCP validation', () => {
  it('rejects unofficial program values before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<never>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined as never,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_account_opt_in_to_program',
      { programType: 'TOP_RATED' },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(postCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Sell Account seller-program MCP failures', () => {
  it.each(sellerProgramFailureScenarios)(
    'translates every $ebayFailure.kind failure once for $toolName',
    async ({ ebayArguments, ebayFailure, toolName }) => {
      vi.stubEnv('EBAY_MCP_UI', 'off');
      const { sellerSession } = sellerSessionReturning<never>({
        kind: 'ebayRequestFailed',
        ebayFailure,
      });

      const { mcpClient, toolCompletion } = await callEbayTool(
        sellerSession,
        toolName,
        ebayArguments,
      );

      expect(toolCompletion).toMatchObject({
        content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
        isError: true,
      });
      await mcpClient.close();
    },
  );
});
