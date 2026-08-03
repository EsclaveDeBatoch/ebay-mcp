import { XMLParser } from 'fast-xml-parser';
import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { defineTool } from '@/mcp/defineTool.js';
import { getErrorMessage } from '@/utils/errors.js';

const developerStatusFeedUrl = 'https://developer.ebay.com/rss/api-status';
const developerStatusTimeoutMs = 15_000;
const defaultIncidentLimit = 20;

/** Exact optional filters accepted by the public eBay developer status feed. */
export const getDeveloperStatusFeedArgumentsSchema = z
  .object({
    limit: z.number().int().min(1).max(50).optional(),
    status: z.enum(['Resolved', 'Unresolved']).optional(),
    api: z.string().trim().min(1).optional(),
  })
  .strict();

/** Validated filters used to search the public eBay developer status feed. */
export type DeveloperStatusSearchArguments = z.infer<typeof getDeveloperStatusFeedArgumentsSchema>;

/** One normalized incident published by the eBay developer status feed. */
export interface EbayApiIncident {
  readonly title: string;
  readonly summary: string;
  readonly link: string;
  readonly api: string;
  readonly site: string;
  readonly status: string;
  readonly lastUpdated: string;
}

/** Current incidents retrieved from the public eBay developer status feed. */
export interface EbayApiStatusFeed {
  readonly incidents: EbayApiIncident[];
}

interface RssIncidentSource {
  readonly title?: unknown;
  readonly description?: unknown;
  readonly link?: unknown;
  readonly summary?: unknown;
  readonly api?: unknown;
  readonly site?: unknown;
  readonly status?: unknown;
  readonly lastUpdated?: unknown;
}

interface RssStatusDocument {
  readonly rss?: {
    readonly channel?: {
      readonly item?: RssIncidentSource | RssIncidentSource[];
    };
  };
}

