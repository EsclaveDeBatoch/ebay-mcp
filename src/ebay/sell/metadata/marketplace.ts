import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/listing-metadata/sellMetadataV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const marketplaceIdSchema = z.string().min(1);

/** Exact eBay path and filter fields accepted by marketplace policy operations. */
export const marketplacePolicyArgumentsSchema = z
  .object({
    filter: z.string().min(1).optional(),
    marketplace_id: marketplaceIdSchema,
  })
  .strict();

/** Exact eBay marketplace path field accepted by unfiltered marketplace operations. */
export const marketplaceOnlyArgumentsSchema = z
  .object({
    marketplace_id: marketplaceIdSchema,
  })
  .strict();

/** Validated eBay marketplace path and optional category filter. */
export type MarketplacePolicyArguments = z.infer<typeof marketplacePolicyArgumentsSchema>;

/** Validated eBay marketplace path. */
export type MarketplaceOnlyArguments = z.infer<typeof marketplaceOnlyArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/metadata/types/sel:AutomotivePartsCompatibilityPolicyResponse */
export type AutomotivePartsCompatibilityPolicies =
  | components['schemas']['AutomotivePartsCompatibilityPolicyResponse']
  | undefined;

/** @see https://developer.ebay.com/api-docs/sell/metadata/types/sel:CategoryPolicyResponse */
export type CategoryPolicies = components['schemas']['CategoryPolicyResponse'] | undefined;

/** @see https://developer.ebay.com/api-docs/sell/metadata/types/sel:ClassifiedAdPolicyResponse */
export type ClassifiedAdPolicies = components['schemas']['ClassifiedAdPolicyResponse'] | undefined;

/** @see https://developer.ebay.com/api-docs/sell/metadata/types/api:GetCurrenciesResponse */
export type MarketplaceCurrencies = components['schemas']['GetCurrenciesResponse'] | undefined;

/** @see https://developer.ebay.com/api-docs/sell/metadata/types/sel:ExtendedProducerResponsibilityPolicyResponse */
export type ExtendedProducerResponsibilityPolicies =
  | components['schemas']['ExtendedProducerResponsibilityPolicyResponse']
  | undefined;

/** @see https://developer.ebay.com/api-docs/sell/metadata/types/api:HazardousMaterialDetailsResponse */
export type HazardousMaterialLabels =
  | components['schemas']['HazardousMaterialDetailsResponse']
  | undefined;

/** @see https://developer.ebay.com/api-docs/sell/metadata/types/sel:ItemConditionPolicyResponse */
export type ItemConditionPolicies =
  | components['schemas']['ItemConditionPolicyResponse']
  | undefined;

/** @see https://developer.ebay.com/api-docs/sell/metadata/types/sel:ListingStructurePolicyResponse */
export type ListingStructurePolicies =
  | components['schemas']['ListingStructurePolicyResponse']
  | undefined;

/** @see https://developer.ebay.com/api-docs/sell/metadata/types/sel:ListingTypePoliciesResponse */
export type ListingTypePolicies = components['schemas']['ListingTypePoliciesResponse'] | undefined;

/** @see https://developer.ebay.com/api-docs/sell/metadata/types/sel:MotorsListingPoliciesResponse */
export type MotorsListingPolicies =
  | components['schemas']['MotorsListingPoliciesResponse']
  | undefined;

/** @see https://developer.ebay.com/api-docs/sell/metadata/types/sel:NegotiatedPricePolicyResponse */
export type NegotiatedPricePolicies =
  | components['schemas']['NegotiatedPricePolicyResponse']
  | undefined;

/** @see https://developer.ebay.com/api-docs/sell/metadata/types/sel:ProductSafetyLabelsResponse */
export type ProductSafetyLabels = components['schemas']['ProductSafetyLabelsResponse'] | undefined;

/** @see https://developer.ebay.com/api-docs/sell/metadata/types/sel:RegulatoryPolicyResponse */
export type RegulatoryPolicies = components['schemas']['RegulatoryPolicyResponse'] | undefined;

/** @see https://developer.ebay.com/api-docs/sell/metadata/types/sel:ReturnPolicyResponse */
export type ReturnPolicies = components['schemas']['ReturnPolicyResponse'] | undefined;

