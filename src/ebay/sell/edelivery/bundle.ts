import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/other-apis/sellEdeliveryInternationalShippingOas3.js';
import { defineTool } from '@/mcp/defineTool.js';

/** Exact generated eBay document accepted by createBundle. */
export const createBundleArgumentsSchema = z
  .object({
    bundle: z
      .object({
        consignPreferenceId: z.string().min(1),
        trackingNumbers: z.array(z.string().min(1)).min(1),
      })
      .strict(),
  })
  .strict();

/** Exact eBay path field accepted by bundle operations. */
export const bundleIdArgumentsSchema = z
  .object({
    bundle_id: z.string().min(1),
  })
  .strict();

/** Validated generated eBay bundle document. */
export type BundleSubmission = z.infer<typeof createBundleArgumentsSchema>;

/** Validated exact eBay bundle path field. */
export type BundleLookup = z.infer<typeof bundleIdArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/types/api:CreateBundleResponse */
export type BundleCreation = components['schemas']['CreateBundleResponse'];

/** @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/types/api:BundleDetailResponse */
export type BundleDetail = components['schemas']['BundleDetailResponse'];

/** @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/types/api:BundleLabelResponse */
export type BundleLabel = components['schemas']['BundleLabelResponse'];

/**
 * Creates a bundle containing packages from one order.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param bundleSubmission - Exact generated eBay bundle document.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await createBundle(sellerSession, { bundle: { consignPreferenceId: 'C1', trackingNumbers: ['T1'] } })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/bundle/methods/createBundle
 */
export const createBundle = (
  sellerSession: EbaySellerSession,
  bundleSubmission: BundleSubmission,
): Promise<EbayRequestCompletion<BundleCreation>> =>
  sellerSession.post<BundleCreation>({
    endpoint: '/sell/edelivery_international_shipping/v1/bundle',
    requestDocument: bundleSubmission,
  });

/**
 * Retrieves one eDelivery package bundle.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param bundleLookup - Exact eBay bundle path field.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getBundle(sellerSession, { bundle_id: 'BUNDLE123' })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/bundle/methods/getBundle
 */
export const getBundle = (
  sellerSession: EbaySellerSession,
  bundleLookup: BundleLookup,
): Promise<EbayRequestCompletion<BundleDetail>> =>
  sellerSession.get<BundleDetail>({
    endpoint: `/sell/edelivery_international_shipping/v1/bundle/${encodeURIComponent(bundleLookup.bundle_id)}`,
  });

/**
 * Cancels one eDelivery package bundle.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param bundleLookup - Exact eBay bundle path field.
 * @returns Explicit completion containing eBay's empty success document or failure.
 * @example `await cancelBundle(sellerSession, { bundle_id: 'BUNDLE123' })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/bundle/methods/cancelBundle
 */
export const cancelBundle = (
  sellerSession: EbaySellerSession,
  bundleLookup: BundleLookup,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.post<undefined>({
    endpoint: `/sell/edelivery_international_shipping/v1/bundle/${encodeURIComponent(bundleLookup.bundle_id)}/cancel`,
  });

/**
 * Retrieves the shipping label for one eDelivery package bundle.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param bundleLookup - Exact eBay bundle path field.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getBundleLabel(sellerSession, { bundle_id: 'BUNDLE123' })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/bundle/methods/getBundleLabel
 */
export const getBundleLabel = (
  sellerSession: EbaySellerSession,
  bundleLookup: BundleLookup,
): Promise<EbayRequestCompletion<BundleLabel>> =>
  sellerSession.get<BundleLabel>({
    endpoint: `/sell/edelivery_international_shipping/v1/bundle/${encodeURIComponent(bundleLookup.bundle_id)}/label`,
  });

export const createBundleTool = defineTool({
  name: 'ebay_sell_edelivery_create_bundle',
  namespace: 'sell.edelivery',
  description: 'Create an eDelivery bundle for packages from one order',
  argumentsSchema: createBundleArgumentsSchema,
  operationKind: 'write',
  operation: createBundle,
});

export const getBundleTool = defineTool({
  name: 'ebay_sell_edelivery_get_bundle',
  namespace: 'sell.edelivery',
  description: 'Retrieve one eDelivery package bundle',
  argumentsSchema: bundleIdArgumentsSchema,
  operationKind: 'read',
  operation: getBundle,
});

export const cancelBundleTool = defineTool({
  name: 'ebay_sell_edelivery_cancel_bundle',
  namespace: 'sell.edelivery',
  description: 'Cancel one eDelivery package bundle',
  argumentsSchema: bundleIdArgumentsSchema,
  operationKind: 'write',
  operation: cancelBundle,
});

export const getBundleLabelTool = defineTool({
  name: 'ebay_sell_edelivery_get_bundle_label',
  namespace: 'sell.edelivery',
  description: 'Retrieve the shipping label for one eDelivery bundle',
  argumentsSchema: bundleIdArgumentsSchema,
  operationKind: 'read',
  operation: getBundleLabel,
});
