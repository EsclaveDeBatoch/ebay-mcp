import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/other-apis/sellEdeliveryInternationalShippingOas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const printPreferenceSchema = z
  .string()
  .regex(
    /^(?:nameZh|nameEn|remark|skuPrice|skuNo|quantity|listingId|sellerId|buyerId)(?:,(?:nameZh|nameEn|remark|skuPrice|skuNo|quantity|listingId|sellerId|buyerId))*$/,
    'print_preference must contain only documented comma-separated fields',
  );

/** Exact eBay query fields accepted by getLabels. */
export const getLabelsArgumentsSchema = z
  .object({
    page_size: z.enum(['A4', 'THERMAL_PAPER']).optional(),
    print_preference: printPreferenceSchema.optional(),
    tracking_numbers: z.string().min(1),
  })
  .strict();

/** Exact eBay query accepted by getHandoverSheet. */
export const getHandoverSheetArgumentsSchema = z
  .object({
    tracking_numbers: z.string().min(1),
  })
  .strict();

/** Validated exact eBay label query. */
export type ShippingLabelSearch = z.infer<typeof getLabelsArgumentsSchema>;

/** Validated exact eBay handover-sheet query. */
export type HandoverSheetSearch = z.infer<typeof getHandoverSheetArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/types/api:GetLabelListResponses */
export type ShippingLabelCollection = components['schemas']['GetLabelListResponses'];

/** @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/types/api:GetHandoverSheetResponses */
export type HandoverSheet = components['schemas']['GetHandoverSheetResponses'];

/**
 * Retrieves shipping labels for one or more tracking numbers.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param labelSearch - Exact eBay tracking-number and print query.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getLabels(sellerSession, { page_size: 'A4', tracking_numbers: 'T1' })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/labels/methods/getLabels
 */
export const getLabels = (
  sellerSession: EbaySellerSession,
  labelSearch: ShippingLabelSearch,
): Promise<EbayRequestCompletion<ShippingLabelCollection>> =>
  sellerSession.get<ShippingLabelCollection>({
    endpoint: '/sell/edelivery_international_shipping/v1/labels',
    searchParameters: labelSearch,
  });

/**
 * Retrieves the handover sheet for packages in one pickup request.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param handoverSheetSearch - Exact eBay tracking-number query.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getHandoverSheet(sellerSession, { tracking_numbers: 'T1' })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/handover_sheet/methods/getHandoverSheet
 */
export const getHandoverSheet = (
  sellerSession: EbaySellerSession,
  handoverSheetSearch: HandoverSheetSearch,
): Promise<EbayRequestCompletion<HandoverSheet>> =>
  sellerSession.get<HandoverSheet>({
    endpoint: '/sell/edelivery_international_shipping/v1/handover_sheet',
    searchParameters: handoverSheetSearch,
  });

export const getLabelsTool = defineTool({
  name: 'ebay_sell_edelivery_get_labels',
  namespace: 'sell.edelivery',
  description: 'Retrieve eDelivery shipping labels by tracking number',
  argumentsSchema: getLabelsArgumentsSchema,
  operationKind: 'read',
  operation: getLabels,
});

export const getHandoverSheetTool = defineTool({
  name: 'ebay_sell_edelivery_get_handover_sheet',
  namespace: 'sell.edelivery',
  description: 'Retrieve an eDelivery pickup handover sheet',
  argumentsSchema: getHandoverSheetArgumentsSchema,
  operationKind: 'read',
  operation: getHandoverSheet,
});
