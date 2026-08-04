import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { apiStatusRssDocument, singleIncidentRssDocument } from '@tests/fixtures/apiStatusFeed.js';

import {
  getDeveloperStatusFeed,
  getDeveloperStatusFeedArgumentsSchema,
  type DeveloperStatusSearchArguments,
} from './incident.js';

const statusFeedFetch = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal('fetch', statusFeedFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('Developer status-feed arguments', () => {
  it.each([
    {},
    { limit: 1 },
    { status: 'Resolved' },
    { status: 'Unresolved', api: 'inventory', limit: 10 },
  ])('accepts exact supported filters', (acceptedStatusSearch) => {
    expect(getDeveloperStatusFeedArgumentsSchema.parse(acceptedStatusSearch)).toEqual(
      acceptedStatusSearch,
    );
  });

  it.each([
    { limit: 0 },
    { limit: 51 },
    { status: 'Investigating' },
    { api: '' },
    { apiName: 'inventory' },
    { status: 'Resolved', includeHistory: true },
  ])('rejects invalid, renamed, or unknown filters', (invalidStatusSearch) => {
    expect(getDeveloperStatusFeedArgumentsSchema.safeParse(invalidStatusSearch).success).toBe(
      false,
    );
  });
});

describe('Developer status-feed retrieval', () => {
  it('filters incidents and normalizes HTML descriptions', async () => {
    statusFeedFetch.mockResolvedValue(
      new Response(apiStatusRssDocument, {
        status: 200,
        headers: { 'Content-Type': 'application/rss+xml' },
      }),
    );
    const statusSearch: DeveloperStatusSearchArguments = {
      status: 'Unresolved',
      api: 'inventory',
      limit: 10,
    };

    const statusCompletion = await getDeveloperStatusFeed(statusSearch);

    expect(statusCompletion).toEqual({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {
        incidents: [
          {
            title: 'Inventory API latency',
            summary: 'Requests are taking longer than expected.',
            link: 'https://developer.ebay.com/support/status/inventory-latency',
            api: 'Inventory API',
            site: 'All',
            status: 'Unresolved',
            lastUpdated: '2026-08-03T14:30:00Z',
          },
        ],
      },
    });
    expect(statusFeedFetch).toHaveBeenCalledWith(
      'https://developer.ebay.com/rss/api-status',
      expect.objectContaining({
        headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('normalizes one RSS incident without inventing an array contract', async () => {
    statusFeedFetch.mockResolvedValue(new Response(singleIncidentRssDocument, { status: 200 }));

    const statusCompletion = await getDeveloperStatusFeed();

    expect(statusCompletion).toMatchObject({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {
        incidents: [
          {
            title: 'Sandbox maintenance',
            summary: 'Sandbox maintenance',
            api: 'Sandbox',
            status: 'Resolved',
          },
        ],
      },
    });
  });

  it('limits the filtered feed after normalization', async () => {
    statusFeedFetch.mockResolvedValue(new Response(apiStatusRssDocument, { status: 200 }));

    const statusCompletion = await getDeveloperStatusFeed({ limit: 1 });

    expect(statusCompletion).toMatchObject({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { incidents: [{ title: 'Inventory API latency' }] },
    });
  });

  it('returns a closed failure when the feed omits its channel', async () => {
    statusFeedFetch.mockResolvedValue(new Response('<rss></rss>', { status: 200 }));

    await expect(getDeveloperStatusFeed()).resolves.toEqual({
      kind: 'ebayRequestFailed',
      ebayFailure: {
        kind: 'ebayUnavailable',
        message: 'eBay API status feed is missing its RSS channel',
      },
    });
  });

  it('returns a closed failure for an HTTP outage', async () => {
    statusFeedFetch.mockResolvedValue(
      new Response('Unavailable', { status: 503, statusText: 'Service Unavailable' }),
    );

    await expect(getDeveloperStatusFeed()).resolves.toEqual({
      kind: 'ebayRequestFailed',
      ebayFailure: {
        kind: 'ebayUnavailable',
        message: 'eBay API status feed returned HTTP 503 Service Unavailable',
      },
    });
  });

  it('returns a closed failure for a network rejection', async () => {
    statusFeedFetch.mockRejectedValue(new Error('Connection closed'));

    await expect(getDeveloperStatusFeed()).resolves.toEqual({
      kind: 'ebayRequestFailed',
      ebayFailure: {
        kind: 'ebayUnavailable',
        message: 'Connection closed',
      },
    });
  });
});
