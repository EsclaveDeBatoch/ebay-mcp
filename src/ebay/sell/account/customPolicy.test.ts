import { describe, expect, it } from 'vitest';

import {
  createCustomPolicy,
  createCustomPolicyArgumentsSchema,
  getCustomPolicies,
  getCustomPoliciesArgumentsSchema,
  getCustomPolicy,
  getCustomPolicyArgumentsSchema,
  updateCustomPolicy,
  updateCustomPolicyArgumentsSchema,
} from '@/ebay/sell/account/customPolicy.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

describe('Sell Account custom-policy schemas', () => {
  it('accepts the exact policy_types query field', () => {
    expect(
      getCustomPoliciesArgumentsSchema.parse({
        policy_types: 'PRODUCT_COMPLIANCE,TAKE_BACK',
      }),
    ).toEqual({ policy_types: 'PRODUCT_COMPLIANCE,TAKE_BACK' });
  });

  it.each([
    { policyTypes: 'TAKE_BACK' },
    { policy_types: 'UNKNOWN' },
    { policy_types: 'TAKE_BACK, PRODUCT_COMPLIANCE' },
  ])('rejects aliases and unsupported policy filters', (invalidPolicySearch) => {
    expect(() => getCustomPoliciesArgumentsSchema.parse(invalidPolicySearch)).toThrow();
  });

  it('accepts the direct create document with official limits', () => {
    const policyCreation = {
      description: 'How products are collected for recycling',
      label: 'Take-back details',
      name: 'Take-back policy',
      policyType: 'TAKE_BACK' as const,
    };

    expect(createCustomPolicyArgumentsSchema.parse(policyCreation)).toEqual(policyCreation);
    expect(() =>
      createCustomPolicyArgumentsSchema.parse({
        ...policyCreation,
        name: 'x'.repeat(66),
      }),
    ).toThrow();
  });

  it('requires the complete replacement document without policyType', () => {
    const policyReplacement = {
      custom_policy_id: 'POLICY-1',
      description: 'Updated recycling terms',
      label: 'Updated take-back details',
      name: 'Updated take-back policy',
    };

    expect(updateCustomPolicyArgumentsSchema.parse(policyReplacement)).toEqual(policyReplacement);
    expect(() =>
      updateCustomPolicyArgumentsSchema.parse({
        custom_policy_id: 'POLICY-1',
        name: 'Incomplete replacement',
      }),
    ).toThrow();
    expect(() =>
      updateCustomPolicyArgumentsSchema.parse({ ...policyReplacement, policyType: 'TAKE_BACK' }),
    ).toThrow();
  });

  it('requires the official custom_policy_id path field', () => {
    expect(getCustomPolicyArgumentsSchema.parse({ custom_policy_id: 'POLICY-1' })).toEqual({
      custom_policy_id: 'POLICY-1',
    });
    expect(() => getCustomPolicyArgumentsSchema.parse({ customPolicyId: 'POLICY-1' })).toThrow();
  });
});

describe('Sell Account custom-policy operations', () => {
  it('sends the exact collection query', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getCustomPolicies(sellerSession, { policy_types: 'TAKE_BACK' });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/custom_policy/',
        searchParameters: { policy_types: 'TAKE_BACK' },
      },
    ]);
  });

  it('encodes the custom policy path', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getCustomPolicy(sellerSession, { custom_policy_id: 'POLICY/1' });

    expect(getCalls).toEqual([{ endpoint: '/sell/account/v1/custom_policy/POLICY%2F1' }]);
  });

  it('posts the direct create document and keeps eBay empty creation document', async () => {
    const { sellerSession, postCalls } = sellerSessionReturning<Record<string, never>>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const policyCreation = {
      description: 'Take-back terms',
      label: 'Take-back details',
      name: 'Take-back policy',
      policyType: 'TAKE_BACK' as const,
    };

    await expect(createCustomPolicy(sellerSession, policyCreation)).resolves.toEqual({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    expect(postCalls).toEqual([
      { endpoint: '/sell/account/v1/custom_policy/', requestDocument: policyCreation },
    ]);
  });

  it('puts the direct complete replacement beneath custom_policy_id', async () => {
    const { sellerSession, putCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });
    const policyReplacement = {
      custom_policy_id: 'POLICY/1',
      description: 'Updated terms',
      label: 'Updated details',
      name: 'Updated policy',
    };

    await updateCustomPolicy(sellerSession, policyReplacement);

    expect(putCalls).toEqual([
      {
        endpoint: '/sell/account/v1/custom_policy/POLICY%2F1',
        requestDocument: {
          description: 'Updated terms',
          label: 'Updated details',
          name: 'Updated policy',
        },
      },
    ]);
  });
});