/** @see https://developer.ebay.com/api-docs/sell/metadata/types/sel:ShippingPoliciesResponse */
export type ShippingPolicies = components['schemas']['ShippingPoliciesResponse'] | undefined;

/** @see https://developer.ebay.com/api-docs/sell/metadata/types/sel:SiteVisibilityPoliciesResponse */
export type SiteVisibilityPolicies =
  | components['schemas']['SiteVisibilityPoliciesResponse']
  | undefined;

/**
 * Retrieves automotive parts compatibility policies for one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param automotivePolicyLookup - Exact eBay marketplace path and optional category filter.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getAutomotivePartsCompatibilityPolicies(sellerSession, { marketplace_id: 'EBAY_MOTORS_US' })`
 * @see https://developer.ebay.com/api-docs/sell/metadata/resources/marketplace/methods/getAutomotivePartsCompatibilityPolicies
 */
export const getAutomotivePartsCompatibilityPolicies = (
  sellerSession: EbaySellerSession,
  automotivePolicyLookup: MarketplacePolicyArguments,
): Promise<EbayRequestCompletion<AutomotivePartsCompatibilityPolicies>> => {
  const { marketplace_id: marketplaceId, ...categoryFilter } = automotivePolicyLookup;
  return sellerSession.get<AutomotivePartsCompatibilityPolicies>({
    endpoint: `/sell/metadata/v1/marketplace/${encodeURIComponent(marketplaceId)}/get_automotive_parts_compatibility_policies`,
    searchParameters: categoryFilter,
  });
};

/**
 * Retrieves listing category policies for one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param categoryPolicyLookup - Exact eBay marketplace path and optional category filter.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getCategoryPolicies(sellerSession, { marketplace_id: 'EBAY_US' })`
 * @see https://developer.ebay.com/api-docs/sell/metadata/resources/marketplace/methods/getCategoryPolicies
 */
export const getCategoryPolicies = (
  sellerSession: EbaySellerSession,
  categoryPolicyLookup: MarketplacePolicyArguments,
): Promise<EbayRequestCompletion<CategoryPolicies>> => {
  const { marketplace_id: marketplaceId, ...categoryFilter } = categoryPolicyLookup;
  return sellerSession.get<CategoryPolicies>({
    endpoint: `/sell/metadata/v1/marketplace/${encodeURIComponent(marketplaceId)}/get_category_policies`,
    searchParameters: categoryFilter,
  });
};

/**
 * Retrieves classified-ad policies for one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param classifiedAdPolicyLookup - Exact eBay marketplace path and optional category filter.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getClassifiedAdPolicies(sellerSession, { marketplace_id: 'EBAY_GB' })`
 * @see https://developer.ebay.com/api-docs/sell/metadata/resources/marketplace/methods/getClassifiedAdPolicies
 */
export const getClassifiedAdPolicies = (
  sellerSession: EbaySellerSession,
  classifiedAdPolicyLookup: MarketplacePolicyArguments,
): Promise<EbayRequestCompletion<ClassifiedAdPolicies>> => {
  const { marketplace_id: marketplaceId, ...categoryFilter } = classifiedAdPolicyLookup;
  return sellerSession.get<ClassifiedAdPolicies>({
    endpoint: `/sell/metadata/v1/marketplace/${encodeURIComponent(marketplaceId)}/get_classified_ad_policies`,
    searchParameters: categoryFilter,
  });
};

/**
 * Retrieves the default currency for one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param marketplaceSelection - Exact eBay marketplace path field.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getCurrencies(sellerSession, { marketplace_id: 'EBAY_US' })`
 * @see https://developer.ebay.com/api-docs/sell/metadata/resources/marketplace/methods/getCurrencies
 */
export const getCurrencies = (
  sellerSession: EbaySellerSession,
  marketplaceSelection: MarketplaceOnlyArguments,
): Promise<EbayRequestCompletion<MarketplaceCurrencies>> =>
  sellerSession.get<MarketplaceCurrencies>({
    endpoint: `/sell/metadata/v1/marketplace/${encodeURIComponent(marketplaceSelection.marketplace_id)}/get_currencies`,
  });

