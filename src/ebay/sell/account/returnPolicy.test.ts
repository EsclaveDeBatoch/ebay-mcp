import { describe, expect, it } from 'vitest';

import {
  createReturnPolicy,
  createReturnPolicyArgumentsSchema,
  deleteReturnPolicy,
  deleteReturnPolicyArgumentsSchema,
  getReturnPolicies,
  getReturnPoliciesArgumentsSchema,
  getReturnPolicy,
  getReturnPolicyArgumentsSchema,
  getReturnPolicyByName,
  getReturnPolicyByNameArgumentsSchema,
  updateReturnPolicy,
  updateReturnPolicyArgumentsSchema,
} from '@/ebay/sell/account/returnPolicy.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

const returnPolicyCreation = {
  categoryTypes: [{ name: 'ALL_EXCLUDING_MOTORS_VEHICLES' as const }],
  description: 'Domestic and international returns',
  internationalOverride: {
    returnMethod: 'REPLACEMENT' as const,
    returnPeriod: { unit: 'DAY' as const, value: 60 },
    returnsAccepted: true,
    returnShippingCostPayer: 'BUYER' as const,
  },
  marketplaceId: 'EBAY_DE',
  name: 'Flexible returns',
  refundMethod: 'MONEY_BACK' as const,
  returnInstructions: 'Use the enclosed label.',
  returnMethod: 'REPLACEMENT' as const,
  returnPeriod: { unit: 'DAY' as const, value: 30 },
  returnsAccepted: true,
  returnShippingCostPayer: 'SELLER' as const,
};

describe('Sell Account return-policy schemas', () => {
  it('accepts exact marketplace_id and Content-Language read fields', () => {
    const marketplaceSelection = {
      'Content-Language': 'fr-CA',
      marketplace_id: 'EBAY_CA',
    };

    expect(getReturnPoliciesArgumentsSchema.parse(marketplaceSelection)).toEqual(
      marketplaceSelection,
    );
    expect(
      getReturnPolicyByNameArgumentsSchema.parse({
        ...marketplaceSelection,
        name: 'Retours flexibles',
      }),
    ).toEqual({ ...marketplaceSelection, name: 'Retours flexibles' });
  });

  it.each([
    { marketplaceId: 'EBAY_US' },
    { marketplace_id: '' },
    { marketplace_id: 'EBAY_US', contentLanguage: 'en-US' },
  ])('rejects aliases and incomplete collection selectors', (invalidMarketplaceSelection) => {
    expect(() => getReturnPoliciesArgumentsSchema.parse(invalidMarketplaceSelection)).toThrow();
  });

  it('accepts a complete direct return-policy document', () => {
    expect(createReturnPolicyArgumentsSchema.parse(returnPolicyCreation)).toEqual(
      returnPolicyCreation,
    );
  });

  it.each([
    {
      ...returnPolicyCreation,
      categoryTypes: [{ name: 'MOTORS_VEHICLES' }],
    },
    {
      ...returnPolicyCreation,
      categoryTypes: [{ default: true, name: 'ALL_EXCLUDING_MOTORS_VEHICLES' }],
    },
    {
      ...returnPolicyCreation,
      extendedHolidayReturnsOffered: true,
    },
    {
      ...returnPolicyCreation,
      restockingFeePercentage: '10',
    },
    {
      ...returnPolicyCreation,
      refundMethod: 'MERCHANDISE_CREDIT',
    },
    {
      ...returnPolicyCreation,
      returnMethod: 'EXCHANGE',
    },
  ])('rejects motor vehicles, deprecated fields, and retired enum values', (invalidPolicy) => {
    expect(() => createReturnPolicyArgumentsSchema.parse(invalidPolicy)).toThrow();
  });

  it('requires domestic return terms when returns are accepted', () => {
    const missingPeriod = { ...returnPolicyCreation, returnPeriod: undefined };
    const missingPayer = { ...returnPolicyCreation, returnShippingCostPayer: undefined };

    expect(() => createReturnPolicyArgumentsSchema.parse(missingPeriod)).toThrow();
    expect(() => createReturnPolicyArgumentsSchema.parse(missingPayer)).toThrow();
  });

  it('requires an explicit domestic return decision', () => {
    expect(() =>
      createReturnPolicyArgumentsSchema.parse({
        marketplaceId: 'EBAY_US',
        name: 'Missing return decision',
      }),
    ).toThrow();
  });

  it('requires a decision and complete terms for an international override', () => {
    const missingDecision = {
      ...returnPolicyCreation,
      internationalOverride: { returnMethod: 'REPLACEMENT' },
    };
    const missingInternationalPayer = {
      ...returnPolicyCreation,
      internationalOverride: {
        returnPeriod: { unit: 'DAY', value: 30 },
        returnsAccepted: true,
      },
    };

    expect(() => createReturnPolicyArgumentsSchema.parse(missingDecision)).toThrow();
    expect(() => createReturnPolicyArgumentsSchema.parse(missingInternationalPayer)).toThrow();
  });

  it.each([
    { unit: 'HOUR', value: 30 },
    { unit: 'DAY', value: 0 },
    { unit: 'DAY', value: 30.5 },
  ])('rejects invalid return periods', (invalidReturnPeriod) => {
    expect(() =>
      createReturnPolicyArgumentsSchema.parse({
        ...returnPolicyCreation,
        returnPeriod: invalidReturnPeriod,
      }),
    ).toThrow();
  });

  it('accepts a no-returns policy without return terms', () => {
    const noReturnsPolicy = {
      marketplaceId: 'EBAY_US',
      name: 'Final sale',
      returnsAccepted: false,
    };

    expect(createReturnPolicyArgumentsSchema.parse(noReturnsPolicy)).toEqual(noReturnsPolicy);
  });

  it('enforces the marketplace-specific return-instructions limit', () => {
    const longReturnInstructions = 'x'.repeat(6000);

    expect(() =>
      createReturnPolicyArgumentsSchema.parse({
        marketplaceId: 'EBAY_US',
        name: 'US returns',
        returnInstructions: longReturnInstructions,
        returnsAccepted: false,
      }),
    ).toThrow();
    expect(
      createReturnPolicyArgumentsSchema.parse({
        marketplaceId: 'EBAY_DE',
        name: 'DE returns',
        returnInstructions: longReturnInstructions,
        returnsAccepted: false,
      }),
    ).toEqual({
      marketplaceId: 'EBAY_DE',
      name: 'DE returns',
      returnInstructions: longReturnInstructions,
      returnsAccepted: false,
    });
  });

  it('requires the exact returnPolicyId and a complete direct replacement', () => {
    const returnPolicyReplacement = {
      returnPolicyId: 'RETURN-1',
      ...returnPolicyCreation,
      name: 'Updated flexible returns',
    };

    expect(updateReturnPolicyArgumentsSchema.parse(returnPolicyReplacement)).toEqual(
      returnPolicyReplacement,
    );
    expect(() =>
      updateReturnPolicyArgumentsSchema.parse({
        returnPolicyId: 'RETURN-1',
        policy: returnPolicyCreation,
      }),
    ).toThrow();
    expect(() =>
      updateReturnPolicyArgumentsSchema.parse({
        ...returnPolicyReplacement,
        returnShippingCostPayer: undefined,
      }),
    ).toThrow();
    expect(getReturnPolicyArgumentsSchema.parse({ returnPolicyId: 'RETURN-1' })).toEqual({
      returnPolicyId: 'RETURN-1',
    });
    expect(deleteReturnPolicyArgumentsSchema.parse({ returnPolicyId: 'RETURN-1' })).toEqual({
      returnPolicyId: 'RETURN-1',
    });
    expect(() => getReturnPolicyArgumentsSchema.parse({ return_policy_id: 'RETURN-1' })).toThrow();
  });
});

