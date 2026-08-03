import { describe, expect, it } from 'vitest';

import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import {
  getAgents,
  getBatteryQualifications,
  getDropoffSites,
  getServices,
  shippingOptionArgumentsSchema,
} from './shippingOption.js';

describe('Sell eDelivery shipping-option arguments', () => {
  it('accepts exact string pagination and rejects renamed or numeric values', () => {
    const pageSelection = { limit: '200', offset: '0' };

    expect(shippingOptionArgumentsSchema.parse(pageSelection)).toEqual(pageSelection);
    expect(shippingOptionArgumentsSchema.safeParse({ limit: 200 }).success).toBe(false);
    expect(shippingOptionArgumentsSchema.safeParse({ page: '2' }).success).toBe(false);
    expect(shippingOptionArgumentsSchema.safeParse({ limit: '201' }).success).toBe(false);
  });
});

describe('Sell eDelivery shipping-option operations', () => {
  it('uses every official option resource and forwards wire pagination unchanged', async () => {
    const pageSelection = { limit: '25', offset: '50' };
    const { sellerSession, getCalls } = sellerSessionReturning({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getAgents(sellerSession, pageSelection);
    await getBatteryQualifications(sellerSession, pageSelection);
    await getDropoffSites(sellerSession, pageSelection);
    await getServices(sellerSession, pageSelection);

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/edelivery_international_shipping/v1/agents',
        searchParameters: pageSelection,
      },
      {
        endpoint: '/sell/edelivery_international_shipping/v1/battery_qualifications',
        searchParameters: pageSelection,
      },
      {
        endpoint: '/sell/edelivery_international_shipping/v1/dropoff_sites',
        searchParameters: pageSelection,
      },
      {
        endpoint: '/sell/edelivery_international_shipping/v1/services',
        searchParameters: pageSelection,
      },
    ]);
  });
});
