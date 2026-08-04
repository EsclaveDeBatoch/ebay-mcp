import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import {
  customerServiceMetricArguments,
  customerServiceMetricDocument,
} from '@tests/fixtures/customerServiceMetric.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import {
  type CustomerServiceMetric,
  customerServiceMetricArgumentsSchema,
  getCustomerServiceMetric,
} from './customerServiceMetric.js';

describe('Sell Analytics customer service metric', () => {
  it('accepts the exact eBay path and query fields', () => {
    expect(customerServiceMetricArgumentsSchema.parse(customerServiceMetricArguments)).toEqual(
      customerServiceMetricArguments,
    );
  });

  it.each([
    { ...customerServiceMetricArguments, customer_service_metric_type: 'LATE_SHIPMENT' },
    { ...customerServiceMetricArguments, evaluation_type: 'PAST' },
    { ...customerServiceMetricArguments, evaluation_marketplace_id: '' },
    { ...customerServiceMetricArguments, marketplace_id: 'EBAY_US' },
  ])('rejects an invalid or unknown eBay field', (invalidMetricArguments) => {
    expect(customerServiceMetricArgumentsSchema.safeParse(invalidMetricArguments).success).toBe(
      false,
    );
  });

  it('calls the exact eBay endpoint and wire query', async () => {
    const successfulRequest: EbayRequestCompletion<CustomerServiceMetric> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: customerServiceMetricDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulRequest);

    const requestCompletion = await getCustomerServiceMetric(
      sellerSession,
      customerServiceMetricArguments,
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/analytics/v1/customer_service_metric/ITEM_NOT_AS_DESCRIBED/CURRENT',
        searchParameters: { evaluation_marketplace_id: 'EBAY_US' },
      },
    ]);
    expect(requestCompletion).toBe(successfulRequest);
  });

  it.each(ebayFailures)('passes the $kind completion through unchanged', async (ebayFailure) => {
    const failedRequest: EbayRequestCompletion<CustomerServiceMetric> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedRequest);

    await expect(
      getCustomerServiceMetric(sellerSession, customerServiceMetricArguments),
    ).resolves.toBe(failedRequest);
  });
});