describe('Sell Account return-policy operations', () => {
  it('sends exact collection query and localization fields', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getReturnPolicies(sellerSession, {
      'Content-Language': 'fr-CA',
      marketplace_id: 'EBAY_CA',
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/return_policy',
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

    await createReturnPolicy(sellerSession, returnPolicyCreation);

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/account/v1/return_policy',
        requestDocument: returnPolicyCreation,
      },
    ]);
  });

  it('encodes ID paths and policy-name query fields', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getReturnPolicy(sellerSession, { returnPolicyId: 'RETURN/1' });
    await getReturnPolicyByName(sellerSession, {
      marketplace_id: 'EBAY_US',
      name: 'Flexible returns',
    });

    expect(getCalls).toEqual([
      { endpoint: '/sell/account/v1/return_policy/RETURN%2F1' },
      {
        endpoint: '/sell/account/v1/return_policy/get_by_policy_name',
        requestHeaders: undefined,
        searchParameters: { marketplace_id: 'EBAY_US', name: 'Flexible returns' },
      },
    ]);
  });

  it('keeps the path ID out of the replacement document', async () => {
    const { sellerSession, putCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const returnPolicyReplacement = {
      returnPolicyId: 'RETURN/1',
      ...returnPolicyCreation,
      name: 'Updated flexible returns',
    };

    await updateReturnPolicy(sellerSession, returnPolicyReplacement);

    const { returnPolicyId: replacedPolicyId, ...replacementDocument } = returnPolicyReplacement;
    expect(replacedPolicyId).toBe('RETURN/1');
    expect(putCalls).toEqual([
      {
        endpoint: '/sell/account/v1/return_policy/RETURN%2F1',
        requestDocument: replacementDocument,
      },
    ]);
  });

  it('deletes the encoded policy path', async () => {
    const { sellerSession, deleteCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await deleteReturnPolicy(sellerSession, { returnPolicyId: 'RETURN/1' });

    expect(deleteCalls).toEqual([{ endpoint: '/sell/account/v1/return_policy/RETURN%2F1' }]);
  });
});
