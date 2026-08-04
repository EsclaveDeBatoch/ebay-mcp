import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { EbaySellerApi } from '@/api/index.js';

import { defineCredentialTool } from './defineCredentialTool.js';

const ebaySellerApi = {} as EbaySellerApi;

describe('credential tool behavior', () => {
  it('advertises read operations as read-only and idempotent', () => {
    const readTool = defineCredentialTool({
      name: 'ebay_example_status',
      namespace: 'token-management',
      description: 'Read credential status',
      argumentsSchema: z.object({}).strict(),
      operationKind: 'read',
      operation: async () => ({ kind: 'credentialToolSucceeded', document: {} }),
    });

    expect(readTool.annotations).toEqual({
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    });
  });

  it('advertises write operations as non-read-only and non-idempotent', () => {
    const writeTool = defineCredentialTool({
      name: 'ebay_example_set',
      namespace: 'token-management',
      description: 'Write credentials',
      argumentsSchema: z.object({}).strict(),
      operationKind: 'write',
      operation: async () => ({ kind: 'credentialToolSucceeded', document: {} }),
    });

    expect(writeTool.annotations).toEqual({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    });
  });

  it('translates success documents and failures at the MCP boundary', async () => {
    const successTool = defineCredentialTool({
      name: 'ebay_example_success',
      namespace: 'token-management',
      description: 'Succeed',
      argumentsSchema: z.object({ label: z.string() }).strict(),
      operationKind: 'read',
      operation: async (_ebaySellerApi, credentialArguments) => ({
        kind: 'credentialToolSucceeded',
        document: { label: credentialArguments.label },
      }),
    });

    await expect(successTool.completeMcpCall(ebaySellerApi, { label: 'ok' })).resolves.toEqual({
      content: [{ type: 'text', text: JSON.stringify({ label: 'ok' }, null, 2) }],
    });

    const failureTool = defineCredentialTool({
      name: 'ebay_example_failure',
      namespace: 'token-management',
      description: 'Fail',
      argumentsSchema: z.object({}).strict(),
      operationKind: 'write',
      operation: async () => ({
        kind: 'credentialToolFailed',
        failure: { kind: 'credentialToolRejected', message: 'missing tokens' },
      }),
    });

    await expect(failureTool.completeMcpCall(ebaySellerApi, {})).resolves.toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              credentialFailure: {
                kind: 'credentialToolRejected',
                message: 'missing tokens',
              },
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    });
  });

  it('passes the seller API facade into the operation', async () => {
    const observedApi = vi.fn();
    const tool = defineCredentialTool({
      name: 'ebay_example_api',
      namespace: 'token-management',
      description: 'Observe API',
      argumentsSchema: z.object({}).strict(),
      operationKind: 'read',
      operation: async (sellerApi) => {
        observedApi(sellerApi);
        return { kind: 'credentialToolSucceeded', document: { ok: true } };
      },
    });

    await tool.completeMcpCall(ebaySellerApi, {});
    expect(observedApi).toHaveBeenCalledWith(ebaySellerApi);
  });
});