function plainTextFromHtml(htmlText: string): string {
  return htmlText
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function textFromRssField(rssField: unknown): string {
  if (rssField === undefined) {
    return '';
  }
  if (rssField === null) {
    return '';
  }
  if (typeof rssField === 'string') {
    return rssField.trim();
  }
  if (typeof rssField === 'number') {
    return String(rssField).trim();
  }
  if (typeof rssField === 'boolean') {
    return String(rssField).trim();
  }
  return '';
}

function nonEmptyTextOr(candidateText: string, fallbackText: string): string {
  if (candidateText.length > 0) {
    return candidateText;
  }
  return fallbackText;
}

function incidentSummaryFor(rssIncident: RssIncidentSource, incidentTitle: string): string {
  const explicitSummary = textFromRssField(rssIncident.summary);
  if (explicitSummary.length > 0) {
    return explicitSummary;
  }
  const descriptionSummary = plainTextFromHtml(textFromRssField(rssIncident.description)).slice(
    0,
    300,
  );
  return nonEmptyTextOr(descriptionSummary, incidentTitle);
}

function incidentFromRss(rssIncident: RssIncidentSource): EbayApiIncident {
  const incidentTitle = nonEmptyTextOr(textFromRssField(rssIncident.title), 'Untitled');
  return {
    title: incidentTitle,
    summary: incidentSummaryFor(rssIncident, incidentTitle),
    link: textFromRssField(rssIncident.link),
    api: textFromRssField(rssIncident.api),
    site: textFromRssField(rssIncident.site),
    status: textFromRssField(rssIncident.status),
    lastUpdated: textFromRssField(rssIncident.lastUpdated),
  };
}

function rssIncidentsFrom(
  rssIncidentSource: RssIncidentSource | RssIncidentSource[] | undefined,
): RssIncidentSource[] {
  if (rssIncidentSource === undefined) {
    return [];
  }
  if (Array.isArray(rssIncidentSource)) {
    return rssIncidentSource;
  }
  return [rssIncidentSource];
}

function incidentMatchesSearch(
  apiIncident: EbayApiIncident,
  statusSearch: DeveloperStatusSearchArguments,
): boolean {
  if (statusSearch.status !== undefined) {
    if (apiIncident.status.toLowerCase() !== statusSearch.status.toLowerCase()) {
      return false;
    }
  }
  if (statusSearch.api !== undefined) {
    if (!apiIncident.api.toLowerCase().includes(statusSearch.api.toLowerCase())) {
      return false;
    }
  }
  return true;
}

function incidentLimitFor(statusSearch: DeveloperStatusSearchArguments): number {
  if (statusSearch.limit === undefined) {
    return defaultIncidentLimit;
  }
  return statusSearch.limit;
}

function unavailableStatusFeed(failureMessage: string): EbayRequestCompletion<EbayApiStatusFeed> {
  return {
    kind: 'ebayRequestFailed',
    ebayFailure: { kind: 'ebayUnavailable', message: failureMessage },
  };
}

function statusFeedFromRss(
  rssText: string,
  statusSearch: DeveloperStatusSearchArguments,
): EbayRequestCompletion<EbayApiStatusFeed> {
  const rssParser = new XMLParser({
    ignoreAttributes: true,
    trimValues: true,
    parseTagValue: false,
  });
  // `fast-xml-parser` has no schema-aware return type. This cast is the parser boundary;
  // every optional level and field is narrowed below before use.
  const rssStatusDocument = rssParser.parse(rssText) as RssStatusDocument;
  if (rssStatusDocument.rss === undefined) {
    return unavailableStatusFeed('eBay API status feed is missing its RSS channel');
  }
  if (rssStatusDocument.rss.channel === undefined) {
    return unavailableStatusFeed('eBay API status feed is missing its RSS channel');
  }
  const normalizedIncidents = rssIncidentsFrom(rssStatusDocument.rss.channel.item).map(
    incidentFromRss,
  );
  const matchingIncidents = normalizedIncidents.filter((apiIncident) =>
    incidentMatchesSearch(apiIncident, statusSearch),
  );
  return {
    kind: 'ebayRequestSucceeded',
    ebayDocument: {
      incidents: matchingIncidents.slice(0, incidentLimitFor(statusSearch)),
    },
  };
}

function httpFailureMessage(statusCode: number, statusText: string): string {
  const statusDetail = `${statusCode} ${statusText}`.trim();
  return `eBay API status feed returned HTTP ${statusDetail}`;
}

/**
 * Retrieves and normalizes current incidents from eBay's public developer status RSS feed.
 *
 * @param statusSearch - Exact optional status, API-name, and incident-limit filters.
 * @returns Closed completion containing normalized incidents or feed unavailability.
 *
 * @example
 * ```ts
 * const completion = await getDeveloperStatusFeed({
 *   status: 'Unresolved',
 *   api: 'inventory',
 * });
 * ```
 *
 * @see https://developer.ebay.com/support/api-status
 */
export const getDeveloperStatusFeed = (
  statusSearch: DeveloperStatusSearchArguments = {},
): Promise<EbayRequestCompletion<EbayApiStatusFeed>> =>
  fetch(developerStatusFeedUrl, {
    headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
    signal: AbortSignal.timeout(developerStatusTimeoutMs),
  })
    .then(async (statusReply) => {
      if (!statusReply.ok) {
        return unavailableStatusFeed(
          httpFailureMessage(statusReply.status, statusReply.statusText),
        );
      }
      const rssText = await statusReply.text();
      return statusFeedFromRss(rssText, statusSearch);
    })
    .catch((statusFeedFailure: unknown) =>
      unavailableStatusFeed(
        getErrorMessage(statusFeedFailure, 'Failed to fetch eBay API status feed'),
      ),
    );

/** MCP definition for the public eBay developer status feed. */
export const getDeveloperStatusFeedTool = defineTool({
  name: 'ebay_developer_status_get_incidents',
  namespace: 'developer.status',
  description: 'Retrieve current incidents from the public eBay developer status feed',
  argumentsSchema: getDeveloperStatusFeedArgumentsSchema,
  operationKind: 'read',
  operation: (_sellerSession, statusSearch) => getDeveloperStatusFeed(statusSearch),
});
