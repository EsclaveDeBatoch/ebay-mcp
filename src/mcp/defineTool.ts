import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import { type McpUiBinding, uiToolCompletion } from '@/mcp/uiBridge.js';
import { uiArchetypes } from '@/ui/archetypes.js';
import type { ChartViewModel } from '@/ui/viewModels.js';

/** Declarative source accepted by the target eBay tool definition. */
export type EbayToolSpec<ArgumentsSchema extends z.ZodObject, EbayDocument> = {
  readonly name: string;
  readonly namespace: string;
  readonly description: string;
  readonly argumentsSchema: ArgumentsSchema;
  readonly operation: (
    sellerSession: EbaySellerSession,
    ebayArguments: z.infer<ArgumentsSchema>,
  ) => Promise<EbayRequestCompletion<EbayDocument>>;
  readonly presentation?: (ebayDocument: EbayDocument) => ChartViewModel;
};

/** Type-erased runtime shape stored by the explicit eBay tool catalogue. */
export type EbayTool = {
  readonly name: string;
  readonly namespace: string;
  readonly description: string;
  readonly argumentsSchema: z.ZodObject;
  readonly annotations: {
    readonly readOnlyHint: true;
    readonly destructiveHint: false;
    readonly idempotentHint: true;
    readonly openWorldHint: true;
  };
  readonly ui?: McpUiBinding;
  readonly completeMcpCall: (
    sellerSession: EbaySellerSession,
    validatedArguments: unknown,
    browserPresentationEnabled: boolean,
  ) => Promise<CallToolResult>;
};

function successfulMcpCall(ebayDocument: unknown): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(ebayDocument, null, 2) }],
  };
}

function failedMcpCall(
  ebayRequestCompletion: Extract<EbayRequestCompletion<never>, { kind: 'ebayRequestFailed' }>,
): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ ebayFailure: ebayRequestCompletion.ebayFailure }, null, 2),
      },
    ],
    isError: true,
  };
}

function chartPresentationBinding<ArgumentsSchema extends z.ZodObject, EbayDocument>(
  ebayToolSpec: EbayToolSpec<ArgumentsSchema, EbayDocument>,
): McpUiBinding | undefined {
  if (ebayToolSpec.presentation === undefined) {
    return;
  }
  const chartPresentation = ebayToolSpec.presentation;
  return {
    archetype: 'chart',
    resourceUri: uiArchetypes.chart.uri,
    map: (ebayDocument: unknown) => chartPresentation(ebayDocument as EbayDocument),
  };
}

/**
 * Couples one strict Zod argument contract to one resource operation and translates its
 * closed completion at the MCP boundary.
 *
 * The SDK decodes `argumentsSchema` before invoking `completeMcpCall`; the documented cast
 * inside this factory restores that proven inferred type without decoding a second time.
 *
 * @param ebayToolSpec - Named tool metadata, strict argument schema, operation, and presenter.
 * @returns Catalogue-ready eBay tool definition.
 */
export const defineTool = <ArgumentsSchema extends z.ZodObject, EbayDocument>(
  ebayToolSpec: EbayToolSpec<ArgumentsSchema, EbayDocument>,
): EbayTool => {
  const uiBinding = chartPresentationBinding(ebayToolSpec);

  return {
    name: ebayToolSpec.name,
    namespace: ebayToolSpec.namespace,
    description: ebayToolSpec.description,
    argumentsSchema: ebayToolSpec.argumentsSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    ui: uiBinding,
    async completeMcpCall(sellerSession, validatedArguments, browserPresentationEnabled) {
      const ebayArguments = validatedArguments as z.infer<ArgumentsSchema>;
      const ebayRequestCompletion = await ebayToolSpec.operation(sellerSession, ebayArguments);
      if (ebayRequestCompletion.kind === 'ebayRequestFailed') {
        return failedMcpCall(ebayRequestCompletion);
      }
      if (browserPresentationEnabled && uiBinding !== undefined) {
        return uiToolCompletion(uiBinding, ebayRequestCompletion.ebayDocument);
      }
      return successfulMcpCall(ebayRequestCompletion.ebayDocument);
    },
  };
};
