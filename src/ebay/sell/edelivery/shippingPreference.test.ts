import { describe, expect, it } from 'vitest';

import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import {
  createAddressPreference,
  createAddressPreferenceArgumentsSchema,
  createConsignPreference,
  createConsignPreferenceArgumentsSchema,
  getAddressPreferences,
  getConsignPreferences,
} from './shippingPreference.js';

describe('Sell eDelivery shipping-preference arguments', () => {
  it('accepts direct generated address and consign documents', () => {
    const addressPreference = {
      shipFromAddress: { countryCode: 'CN' as const, type: 'SHIP_FROM_ADDRESS' as const },
    };
    const consignPreference = {
      consignAddress: { dropoffSiteId: 'SITE123', type: 'DROP_OFF' as const },
    };

    expect(createAddressPreferenceArgumentsSchema.parse(addressPreference)).toEqual(
      addressPreference,
    );
    expect(createConsignPreferenceArgumentsSchema.parse(consignPreference)).toEqual(
      consignPreference,
    );
  });

  it.each([
    { body: { shipFromAddress: { countryCode: 'CN' } } },
    { shipFromAddress: { countryCode: 'US' } },
    { consignAddress: { type: 'DROP_OFF' } },
    { consignAddress: { pickupTime: '09:00', type: 'PICK_UP' } },
    { consignAddress: { pickupAddress: {}, type: 'PICK_UP' } },
  ])('rejects wrappers and incomplete conditional preferences', (invalidPreference) => {
    const acceptedAsAddress = createAddressPreferenceArgumentsSchema.safeParse(invalidPreference);
    const acceptedAsConsign = createConsignPreferenceArgumentsSchema.safeParse(invalidPreference);
    expect(acceptedAsAddress.success).toBe(false);
    expect(acceptedAsConsign.success).toBe(false);
  });
});

describe('Sell eDelivery shipping-preference operations', () => {
  it('uses the two official preference resources without reshaping documents', async () => {
    const addressPreference = { shipFromAddress: { countryCode: 'CN' as const } };
    const consignPreference = { consignAddress: { type: 'RDC' as const } };
    const { sellerSession, getCalls, postCalls } = sellerSessionReturning({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getAddressPreferences(sellerSession);
    await createAddressPreference(sellerSession, addressPreference);
    await getConsignPreferences(sellerSession);
    await createConsignPreference(sellerSession, consignPreference);

    expect(getCalls).toEqual([
      { endpoint: '/sell/edelivery_international_shipping/v1/address_preference' },
      { endpoint: '/sell/edelivery_international_shipping/v1/consign_preference' },
    ]);
    expect(postCalls).toEqual([
      {
        endpoint: '/sell/edelivery_international_shipping/v1/address_preference',
        requestDocument: addressPreference,
      },
      {
        endpoint: '/sell/edelivery_international_shipping/v1/consign_preference',
        requestDocument: consignPreference,
      },
    ]);
  });
});