/**
 * Retrieves extended producer responsibility policies for one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param producerResponsibilityLookup - Exact eBay marketplace path and category filter.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getExtendedProducerResponsibilityPolicies(sellerSession, { marketplace_id: 'EBAY_DE' })`
 * @see https://developer.ebay.com/api-docs/sell/metadata/resources/marketplace/methods/getExtendedProducerResponsibilityPolicies
 */
export const getExtendedProducerResponsibilityPolicies = (
  sellerSession: EbaySellerSession,
  producerResponsibilityLookup: MarketplacePolicyArguments,
): Promise<EbayRequestCompletion<ExtendedProducerResponsibilityPolicies>> => {
  const { marketplace_id: marketplaceId, ...categoryFilter } = producerResponsibilityLookup;
  return sellerSession.get<ExtendedProducerResponsibilityPolicies>({
    endpoint: `/sell/metadata/v1/marketplace/${encodeURIComponent(marketplaceId)}/get_extended_producer_responsibility_policies`,
    searchParameters: categoryFilter,
  });
};

/**
 * Retrieves hazardous-material labels for one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param marketplaceSelection - Exact eBay marketplace path field.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getHazardousMaterialsLabels(sellerSession, { marketplace_id: 'EBAY_US' })`
 * @see https://developer.ebay.com/api-docs/sell/metadata/resources/marketplace/methods/getHazardousMaterialsLabels
 */
export const getHazardousMaterialsLabels = (
  sellerSession: EbaySellerSession,
  marketplaceSelection: MarketplaceOnlyArguments,
): Promise<EbayRequestCompletion<HazardousMaterialLabels>> =>
  sellerSession.get<HazardousMaterialLabels>({
    endpoint: `/sell/metadata/v1/marketplace/${encodeURIComponent(marketplaceSelection.marketplace_id)}/get_hazardous_materials_labels`,
  });

/**
 * Retrieves supported item-condition policies for one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param itemConditionLookup - Exact eBay marketplace path and optional category filter.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getItemConditionPolicies(sellerSession, { marketplace_id: 'EBAY_US' })`
 * @see https://developer.ebay.com/api-docs/sell/metadata/resources/marketplace/methods/getItemConditionPolicies
 */
export const getItemConditionPolicies = (
  sellerSession: EbaySellerSession,
  itemConditionLookup: MarketplacePolicyArguments,
): Promise<EbayRequestCompletion<ItemConditionPolicies>> => {
  const { marketplace_id: marketplaceId, ...categoryFilter } = itemConditionLookup;
  return sellerSession.get<ItemConditionPolicies>({
    endpoint: `/sell/metadata/v1/marketplace/${encodeURIComponent(marketplaceId)}/get_item_condition_policies`,
    searchParameters: categoryFilter,
  });
};

/**
 * Retrieves listing-structure policies for one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param listingStructureLookup - Exact eBay marketplace path and optional category filter.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getListingStructurePolicies(sellerSession, { marketplace_id: 'EBAY_US' })`
 * @see https://developer.ebay.com/api-docs/sell/metadata/resources/marketplace/methods/getListingStructurePolicies
 */
export const getListingStructurePolicies = (
  sellerSession: EbaySellerSession,
  listingStructureLookup: MarketplacePolicyArguments,
): Promise<EbayRequestCompletion<ListingStructurePolicies>> => {
  const { marketplace_id: marketplaceId, ...categoryFilter } = listingStructureLookup;
  return sellerSession.get<ListingStructurePolicies>({
    endpoint: `/sell/metadata/v1/marketplace/${encodeURIComponent(marketplaceId)}/get_listing_structure_policies`,
    searchParameters: categoryFilter,
  });
};

/**
 * Retrieves listing-type policies for one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param listingTypeLookup - Exact eBay marketplace path and optional category filter.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getListingTypePolicies(sellerSession, { marketplace_id: 'EBAY_US' })`
 * @see https://developer.ebay.com/api-docs/sell/metadata/resources/marketplace/methods/getListingTypePolicies
 */
