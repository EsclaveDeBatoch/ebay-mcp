import { describe, expect, it } from 'vitest';

import {
  createFulfillmentPolicy,
  createFulfillmentPolicyArgumentsSchema,
  deleteFulfillmentPolicy,
  deleteFulfillmentPolicyArgumentsSchema,
  getFulfillmentPolicies,
  getFulfillmentPoliciesArgumentsSchema,
  getFulfillmentPolicy,
  getFulfillmentPolicyArgumentsSchema,
  getFulfillmentPolicyByName,
  getFulfillmentPolicyByNameArgumentsSchema,
  updateFulfillmentPolicy,
  updateFulfillmentPolicyArgumentsSchema,
} from '@/ebay/sell/account/fulfillmentPolicy.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

const fulfillmentPolicyCreation = {
  categoryTypes: [{ name: 'ALL_EXCLUDING_MOTORS_VEHICLES' as const }],
  description: 'Standard domestic delivery',
  handlingTime: { unit: 'DAY' as const, value: 1 },
  marketplaceId: 'EBAY_US',
  name: 'Standard shipping',
  shippingOptions: [
    {
      costType: 'FLAT_RATE' as const,
      optionType: 'DOMESTIC' as const,
      shippingServices: [
        {
          shippingCost: { currency: 'USD', value: '5.00' },
          shippingServiceCode: 'USPSPriority',
          sortOrder: 1,
        },
      ],
    },
  ],
  shipToLocations: {
    regionExcluded: [{ regionName: 'APO/FPO', regionType: 'COUNTRY_REGION' as const }],
    regionIncluded: [{ regionName: 'US', regionType: 'COUNTRY' as const }],
  },
};

describe('Sell Account fulfillment-policy schemas', () => {
  it('accepts exact marketplace_id and Content-Language read fields', () => {
    const marketplaceSelection = {
      'Content-Language': 'fr-CA',
      marketplace_id: 'EBAY_CA',
    };

    expect(getFulfillmentPoliciesArgumentsSchema.parse(marketplaceSelection)).toEqual(
      marketplaceSelection,
    );
    expect(
      getFulfillmentPolicyByNameArgumentsSchema.parse({
        ...marketplaceSelection,
        name: 'Livraison standard',
      }),
    ).toEqual({ ...marketplaceSelection, name: 'Livraison standard' });
  });

  it.each([
    { marketplaceId: 'EBAY_US' },
    { marketplace_id: '' },
    { marketplace_id: 'EBAY_US', contentLanguage: 'en-US' },
  ])('rejects aliases and incomplete collection selectors', (invalidMarketplaceSelection) => {
    expect(() =>
      getFulfillmentPoliciesArgumentsSchema.parse(invalidMarketplaceSelection),
    ).toThrow();
  });

  it('accepts a direct fulfillment-policy document with complete nested values', () => {
    expect(createFulfillmentPolicyArgumentsSchema.parse(fulfillmentPolicyCreation)).toEqual(
      fulfillmentPolicyCreation,
    );
  });

  it.each([
    {
      ...fulfillmentPolicyCreation,
      categoryTypes: [{ default: true, name: 'ALL_EXCLUDING_MOTORS_VEHICLES' }],
    },
    {
      ...fulfillmentPolicyCreation,
      handlingTime: { unit: 'DAY' },
    },
    {
      ...fulfillmentPolicyCreation,
      shippingOptions: [
        {
          costType: 'FLAT_RATE',
          optionType: 'DOMESTIC',
          shippingServices: [{ shippingCost: { currency: 'USD' }, shippingServiceCode: 'UPS' }],
        },
      ],
    },
    {
      ...fulfillmentPolicyCreation,
      shippingOptions: [
        {
          costType: 'FLAT_RATE',
          insuranceOffered: true,
          optionType: 'DOMESTIC',
          shippingServices: [{ shippingServiceCode: 'UPS' }],
        },
      ],
    },
    {
      ...fulfillmentPolicyCreation,
      shippingOptions: [
        {
          costType: 'FLAT_RATE',
          optionType: 'DOMESTIC',
          shippingServices: [
            { shippingServiceCode: 'UPS', surcharge: { currency: 'USD', value: '1' } },
          ],
        },
      ],
    },
  ])('rejects incomplete or deprecated fulfillment-policy fields', (invalidFulfillmentPolicy) => {
    expect(() => createFulfillmentPolicyArgumentsSchema.parse(invalidFulfillmentPolicy)).toThrow();
  });

  it('requires a complete direct replacement without a policy wrapper', () => {
    const fulfillmentPolicyReplacement = {
      fulfillmentPolicyId: 'FULFILLMENT-1',
      ...fulfillmentPolicyCreation,
      name: 'Updated standard shipping',
    };

    expect(updateFulfillmentPolicyArgumentsSchema.parse(fulfillmentPolicyReplacement)).toEqual(
      fulfillmentPolicyReplacement,
    );
    expect(() =>
      updateFulfillmentPolicyArgumentsSchema.parse({
        fulfillmentPolicyId: 'FULFILLMENT-1',
        policy: fulfillmentPolicyCreation,
      }),
    ).toThrow();
    expect(() =>
      updateFulfillmentPolicyArgumentsSchema.parse({
        fulfillmentPolicyId: 'FULFILLMENT-1',
        marketplaceId: 'EBAY_US',
      }),
    ).toThrow();
  });

  it('requires the exact fulfillmentPolicyId path field', () => {
    expect(
      getFulfillmentPolicyArgumentsSchema.parse({ fulfillmentPolicyId: 'FULFILLMENT-1' }),
    ).toEqual({ fulfillmentPolicyId: 'FULFILLMENT-1' });
    expect(
      deleteFulfillmentPolicyArgumentsSchema.parse({ fulfillmentPolicyId: 'FULFILLMENT-1' }),
    ).toEqual({ fulfillmentPolicyId: 'FULFILLMENT-1' });
    expect(() =>
      getFulfillmentPolicyArgumentsSchema.parse({ fulfillment_policy_id: 'FULFILLMENT-1' }),
    ).toThrow();
  });
});

