import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import { type McpUiBinding, uiToolCompletion } from '@/mcp/uiBridge.js';
import { uiArchetypes } from '@/ui/archetypes.js';
import type { ViewArchetype, ViewModelByArchetype } from '@/ui/viewModels.js';

/** One explicit browser projection supported by a migrated eBay tool. */
type EbayToolPresentation<EbayDocument> = {
  [Archetype in ViewArchetype]: {
    readonly archetype: Archetype;
    readonly project: (ebayDocument: EbayDocument) => ViewModelByArchetype[Archetype];
  };
}[ViewArchetype];

/** Declarative source accepted by the target eBay tool definition. */
type EbayToolSpec<ArgumentsSchema extends z.ZodObject, EbayDocument> = {
  readonly name: string;
  readonly namespace: string;
  readonly description: string;
  readonly argumentsSchema: ArgumentsSchema;
  readonly operationKind: 'read' | 'write';
  readonly operation: (
    sellerSession: EbaySellerSession,
    ebayArguments: z.infer<ArgumentsSchema>,
  ) => Promise<EbayRequestCompletion<EbayDocument>>;
  readonly presentation?: EbayToolPresentation<EbayDocument>;
};

/** Type-erased runtime shape stored by the explicit eBay tool catalogue. */
type EbayTool = {
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
  readonly ui?: McpUiBinding;
  readonly completeMcpCall: (
    sellerSession: EbaySellerSession,
    validatedArguments: unknown,
    browserPresentationEnabled: boolean,
  ) => Promise<CallToolResult>;
};

function successfulMcpCall(ebayDocument: unknown): CallToolResult {
  if (ebayDocument === undefined) {
    return { content: [] };
  }
  return {
    content: [{ type: 'text', text: JSON.stringify(ebayDocument, null, 2) }],
  };
}

function mcpAnnotationsFor(operationKind: 'read' | 'write'): EbayTool['annotations'] {
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

function presentationBinding<ArgumentsSchema extends z.ZodObject, EbayDocument>(
  ebayToolSpec: EbayToolSpec<ArgumentsSchema, EbayDocument>,
): McpUiBinding | undefined {
  if (ebayToolSpec.presentation === undefined) {
    return;
  }
  const browserPresentation = ebayToolSpec.presentation;
  return {
    archetype: browserPresentation.archetype,
    resourceUri: uiArchetypes[browserPresentation.archetype].uri,
    map: (ebayDocument: unknown) => browserPresentation.project(ebayDocument as EbayDocument),
  };
}

export type { EbayTool, EbayToolPresentation, EbayToolSpec };

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
  const uiBinding = presentationBinding(ebayToolSpec);

  return {
    name: ebayToolSpec.name,
    namespace: ebayToolSpec.namespace,
    description: ebayToolSpec.description,
    argumentsSchema: ebayToolSpec.argumentsSchema,
    annotations: mcpAnnotationsFor(ebayToolSpec.operationKind),
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