export const getListingTypePolicies = (
  sellerSession: EbaySellerSession,
  listingTypeLookup: MarketplacePolicyArguments,
): Promise<EbayRequestCompletion<ListingTypePolicies>> => {
  const { marketplace_id: marketplaceId, ...categoryFilter } = listingTypeLookup;
  return sellerSession.get<ListingTypePolicies>({
    endpoint: `/sell/metadata/v1/marketplace/${encodeURIComponent(marketplaceId)}/get_listing_type_policies`,
    searchParameters: categoryFilter,
  });
};

/**
 * Retrieves Motors listing policies for one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param motorsListingLookup - Exact eBay marketplace path and optional category filter.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getMotorsListingPolicies(sellerSession, { marketplace_id: 'EBAY_MOTORS_US' })`
 * @see https://developer.ebay.com/api-docs/sell/metadata/resources/marketplace/methods/getMotorsListingPolicies
 */
export const getMotorsListingPolicies = (
  sellerSession: EbaySellerSession,
  motorsListingLookup: MarketplacePolicyArguments,
): Promise<EbayRequestCompletion<MotorsListingPolicies>> => {
  const { marketplace_id: marketplaceId, ...categoryFilter } = motorsListingLookup;
  return sellerSession.get<MotorsListingPolicies>({
    endpoint: `/sell/metadata/v1/marketplace/${encodeURIComponent(marketplaceId)}/get_motors_listing_policies`,
    searchParameters: categoryFilter,
  });
};

/**
 * Retrieves negotiated-price policies for one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param negotiatedPriceLookup - Exact eBay marketplace path and optional category filter.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getNegotiatedPricePolicies(sellerSession, { marketplace_id: 'EBAY_US' })`
 * @see https://developer.ebay.com/api-docs/sell/metadata/resources/marketplace/methods/getNegotiatedPricePolicies
 */
export const getNegotiatedPricePolicies = (
  sellerSession: EbaySellerSession,
  negotiatedPriceLookup: MarketplacePolicyArguments,
): Promise<EbayRequestCompletion<NegotiatedPricePolicies>> => {
  const { marketplace_id: marketplaceId, ...categoryFilter } = negotiatedPriceLookup;
  return sellerSession.get<NegotiatedPricePolicies>({
    endpoint: `/sell/metadata/v1/marketplace/${encodeURIComponent(marketplaceId)}/get_negotiated_price_policies`,
    searchParameters: categoryFilter,
  });
};

/**
 * Retrieves product-safety labels for one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param marketplaceSelection - Exact eBay marketplace path field.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getProductSafetyLabels(sellerSession, { marketplace_id: 'EBAY_DE' })`
 * @see https://developer.ebay.com/api-docs/sell/metadata/resources/marketplace/methods/getProductSafetyLabels
 */
export const getProductSafetyLabels = (
  sellerSession: EbaySellerSession,
  marketplaceSelection: MarketplaceOnlyArguments,
): Promise<EbayRequestCompletion<ProductSafetyLabels>> =>
  sellerSession.get<ProductSafetyLabels>({
    endpoint: `/sell/metadata/v1/marketplace/${encodeURIComponent(marketplaceSelection.marketplace_id)}/get_product_safety_labels`,
  });

/**
 * Retrieves regulatory policies for one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param regulatoryPolicyLookup - Exact eBay marketplace path and optional category filter.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getRegulatoryPolicies(sellerSession, { marketplace_id: 'EBAY_DE' })`
 * @see https://developer.ebay.com/api-docs/sell/metadata/resources/marketplace/methods/getRegulatoryPolicies
 */
export const getRegulatoryPolicies = (
  sellerSession: EbaySellerSession,
  regulatoryPolicyLookup: MarketplacePolicyArguments,
): Promise<EbayRequestCompletion<RegulatoryPolicies>> => {
  const { marketplace_id: marketplaceId, ...categoryFilter } = regulatoryPolicyLookup;
  return sellerSession.get<RegulatoryPolicies>({
    endpoint: `/sell/metadata/v1/marketplace/${encodeURIComponent(marketplaceId)}/get_regulatory_policies`,
    searchParameters: categoryFilter,
  });
};

/**
 * Retrieves return-policy requirements for one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param returnPolicyLookup - Exact eBay marketplace path and optional category filter.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getReturnPolicies(sellerSession, { marketplace_id: 'EBAY_US' })`
 * @see https://developer.ebay.com/api-docs/sell/metadata/resources/marketplace/methods/getReturnPolicies
 */
