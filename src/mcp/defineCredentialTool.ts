import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';

import type { EbaySellerApi } from '@/api/index.js';
import type { CredentialToolCompletion } from '@/mcp/credentialToolCompletion.js';

/** Declarative source accepted by a credential or local token-management tool. */
type CredentialToolSpec<ArgumentsSchema extends z.ZodObject, Document> = {
  readonly name: string;
  readonly namespace: string;
  readonly description: string;
  readonly argumentsSchema: ArgumentsSchema;
  readonly operationKind: 'read' | 'write';
  readonly operation: (
    ebaySellerApi: EbaySellerApi,
    credentialArguments: z.infer<ArgumentsSchema>,
  ) => Promise<CredentialToolCompletion<Document>>;
};

/** Type-erased runtime shape stored by the explicit credential tool catalogue. */
type CredentialTool = {
  readonly name: string;
  readonly namespace: string;
  readonly description: string;
  readonly argumentsSchema: z.ZodObject;
  readonly annotations: {
    readonly readOnlyHint: boolean;
    readonly destructiveHint: false;
    readonly idempotentHint: boolean;
    readonly openWorldHint: true;
  };
  readonly completeMcpCall: (
    ebaySellerApi: EbaySellerApi,
    validatedArguments: unknown,
  ) => Promise<CallToolResult>;
};

function successfulMcpCall(document: unknown): CallToolResult {
  if (document === undefined) {
    return { content: [] };
  }
  return {
    content: [{ type: 'text', text: JSON.stringify(document, null, 2) }],
  };
}

function mcpAnnotationsFor(operationKind: 'read' | 'write'): CredentialTool['annotations'] {
  if (operationKind === 'read') {
    return {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    };
  }
  return {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  };
}

function failedMcpCall(
  credentialToolCompletion: Extract<
    CredentialToolCompletion<never>,
    { kind: 'credentialToolFailed' }
  >,
): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ credentialFailure: credentialToolCompletion.failure }, null, 2),
      },
    ],
    isError: true,
  };
}

export type { CredentialTool, CredentialToolSpec };

/**
 * Couples one strict Zod argument contract to one credential operation and translates its
 * closed completion at the MCP boundary.
 *
 * The SDK decodes `argumentsSchema` before invoking `completeMcpCall`; the documented cast
 * inside this factory restores that proven inferred type without decoding a second time.
 *
 * @param credentialToolSpec - Named tool metadata, strict argument schema, and operation.
 * @returns Catalogue-ready credential tool definition.
 */
export const defineCredentialTool = <ArgumentsSchema extends z.ZodObject, Document>(
  credentialToolSpec: CredentialToolSpec<ArgumentsSchema, Document>,
): CredentialTool => ({
  name: credentialToolSpec.name,
  namespace: credentialToolSpec.namespace,
  description: credentialToolSpec.description,
  argumentsSchema: credentialToolSpec.argumentsSchema,
  annotations: mcpAnnotationsFor(credentialToolSpec.operationKind),
  async completeMcpCall(ebaySellerApi, validatedArguments) {
    const credentialArguments = validatedArguments as z.infer<ArgumentsSchema>;
    const credentialToolCompletion = await credentialToolSpec.operation(
      ebaySellerApi,
      credentialArguments,
    );
    if (credentialToolCompletion.kind === 'credentialToolFailed') {
      return failedMcpCall(credentialToolCompletion);
    }
    return successfulMcpCall(credentialToolCompletion.document);
  },
});
