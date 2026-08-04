import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { vi } from 'vitest';

import type { EbaySellerApi } from '@/api/index.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import { createEbayMcpRuntime } from '@/mcp/runtime.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

export type McpArguments = {
  readonly [argumentName: string]: unknown;
};

export const callEbayTool = async (
  sellerSession: EbaySellerSession,
  toolName: string,
  ebayArguments: McpArguments,
) => {
  const runtime = createEbayMcpRuntime({
    ebaySellerApi: { initialize: vi.fn() } as never,
    sellerSession,
    serverConfig: { name: 'ebay-resource-integration', version: '1.0.0' },
  });
  const [mcpTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const mcpClient = new Client({ name: 'ebay-resource-test', version: '1.0.0' });

  await runtime.server.connect(serverTransport);
  await mcpClient.connect(mcpTransport);

  return {
    mcpClient,
    toolCompletion: await mcpClient.callTool({ name: toolName, arguments: ebayArguments }),
  };
};

/**
 * Call a credential or token-management tool through the real MCP runtime with a
 * rich mock {@link EbaySellerApi} facade. Supplies a no-op seller session so
 * resource-tool registration does not require a full auth client.
 */
export const callCredentialTool = async (
  ebaySellerApi: EbaySellerApi,
  toolName: string,
  credentialArguments: McpArguments,
) => {
  const { sellerSession } = sellerSessionReturning({
    kind: 'ebayRequestSucceeded',
    ebayDocument: {},
  });
  const runtime = createEbayMcpRuntime({
    ebaySellerApi,
    sellerSession,
    serverConfig: { name: 'ebay-credential-integration', version: '1.0.0' },
  });
  const [mcpTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const mcpClient = new Client({ name: 'ebay-credential-test', version: '1.0.0' });

  await runtime.server.connect(serverTransport);
  await mcpClient.connect(mcpTransport);

  return {
    mcpClient,
    toolCompletion: await mcpClient.callTool({
      name: toolName,
      arguments: credentialArguments,
    }),
  };
};

export const listEbayTools = async (sellerSession: EbaySellerSession) => {
  const runtime = createEbayMcpRuntime({
    ebaySellerApi: { initialize: vi.fn() } as never,
    sellerSession,
    serverConfig: { name: 'ebay-catalogue-integration', version: '1.0.0' },
  });
  const [mcpTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const mcpClient = new Client({ name: 'ebay-catalogue-test', version: '1.0.0' });

  await runtime.server.connect(serverTransport);
  await mcpClient.connect(mcpTransport);

  return { mcpClient, listedTools: await mcpClient.listTools() };
};

/** List tools with a supplied seller API facade (for credential exposure tests). */
export const listCredentialTools = async (ebaySellerApi: EbaySellerApi) => {
  const { sellerSession } = sellerSessionReturning({
    kind: 'ebayRequestSucceeded',
    ebayDocument: {},
  });
  const runtime = createEbayMcpRuntime({
    ebaySellerApi,
    sellerSession,
    serverConfig: { name: 'ebay-credential-catalogue-integration', version: '1.0.0' },
  });
  const [mcpTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const mcpClient = new Client({ name: 'ebay-credential-catalogue-test', version: '1.0.0' });

  await runtime.server.connect(serverTransport);
  await mcpClient.connect(mcpTransport);

  return { mcpClient, listedTools: await mcpClient.listTools() };
};
