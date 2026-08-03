import { describe, expect, it } from 'vitest';

import {
  createPaymentPolicy,
  createPaymentPolicyArgumentsSchema,
  deletePaymentPolicy,
  deletePaymentPolicyArgumentsSchema,
  getPaymentPolicies,
  getPaymentPoliciesArgumentsSchema,
  getPaymentPolicy,
  getPaymentPolicyArgumentsSchema,
  getPaymentPolicyByName,
  getPaymentPolicyByNameArgumentsSchema,
  updatePaymentPolicy,
  updatePaymentPolicyArgumentsSchema,
} from '@/ebay/sell/account/paymentPolicy.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

const paymentPolicyCreation = {
  categoryTypes: [{ name: 'MOTORS_VEHICLES' as const }],
  deposit: {
    amount: { currency: 'USD', value: '400.00' },
    dueIn: { unit: 'HOUR' as const, value: 48 as const },
  },
  description: 'Motor vehicle payment terms',
  fullPaymentDueIn: { unit: 'DAY' as const, value: 7 as const },
  immediatePay: true,
  marketplaceId: 'EBAY_US',
  name: 'Vehicle payments',
  paymentMethods: [{ paymentMethodType: 'CASHIER_CHECK' as const }],
};

describe('Sell Account payment-policy schemas', () => {
  it('accepts exact marketplace_id and Content-Language read fields', () => {
    const marketplaceSelection = {
      'Content-Language': 'fr-CA',
      marketplace_id: 'EBAY_CA',
    };

    expect(getPaymentPoliciesArgumentsSchema.parse(marketplaceSelection)).toEqual(
      marketplaceSelection,
    );
    expect(
      getPaymentPolicyByNameArgumentsSchema.parse({
        ...marketplaceSelection,
        name: 'Paiement immédiat',
      }),
    ).toEqual({ ...marketplaceSelection, name: 'Paiement immédiat' });
  });

  it.each([
    { marketplaceId: 'EBAY_US' },
    { marketplace_id: '' },
    { marketplace_id: 'EBAY_US', contentLanguage: 'en-US' },
  ])('rejects aliases and incomplete collection selectors', (invalidMarketplaceSelection) => {
    expect(() => getPaymentPoliciesArgumentsSchema.parse(invalidMarketplaceSelection)).toThrow();
  });

  it('accepts the complete direct motor-vehicle payment document', () => {
    expect(createPaymentPolicyArgumentsSchema.parse(paymentPolicyCreation)).toEqual(
      paymentPolicyCreation,
    );
  });

  it.each([
    {
      ...paymentPolicyCreation,
      categoryTypes: [{ default: true, name: 'MOTORS_VEHICLES' }],
    },
    {
      ...paymentPolicyCreation,
      deposit: {
        ...paymentPolicyCreation.deposit,
        paymentMethods: [{ paymentMethodType: 'CASHIER_CHECK' }],
      },
    },
    {
      ...paymentPolicyCreation,
      paymentInstructions: 'Send payment within seven days',
    },
    {
      ...paymentPolicyCreation,
      paymentMethods: [{ brands: ['VISA'], paymentMethodType: 'CASHIER_CHECK' }],
    },
    {
      ...paymentPolicyCreation,
      paymentMethods: [{ paymentMethodType: 'PAYPAL' }],
    },
  ])('rejects deprecated payment-policy fields and electronic methods', (invalidPaymentPolicy) => {
    expect(() => createPaymentPolicyArgumentsSchema.parse(invalidPaymentPolicy)).toThrow();
  });

  it.each([
    {
      ...paymentPolicyCreation,
      deposit: { amount: { currency: 'USD', value: '400.00' }, dueIn: { unit: 'HOUR' } },
    },
    {
      ...paymentPolicyCreation,
      deposit: { amount: { currency: 'USD', value: '400.00' }, dueIn: { unit: 'DAY', value: 2 } },
    },
    {
      ...paymentPolicyCreation,
      deposit: { amount: { currency: 'USD', value: '400.00' }, dueIn: { unit: 'HOUR', value: 36 } },
    },
    {
      ...paymentPolicyCreation,
      fullPaymentDueIn: { unit: 'DAY', value: 5 },
    },
  ])('rejects incomplete or unsupported payment deadlines', (invalidPaymentDeadline) => {
    expect(() => createPaymentPolicyArgumentsSchema.parse(invalidPaymentDeadline)).toThrow();
  });

  it('enforces the documented vehicle deposit limits', () => {
    expect(() =>
      createPaymentPolicyArgumentsSchema.parse({
        ...paymentPolicyCreation,
        deposit: {
          ...paymentPolicyCreation.deposit,
          amount: { currency: 'USD', value: '500.01' },
        },
      }),
    ).toThrow();
    expect(() =>
      createPaymentPolicyArgumentsSchema.parse({
        ...paymentPolicyCreation,
        deposit: {
          ...paymentPolicyCreation.deposit,
          amount: { currency: 'USD', value: '2000.01' },
        },
        immediatePay: false,
      }),
    ).toThrow();
  });

  it('requires vehicle payment deadlines and an offline payment method', () => {
    const vehiclePolicyWithoutDeadline = {
      categoryTypes: [{ name: 'MOTORS_VEHICLES' }],
      marketplaceId: 'EBAY_US',
      name: 'Incomplete vehicle payments',
      paymentMethods: [{ paymentMethodType: 'CASHIER_CHECK' }],
    };
    const vehiclePolicyWithoutMethod = {
      categoryTypes: [{ name: 'MOTORS_VEHICLES' }],
      fullPaymentDueIn: { unit: 'DAY', value: 7 },
      marketplaceId: 'EBAY_US',
      name: 'Incomplete vehicle payments',
    };

    expect(() => createPaymentPolicyArgumentsSchema.parse(vehiclePolicyWithoutDeadline)).toThrow();
    expect(() => createPaymentPolicyArgumentsSchema.parse(vehiclePolicyWithoutMethod)).toThrow();
  });

  it('requires a complete direct replacement without a policy wrapper', () => {
    const paymentPolicyReplacement = {
      paymentPolicyId: 'PAYMENT-1',
      ...paymentPolicyCreation,
      name: 'Updated vehicle payments',
    };

    expect(updatePaymentPolicyArgumentsSchema.parse(paymentPolicyReplacement)).toEqual(
      paymentPolicyReplacement,
    );
    expect(() =>
      updatePaymentPolicyArgumentsSchema.parse({
        paymentPolicyId: 'PAYMENT-1',
        policy: paymentPolicyCreation,
      }),
    ).toThrow();
    expect(() =>
      updatePaymentPolicyArgumentsSchema.parse({
        marketplaceId: 'EBAY_US',
        paymentPolicyId: 'PAYMENT-1',
      }),
    ).toThrow();
  });

  it('requires the exact paymentPolicyId path field', () => {
    expect(getPaymentPolicyArgumentsSchema.parse({ paymentPolicyId: 'PAYMENT-1' })).toEqual({
      paymentPolicyId: 'PAYMENT-1',
    });
    expect(deletePaymentPolicyArgumentsSchema.parse({ paymentPolicyId: 'PAYMENT-1' })).toEqual({
      paymentPolicyId: 'PAYMENT-1',
    });
    expect(() =>
      getPaymentPolicyArgumentsSchema.parse({ payment_policy_id: 'PAYMENT-1' }),
    ).toThrow();
  });
});

