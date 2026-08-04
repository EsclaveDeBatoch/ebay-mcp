import { describe, expect, it } from 'vitest';

import {
  getAutomotivePartsCompatibilityPolicies,
  getCategoryPolicies,
  getClassifiedAdPolicies,
  getCurrencies,
  getExtendedProducerResponsibilityPolicies,
  getHazardousMaterialsLabels,
  getItemConditionPolicies,
  getListingStructurePolicies,
  getListingTypePolicies,
  getMotorsListingPolicies,
  getNegotiatedPricePolicies,
  getProductSafetyLabels,
  getRegulatoryPolicies,
  getReturnPolicies,
  getShippingPolicies,
  getSiteVisibilityPolicies,
  marketplaceOnlyArgumentsSchema,
  marketplacePolicyArgumentsSchema,
} from '@/ebay/sell/metadata/marketplace.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

const filteredMarketplaceOperations = [
  {
    metadataOperation: getAutomotivePartsCompatibilityPolicies,
    endpointSuffix: 'get_automotive_parts_compatibility_policies',
  },
  { metadataOperation: getCategoryPolicies, endpointSuffix: 'get_category_policies' },
  { metadataOperation: getClassifiedAdPolicies, endpointSuffix: 'get_classified_ad_policies' },
  {
    metadataOperation: getExtendedProducerResponsibilityPolicies,
    endpointSuffix: 'get_extended_producer_responsibility_policies',
  },
  {
    metadataOperation: getItemConditionPolicies,
    endpointSuffix: 'get_item_condition_policies',
  },
  {
    metadataOperation: getListingStructurePolicies,
    endpointSuffix: 'get_listing_structure_policies',
  },
  {
    metadataOperation: getListingTypePolicies,
    endpointSuffix: 'get_listing_type_policies',
  },
  {
    metadataOperation: getMotorsListingPolicies,
    endpointSuffix: 'get_motors_listing_policies',
  },
  {
    metadataOperation: getNegotiatedPricePolicies,
    endpointSuffix: 'get_negotiated_price_policies',
  },
  { metadataOperation: getRegulatoryPolicies, endpointSuffix: 'get_regulatory_policies' },
  { metadataOperation: getReturnPolicies, endpointSuffix: 'get_return_policies' },
  { metadataOperation: getShippingPolicies, endpointSuffix: 'get_shipping_policies' },
  {
    metadataOperation: getSiteVisibilityPolicies,
    endpointSuffix: 'get_site_visibility_policies',
  },
] as const;

const unfilteredMarketplaceOperations = [
  { metadataOperation: getCurrencies, endpointSuffix: 'get_currencies' },
  {
    metadataOperation: getHazardousMaterialsLabels,
    endpointSuffix: 'get_hazardous_materials_labels',
  },
  {
    metadataOperation: getProductSafetyLabels,
    endpointSuffix: 'get_product_safety_labels',
  },
] as const;

describe('Sell Metadata marketplace schemas', () => {
  it('accepts the exact marketplace path and optional category filter', () => {
    expect(
      marketplacePolicyArgumentsSchema.parse({
        filter: 'categoryIds:{9355}',
        marketplace_id: 'EBAY_US',
      }),
    ).toEqual({ filter: 'categoryIds:{9355}', marketplace_id: 'EBAY_US' });
  });

  it.each([
    { marketplaceId: 'EBAY_US' },
    { marketplace_id: 'EBAY_US', filter: '' },
    { marketplace_id: '' },
  ])('rejects renamed or empty marketplace fields', (invalidMarketplaceArguments) => {
    expect(() => marketplacePolicyArgumentsSchema.parse(invalidMarketplaceArguments)).toThrow();
  });

  it('keeps unfiltered operations free of filter fields', () => {
    expect(() =>
      marketplaceOnlyArgumentsSchema.parse({
        marketplace_id: 'EBAY_US',
        filter: 'categoryIds:{9355}',
      }),
    ).toThrow();
  });
});

describe('Sell Metadata marketplace operations', () => {
  it.each(filteredMarketplaceOperations)(
    'calls $endpointSuffix with the exact path and filter',
    async ({ endpointSuffix, metadataOperation }) => {
      const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
        kind: 'ebayRequestSucceeded',
        ebayDocument: {},
      });

      await metadataOperation(sellerSession, {
        filter: 'categoryIds:{9355}',
        marketplace_id: 'EBAY_US',
      });

      expect(getCalls).toEqual([
        {
          endpoint: `/sell/metadata/v1/marketplace/EBAY_US/${endpointSuffix}`,
          searchParameters: { filter: 'categoryIds:{9355}' },
        },
      ]);
    },
  );

  it.each(unfilteredMarketplaceOperations)(
    'calls $endpointSuffix without an invented search object',
    async ({ endpointSuffix, metadataOperation }) => {
      const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
        kind: 'ebayRequestSucceeded',
        ebayDocument: {},
      });

      await metadataOperation(sellerSession, { marketplace_id: 'EBAY_US' });

      expect(getCalls).toEqual([
        { endpoint: `/sell/metadata/v1/marketplace/EBAY_US/${endpointSuffix}` },
      ]);
    },
  );
});
