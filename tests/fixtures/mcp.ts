import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { vi } from 'vitest';

import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import { createEbayMcpRuntime } from '@/mcp/runtime.js';

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
