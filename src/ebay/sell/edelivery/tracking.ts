import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/other-apis/sellEdeliveryInternationalShippingOas3.js';
import { defineTool } from '@/mcp/defineTool.js';

/** Exact eBay query accepted by getTracking. */
export const getTrackingArgumentsSchema = z
  .object({
    tracking_number: z.string().min(1),
  })
  .strict();

/** Validated exact eBay tracking-number query. */
export type TrackingSearch = z.infer<typeof getTrackingArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/types/api:GetTrackingDetailResponses */
export type TrackingDetail = components['schemas']['GetTrackingDetailResponses'];

/**
 * Retrieves current tracking events for one eDelivery package.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param trackingSearch - Exact eBay tracking-number query.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getTracking(sellerSession, { tracking_number: 'ES000000001' })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/tracking/methods/getTracking
 */
export const getTracking = (
  sellerSession: EbaySellerSession,
  trackingSearch: TrackingSearch,
): Promise<EbayRequestCompletion<TrackingDetail>> =>
  sellerSession.get<TrackingDetail>({
    endpoint: '/sell/edelivery_international_shipping/v1/tracking',
    searchParameters: trackingSearch,
  });

export const getTrackingTool = defineTool({
  name: 'ebay_sell_edelivery_get_tracking',
  namespace: 'sell.edelivery',
  description: 'Retrieve current tracking events for one eDelivery package',
  argumentsSchema: getTrackingArgumentsSchema,
  operationKind: 'read',
  operation: getTracking,
});