export const getReturnPolicies = (
  sellerSession: EbaySellerSession,
  returnPolicyLookup: MarketplacePolicyArguments,
): Promise<EbayRequestCompletion<ReturnPolicies>> => {
  const { marketplace_id: marketplaceId, ...categoryFilter } = returnPolicyLookup;
  return sellerSession.get<ReturnPolicies>({
    endpoint: `/sell/metadata/v1/marketplace/${encodeURIComponent(marketplaceId)}/get_return_policies`,
    searchParameters: categoryFilter,
  });
};

/**
 * Retrieves shipping policies for one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param shippingPolicyLookup - Exact eBay marketplace path and optional category filter.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getShippingPolicies(sellerSession, { marketplace_id: 'EBAY_US' })`
 * @see https://developer.ebay.com/api-docs/sell/metadata/resources/marketplace/methods/getShippingPolicies
 */
export const getShippingPolicies = (
  sellerSession: EbaySellerSession,
  shippingPolicyLookup: MarketplacePolicyArguments,
): Promise<EbayRequestCompletion<ShippingPolicies>> => {
  const { marketplace_id: marketplaceId, ...categoryFilter } = shippingPolicyLookup;
  return sellerSession.get<ShippingPolicies>({
    endpoint: `/sell/metadata/v1/marketplace/${encodeURIComponent(marketplaceId)}/get_shipping_policies`,
    searchParameters: categoryFilter,
  });
};

/**
 * Retrieves cross-border site-visibility policies for one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param siteVisibilityLookup - Exact eBay marketplace path and optional category filter.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getSiteVisibilityPolicies(sellerSession, { marketplace_id: 'EBAY_US' })`
 * @see https://developer.ebay.com/api-docs/sell/metadata/resources/marketplace/methods/getSiteVisibilityPolicies
 */
export const getSiteVisibilityPolicies = (
  sellerSession: EbaySellerSession,
  siteVisibilityLookup: MarketplacePolicyArguments,
): Promise<EbayRequestCompletion<SiteVisibilityPolicies>> => {
  const { marketplace_id: marketplaceId, ...categoryFilter } = siteVisibilityLookup;
  return sellerSession.get<SiteVisibilityPolicies>({
    endpoint: `/sell/metadata/v1/marketplace/${encodeURIComponent(marketplaceId)}/get_site_visibility_policies`,
    searchParameters: categoryFilter,
  });
};

export const getAutomotivePartsCompatibilityPoliciesTool = defineTool({
  name: 'ebay_sell_metadata_get_automotive_parts_compatibility_policies',
  namespace: 'sell.metadata',
  description: 'Retrieve automotive parts compatibility policies for one marketplace',
  argumentsSchema: marketplacePolicyArgumentsSchema,
  operationKind: 'read',
  operation: getAutomotivePartsCompatibilityPolicies,
});

export const getCategoryPoliciesTool = defineTool({
  name: 'ebay_sell_metadata_get_category_policies',
  namespace: 'sell.metadata',
  description: 'Retrieve listing category policies for one marketplace',
  argumentsSchema: marketplacePolicyArgumentsSchema,
  operationKind: 'read',
  operation: getCategoryPolicies,
});

export const getClassifiedAdPoliciesTool = defineTool({
  name: 'ebay_sell_metadata_get_classified_ad_policies',
  namespace: 'sell.metadata',
  description: 'Retrieve classified-ad listing policies for one marketplace',
  argumentsSchema: marketplacePolicyArgumentsSchema,
  operationKind: 'read',
  operation: getClassifiedAdPolicies,
});

export const getCurrenciesTool = defineTool({
  name: 'ebay_sell_metadata_get_currencies',
  namespace: 'sell.metadata',
  description: 'Retrieve the default currency for one marketplace',
  argumentsSchema: marketplaceOnlyArgumentsSchema,
  operationKind: 'read',
  operation: getCurrencies,
});

export const getExtendedProducerResponsibilityPoliciesTool = defineTool({
  name: 'ebay_sell_metadata_get_extended_producer_responsibility_policies',
  namespace: 'sell.metadata',
  description: 'Retrieve extended producer responsibility policies for one marketplace',
  argumentsSchema: marketplacePolicyArgumentsSchema,
  operationKind: 'read',
  operation: getExtendedProducerResponsibilityPolicies,
});

