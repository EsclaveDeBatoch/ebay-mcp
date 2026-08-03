import { Effect } from 'effect';
import { defineTool } from '@/tools/defineTool.js';
import { getApiStatusInputSchema } from '@/schemas/developer/apiStatus.js';
import { getApiStatusFeed } from '@/utils/apiStatusFeed.js';
import type { ToolEntry } from '@/tools/registry.js';

/** Public eBay API status feed tool. */
export const developerEntries: ToolEntry[] = [
  defineTool({
    name: 'ebay_get_api_status',
    description:
      'Get the latest eBay API status and incidents from the official RSS feed. Returns recent issues, fixes, and outages for eBay APIs (e.g. Trading API, Inventory API, Sandbox). Use when the user asks about API status, outages, or fixes.',
    inputSchema: getApiStatusInputSchema.shape,
    outputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              summary: { type: 'string' },
              link: { type: 'string' },
              api: { type: 'string' },
              site: { type: 'string' },
              status: { type: 'string' },
              lastUpdated: { type: 'string' },
            },
          },
        },
        error: { type: 'string' },
      },
      description: 'Latest API status items from eBay developer feed',
    },
    handler: (_api, args) =>
      Effect.runPromise(
        getApiStatusFeed(args).pipe(
          Effect.map((feed) => ({ items: feed.items, ...(feed.error && { error: feed.error }) })),
        ),
      ),
  }),
];