describe('Sell Account fulfillment-policy operations', () => {
  it('sends the exact collection query and optional localization header', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getFulfillmentPolicies(sellerSession, {
      'Content-Language': 'fr-CA',
      marketplace_id: 'EBAY_CA',
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/fulfillment_policy',
        requestHeaders: { 'Content-Language': 'fr-CA' },
        searchParameters: { marketplace_id: 'EBAY_CA' },
      },
    ]);
  });

  it('posts the direct create document', async () => {
    const { sellerSession, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await createFulfillmentPolicy(sellerSession, fulfillmentPolicyCreation);

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/account/v1/fulfillment_policy/',
        requestDocument: fulfillmentPolicyCreation,
      },
    ]);
  });

  it('encodes one fulfillment-policy path', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getFulfillmentPolicy(sellerSession, { fulfillmentPolicyId: 'FULFILLMENT/1' });

    expect(getCalls).toEqual([{ endpoint: '/sell/account/v1/fulfillment_policy/FULFILLMENT%2F1' }]);
  });

  it('sends exact policy-name query fields and optional localization header', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getFulfillmentPolicyByName(sellerSession, {
      'Content-Language': 'nl-BE',
      marketplace_id: 'EBAY_BE',
      name: 'Standaardverzending',
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/fulfillment_policy/get_by_policy_name',
        requestHeaders: { 'Content-Language': 'nl-BE' },
        searchParameters: { marketplace_id: 'EBAY_BE', name: 'Standaardverzending' },
      },
    ]);
  });

  it('keeps the path ID out of the direct replacement document', async () => {
    const { sellerSession, putCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const fulfillmentPolicyReplacement = {
      fulfillmentPolicyId: 'FULFILLMENT/1',
      ...fulfillmentPolicyCreation,
      name: 'Updated standard shipping',
    };

    await updateFulfillmentPolicy(sellerSession, fulfillmentPolicyReplacement);

    expect(putCalls).toEqual([
      {
        endpoint: '/sell/account/v1/fulfillment_policy/FULFILLMENT%2F1',
        requestDocument: {
          ...fulfillmentPolicyCreation,
          name: 'Updated standard shipping',
        },
      },
    ]);
  });

  it('deletes one encoded fulfillment-policy path', async () => {
    const { sellerSession, deleteCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    await deleteFulfillmentPolicy(sellerSession, { fulfillmentPolicyId: 'FULFILLMENT/1' });

    expect(deleteCalls).toEqual([
      { endpoint: '/sell/account/v1/fulfillment_policy/FULFILLMENT%2F1' },
    ]);
  });
});