describe('Sell Account payment-policy operations', () => {
  it('sends the exact collection query and optional localization header', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getPaymentPolicies(sellerSession, {
      'Content-Language': 'fr-CA',
      marketplace_id: 'EBAY_CA',
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/payment_policy',
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

    await createPaymentPolicy(sellerSession, paymentPolicyCreation);

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/account/v1/payment_policy',
        requestDocument: paymentPolicyCreation,
      },
    ]);
  });

  it('encodes one payment-policy path', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getPaymentPolicy(sellerSession, { paymentPolicyId: 'PAYMENT/1' });

    expect(getCalls).toEqual([{ endpoint: '/sell/account/v1/payment_policy/PAYMENT%2F1' }]);
  });

  it('sends exact policy-name query fields and optional localization header', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getPaymentPolicyByName(sellerSession, {
      'Content-Language': 'nl-BE',
      marketplace_id: 'EBAY_BE',
      name: 'Directe betaling',
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/payment_policy/get_by_policy_name',
        requestHeaders: { 'Content-Language': 'nl-BE' },
        searchParameters: { marketplace_id: 'EBAY_BE', name: 'Directe betaling' },
      },
    ]);
  });

  it('keeps the path ID out of the direct replacement document', async () => {
    const { sellerSession, putCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const paymentPolicyReplacement = {
      paymentPolicyId: 'PAYMENT/1',
      ...paymentPolicyCreation,
      name: 'Updated vehicle payments',
    };

    await updatePaymentPolicy(sellerSession, paymentPolicyReplacement);

    expect(putCalls).toEqual([
      {
        endpoint: '/sell/account/v1/payment_policy/PAYMENT%2F1',
        requestDocument: {
          ...paymentPolicyCreation,
          name: 'Updated vehicle payments',
        },
      },
    ]);
  });

  it('deletes one encoded payment-policy path', async () => {
    const { sellerSession, deleteCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    await deletePaymentPolicy(sellerSession, { paymentPolicyId: 'PAYMENT/1' });

    expect(deleteCalls).toEqual([{ endpoint: '/sell/account/v1/payment_policy/PAYMENT%2F1' }]);
  });
});