export const getHazardousMaterialsLabelsTool = defineTool({
  name: 'ebay_sell_metadata_get_hazardous_materials_labels',
  namespace: 'sell.metadata',
  description: 'Retrieve hazardous-material labels for one marketplace',
  argumentsSchema: marketplaceOnlyArgumentsSchema,
  operationKind: 'read',
  operation: getHazardousMaterialsLabels,
});

export const getItemConditionPoliciesTool = defineTool({
  name: 'ebay_sell_metadata_get_item_condition_policies',
  namespace: 'sell.metadata',
  description: 'Retrieve supported item-condition policies for one marketplace',
  argumentsSchema: marketplacePolicyArgumentsSchema,
  operationKind: 'read',
  operation: getItemConditionPolicies,
});

export const getListingStructurePoliciesTool = defineTool({
  name: 'ebay_sell_metadata_get_listing_structure_policies',
  namespace: 'sell.metadata',
  description: 'Retrieve listing-structure policies for one marketplace',
  argumentsSchema: marketplacePolicyArgumentsSchema,
  operationKind: 'read',
  operation: getListingStructurePolicies,
});

export const getListingTypePoliciesTool = defineTool({
  name: 'ebay_sell_metadata_get_listing_type_policies',
  namespace: 'sell.metadata',
  description: 'Retrieve listing-type policies for one marketplace',
  argumentsSchema: marketplacePolicyArgumentsSchema,
  operationKind: 'read',
  operation: getListingTypePolicies,
});

export const getMotorsListingPoliciesTool = defineTool({
  name: 'ebay_sell_metadata_get_motors_listing_policies',
  namespace: 'sell.metadata',
  description: 'Retrieve Motors listing policies for one marketplace',
  argumentsSchema: marketplacePolicyArgumentsSchema,
  operationKind: 'read',
  operation: getMotorsListingPolicies,
});

export const getNegotiatedPricePoliciesTool = defineTool({
  name: 'ebay_sell_metadata_get_negotiated_price_policies',
  namespace: 'sell.metadata',
  description: 'Retrieve negotiated-price policies for one marketplace',
  argumentsSchema: marketplacePolicyArgumentsSchema,
  operationKind: 'read',
  operation: getNegotiatedPricePolicies,
});

export const getProductSafetyLabelsTool = defineTool({
  name: 'ebay_sell_metadata_get_product_safety_labels',
  namespace: 'sell.metadata',
  description: 'Retrieve product-safety labels for one marketplace',
  argumentsSchema: marketplaceOnlyArgumentsSchema,
  operationKind: 'read',
  operation: getProductSafetyLabels,
});

export const getRegulatoryPoliciesTool = defineTool({
  name: 'ebay_sell_metadata_get_regulatory_policies',
  namespace: 'sell.metadata',
  description: 'Retrieve regulatory policies for one marketplace',
  argumentsSchema: marketplacePolicyArgumentsSchema,
  operationKind: 'read',
  operation: getRegulatoryPolicies,
});

export const getReturnPoliciesTool = defineTool({
  name: 'ebay_sell_metadata_get_return_policies',
  namespace: 'sell.metadata',
  description: 'Retrieve return-policy requirements for one marketplace',
  argumentsSchema: marketplacePolicyArgumentsSchema,
  operationKind: 'read',
  operation: getReturnPolicies,
});

export const getShippingPoliciesTool = defineTool({
  name: 'ebay_sell_metadata_get_shipping_policies',
  namespace: 'sell.metadata',
  description: 'Retrieve shipping policies for one marketplace',
  argumentsSchema: marketplacePolicyArgumentsSchema,
  operationKind: 'read',
  operation: getShippingPolicies,
});

export const getSiteVisibilityPoliciesTool = defineTool({
  name: 'ebay_sell_metadata_get_site_visibility_policies',
  namespace: 'sell.metadata',
  description: 'Retrieve cross-border site-visibility policies for one marketplace',
  argumentsSchema: marketplacePolicyArgumentsSchema,
  operationKind: 'read',
  operation: getSiteVisibilityPolicies,
});
