import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/other-apis/sellEdeliveryInternationalShippingOas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const pageSizeSchema = z
  .string()
  .regex(/^(?:[1-9]|[1-9]\d|1\d{2}|200)$/, 'limit must be an integer from 1 through 200');

const pageOffsetSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)$/, 'offset must be a non-negative integer');

/** Exact eBay pagination fields accepted by eDelivery option lookups. */
export const shippingOptionArgumentsSchema = z
  .object({
    limit: pageSizeSchema.optional(),
    offset: pageOffsetSchema.optional(),
  })
  .strict();

/** Validated eBay pagination used for eDelivery option lookups. */
export type ShippingOptionPage = z.infer<typeof shippingOptionArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/types/api:GetAgentListResponses */
export type ShippingAgentCollection = components['schemas']['GetAgentListResponses'];

/** @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/types/api:GetBatteryQualListResponses */
export type BatteryQualificationCollection = components['schemas']['GetBatteryQualListResponses'];

/** @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/types/api:GetDropoffSiteListResponses */
export type DropoffSiteCollection = components['schemas']['GetDropoffSiteListResponses'];

/** @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/types/api:GetServiceListResponses */
export type ShippingServiceCollection = components['schemas']['GetServiceListResponses'];

/**
 * Retrieves EU Authorized Representative agents associated with the seller's eDIS account.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param pageSelection - Exact eBay pagination fields.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getAgents(sellerSession, { limit: '50', offset: '0' })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/agents/methods/getAgents
 */
export const getAgents = (
  sellerSession: EbaySellerSession,
  pageSelection: ShippingOptionPage = {},
): Promise<EbayRequestCompletion<ShippingAgentCollection>> =>
  sellerSession.get<ShippingAgentCollection>({
    endpoint: '/sell/edelivery_international_shipping/v1/agents',
    searchParameters: pageSelection,
  });

/**
 * Retrieves battery qualifications associated with the seller's eDIS account.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param pageSelection - Exact eBay pagination fields.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getBatteryQualifications(sellerSession, { limit: '50' })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/battery_qualifications/methods/getBatteryQualifications
 */
export const getBatteryQualifications = (
  sellerSession: EbaySellerSession,
  pageSelection: ShippingOptionPage = {},
): Promise<EbayRequestCompletion<BatteryQualificationCollection>> =>
  sellerSession.get<BatteryQualificationCollection>({
    endpoint: '/sell/edelivery_international_shipping/v1/battery_qualifications',
    searchParameters: pageSelection,
  });

/**
 * Retrieves drop-off sites available to the seller's eDIS account.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param pageSelection - Exact eBay pagination fields.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getDropoffSites(sellerSession, { offset: '20' })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/dropoff_sites/methods/getDropoffSites
 */
export const getDropoffSites = (
  sellerSession: EbaySellerSession,
  pageSelection: ShippingOptionPage = {},
): Promise<EbayRequestCompletion<DropoffSiteCollection>> =>
  sellerSession.get<DropoffSiteCollection>({
    endpoint: '/sell/edelivery_international_shipping/v1/dropoff_sites',
    searchParameters: pageSelection,
  });

/**
 * Retrieves shipping services available to the seller's eDIS account.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param pageSelection - Exact eBay pagination fields.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getServices(sellerSession, { limit: '25' })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/services/methods/getServices
 */
export const getServices = (
  sellerSession: EbaySellerSession,
  pageSelection: ShippingOptionPage = {},
): Promise<EbayRequestCompletion<ShippingServiceCollection>> =>
  sellerSession.get<ShippingServiceCollection>({
    endpoint: '/sell/edelivery_international_shipping/v1/services',
    searchParameters: pageSelection,
  });

export const getAgentsTool = defineTool({
  name: 'ebay_sell_edelivery_get_agents',
  namespace: 'sell.edelivery',
  description: 'Retrieve eDIS EU Authorized Representative agents',
  argumentsSchema: shippingOptionArgumentsSchema,
  operationKind: 'read',
  operation: getAgents,
});

export const getBatteryQualificationsTool = defineTool({
  name: 'ebay_sell_edelivery_get_battery_qualifications',
  namespace: 'sell.edelivery',
  description: 'Retrieve eDIS battery shipping qualifications',
  argumentsSchema: shippingOptionArgumentsSchema,
  operationKind: 'read',
  operation: getBatteryQualifications,
});

export const getDropoffSitesTool = defineTool({
  name: 'ebay_sell_edelivery_get_dropoff_sites',
  namespace: 'sell.edelivery',
  description: 'Retrieve eDIS package drop-off sites',
  argumentsSchema: shippingOptionArgumentsSchema,
  operationKind: 'read',
  operation: getDropoffSites,
});

export const getServicesTool = defineTool({
  name: 'ebay_sell_edelivery_get_services',
  namespace: 'sell.edelivery',
  description: 'Retrieve eDIS international shipping services',
  argumentsSchema: shippingOptionArgumentsSchema,
  operationKind: 'read',
  operation: getServices,
});
