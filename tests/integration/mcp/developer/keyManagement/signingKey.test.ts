import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  DeveloperSigningKey,
  DeveloperSigningKeyCollection,
  SigningKeyCreationArguments,
} from '@/ebay/developer/keyManagement/signingKey.js';
import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';
import {
  retrievableSigningKeyDocument,
  signingKeyCollectionDocument,
  signingKeyDocument,
} from '@tests/fixtures/signingKeys.js';

const getSigningKeysToolName = 'ebay_developer_key_management_get_signing_keys';
const createSigningKeyToolName = 'ebay_developer_key_management_create_signing_key';
const getSigningKeyToolName = 'ebay_developer_key_management_get_signing_key';
const signingKeyCreation: SigningKeyCreationArguments = { signingKeyCipher: 'ED25519' };

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Developer Key Management signing-key MCP exposure', () => {
  it('exposes all official names once without flat compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<DeveloperSigningKeyCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: signingKeyCollectionDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const officialToolName of [
      getSigningKeysToolName,
      createSigningKeyToolName,
      getSigningKeyToolName,
    ]) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === officialToolName),
      ).toEqual([officialToolName]);
    }
    expect(listedToolNames).not.toContain('ebay_get_signing_keys');
    expect(listedToolNames).not.toContain('ebay_create_signing_key');
    expect(listedToolNames).not.toContain('ebay_get_signing_key');
    await mcpClient.close();
  });

  it('exposes only signing-key tools through developer.key-management', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'developer.key-management');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<DeveloperSigningKeyCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: signingKeyCollectionDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([
      getSigningKeysToolName,
      createSigningKeyToolName,
      getSigningKeyToolName,
    ]);
    await mcpClient.close();
  });

  it('retains only signing-key lookups in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'developer.key-management');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<DeveloperSigningKeyCollection>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: signingKeyCollectionDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([
      getSigningKeysToolName,
      getSigningKeyToolName,
    ]);
    await mcpClient.close();
  });
});

describe('Developer Key Management signing-key MCP calls', () => {
  it('returns the unchanged signing-key collection', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulLookup: EbayRequestCompletion<DeveloperSigningKeyCollection> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: signingKeyCollectionDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getSigningKeysToolName,
      {},
    );

    expect(getCalls).toEqual([
      {
        apiHost: 'apiz',
        endpoint: '/developer/key_management/v1/signing_key',
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(signingKeyCollectionDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('submits the exact creation document and returns the private key once', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulCreation: EbayRequestCompletion<DeveloperSigningKey> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: signingKeyDocument,
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulCreation);

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      createSigningKeyToolName,
      signingKeyCreation,
    );

    expect(postCalls).toEqual([
      {
        apiHost: 'apiz',
        endpoint: '/developer/key_management/v1/signing_key',
        requestDocument: signingKeyCreation,
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(signingKeyDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('retrieves one unchanged signing key by exact eBay path field', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulLookup: EbayRequestCompletion<DeveloperSigningKey> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: retrievableSigningKeyDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const { mcpClient, toolCompletion } = await callEbayTool(sellerSession, getSigningKeyToolName, {
      signing_key_id: 'signing-key-123',
    });

    expect(getCalls).toEqual([
      {
        apiHost: 'apiz',
        endpoint: '/developer/key_management/v1/signing_key/signing-key-123',
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(retrievableSigningKeyDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });
});

describe('Developer Key Management signing-key MCP validation', () => {
  it.each([
    { toolName: createSigningKeyToolName, ebayArguments: { request: signingKeyCreation } },
    { toolName: createSigningKeyToolName, ebayArguments: { signingKeyCipher: 'DSA' } },
    { toolName: getSigningKeyToolName, ebayArguments: { signingKeyId: 'signing-key-123' } },
  ])('rejects invalid $toolName arguments before the seller session', async (invalidCall) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls, postCalls } = sellerSessionReturning<DeveloperSigningKey>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: signingKeyDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      invalidCall.toolName,
      invalidCall.ebayArguments,
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    expect(postCalls).toEqual([]);
    await mcpClient.close();
  });
});

const signingKeyFailureScenarios = [
  {
    ebayArguments: {},
    toolName: getSigningKeysToolName,
  },
  {
    ebayArguments: signingKeyCreation,
    toolName: createSigningKeyToolName,
  },
  {
    ebayArguments: { signing_key_id: 'signing-key-123' },
    toolName: getSigningKeyToolName,
  },
].flatMap((signingKeyOperation) =>
  ebayFailures.map((ebayFailure) => ({ ebayFailure, ...signingKeyOperation })),
);

describe('Developer Key Management signing-key MCP failures', () => {
  it.each(signingKeyFailureScenarios)(
    'translates every $ebayFailure.kind failure once',
    async ({ ebayArguments, ebayFailure, toolName }) => {
      vi.stubEnv('EBAY_MCP_UI', 'off');
      const { sellerSession } = sellerSessionReturning<DeveloperSigningKey>({
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
