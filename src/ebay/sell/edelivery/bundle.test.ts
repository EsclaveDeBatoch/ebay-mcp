import { describe, expect, it } from 'vitest';

import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import {
  bundleIdArgumentsSchema,
  cancelBundle,
  createBundle,
  createBundleArgumentsSchema,
  getBundle,
  getBundleLabel,
} from './bundle.js';

describe('Sell eDelivery bundle arguments', () => {
  it('accepts the direct generated bundle document and exact path field', () => {
    const bundleSubmission = {
      bundle: { consignPreferenceId: 'CONSIGN123', trackingNumbers: ['T1', 'T2'] },
    };
    const bundleLookup = { bundle_id: 'BUNDLE123' };

    expect(createBundleArgumentsSchema.parse(bundleSubmission)).toEqual(bundleSubmission);
    expect(bundleIdArgumentsSchema.parse(bundleLookup)).toEqual(bundleLookup);
  });

  it.each([
    { body: { bundle: { consignPreferenceId: 'C1', trackingNumbers: ['T1'] } } },
    { bundle: { consignPreferenceId: 'C1', trackingNumbers: [] } },
    { bundleId: 'BUNDLE123' },
  ])('rejects wrappers, empty bundles, and renamed path fields', (invalidBundleArguments) => {
    const acceptedAsSubmission = createBundleArgumentsSchema.safeParse(invalidBundleArguments);
    const acceptedAsLookup = bundleIdArgumentsSchema.safeParse(invalidBundleArguments);
    expect(acceptedAsSubmission.success).toBe(false);
    expect(acceptedAsLookup.success).toBe(false);
  });
});

describe('Sell eDelivery bundle operations', () => {
  it('posts direct documents and encodes bundle identifiers on every resource path', async () => {
    const bundleSubmission = {
      bundle: { consignPreferenceId: 'CONSIGN123', trackingNumbers: ['T1'] },
    };
    const bundleLookup = { bundle_id: 'BUNDLE/123' };
    const { sellerSession, getCalls, postCalls } = sellerSessionReturning({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await createBundle(sellerSession, bundleSubmission);
    await getBundle(sellerSession, bundleLookup);
    await cancelBundle(sellerSession, bundleLookup);
    await getBundleLabel(sellerSession, bundleLookup);

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/edelivery_international_shipping/v1/bundle',
        requestDocument: bundleSubmission,
      },
      {
        endpoint: '/sell/edelivery_international_shipping/v1/bundle/BUNDLE%2F123/cancel',
      },
    ]);
    expect(getCalls).toEqual([
      { endpoint: '/sell/edelivery_international_shipping/v1/bundle/BUNDLE%2F123' },
      { endpoint: '/sell/edelivery_international_shipping/v1/bundle/BUNDLE%2F123/label' },
    ]);
  });
});
