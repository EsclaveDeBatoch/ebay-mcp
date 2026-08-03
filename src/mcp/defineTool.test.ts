import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';

import { defineTool } from './defineTool.js';

const sellerSession = {} as EbaySellerSession;

describe('migrated eBay tool behavior', () => {
  it('advertises read operations as read-only and idempotent', () => {
    const readTool = defineTool({
      name: 'ebay_example_find',
      namespace: 'example.read',
      description: 'Find an example',
      argumentsSchema: z.object({}).strict(),
      operationKind: 'read',
      operation: async () => ({ kind: 'ebayRequestSucceeded', ebayDocument: {} }),
    });

    expect(readTool.annotations).toEqual({
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    });
  });

  it('advertises write operations as non-read-only and non-idempotent', () => {
    const writeTool = defineTool({
      name: 'ebay_example_send',
      namespace: 'example.write',
      description: 'Send an example',
      argumentsSchema: z.object({}).strict(),
      operationKind: 'write',
      operation: async () => ({ kind: 'ebayRequestSucceeded', ebayDocument: {} }),
    });

    expect(writeTool.annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    });
  });

  it('represents a successful eBay 204 as empty MCP content', async () => {
    const noContentTool = defineTool({
      name: 'ebay_example_empty',
      namespace: 'example.empty',
      description: 'Return no document',
      argumentsSchema: z.object({}).strict(),
      operationKind: 'read',
      operation: async () => ({ kind: 'ebayRequestSucceeded', ebayDocument: undefined }),
    });

    await expect(noContentTool.completeMcpCall(sellerSession, {}, false)).resolves.toEqual({
      content: [],
    });
  });
});
