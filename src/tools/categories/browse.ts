import { findCompletedItemsInputSchema } from '@/schemas/other/finding.js';
import { defineTool } from '@/tools/defineTool.js';
import type { ToolEntry } from '@/tools/registry.js';
import { Effect } from 'effect';

/**
 * Browse / Finding tools for public marketplace search data.
 *
 * Gated as family `browse` via `EBAY_MCP_TOOLS=browse`.
 */
export const browseEntries: ToolEntry[] = [
  defineTool({
    name: 'ebay_find_completed_items',
    description:
      'Search eBay sold/completed listings for pricing research (sold comps). Uses the Finding API findCompletedItems operation with app credentials (SECURITY-APPNAME / EBAY_CLIENT_ID). Returns cleaned sold items: itemId, title, price, shippingCost, soldDate, condition, and listingUrl. Useful for market price research before listing or repricing. App credentials are sufficient for this public search data when OAuth is available.',
    inputSchema: findCompletedItemsInputSchema.shape,
    annotations: { readOnlyHint: true },
    handler: (api, args) => Effect.runPromise(api.finding.findCompletedItems(args)),
  }),
];
