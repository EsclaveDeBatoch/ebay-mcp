import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import {
  getPromotionReports,
  getPromotionReportsArgumentsSchema,
  type PromotionReportsPage,
} from './promotionReport.js';

const promotionReportsArguments = {
  limit: '25',
  marketplace_id: 'EBAY_US',
  offset: '0',
  promotion_status: 'RUNNING',
  promotion_type: 'MARKDOWN_SALE',
  q: 'weekend',
};

describe('Sell Marketing promotion-report schemas', () => {
  it('accepts exact string query filters including marketplace_id', () => {
    expect(getPromotionReportsArgumentsSchema.parse(promotionReportsArguments)).toEqual(
      promotionReportsArguments,
    );
  });

  it.each([
    { marketplaceId: 'EBAY_US' },
    { marketplace_id: '' },
    { limit: 25, marketplace_id: 'EBAY_US' },
    { marketplace_id: 'EBAY_US', promotionStatus: 'RUNNING' },
  ])('rejects renamed, numeric, or incomplete fields', (invalidArguments) => {
    expect(getPromotionReportsArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
  });
});

describe('Sell Marketing promotion-report operations', () => {
  it('gets promotion reports with exact underscore query keys', async () => {
    const successfulLookup: EbayRequestCompletion<PromotionReportsPage> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: { promotionReports: [], total: 0 },
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const reportCompletion = await getPromotionReports(sellerSession, promotionReportsArguments);

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/promotion_report',
        searchParameters: promotionReportsArguments,
      },
    ]);
    expect(reportCompletion).toBe(successfulLookup);
  });

  it.each(ebayFailures)('passes a $kind failure through unchanged', async (ebayFailure) => {
    const failedLookup: EbayRequestCompletion<PromotionReportsPage> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedLookup);

    await expect(getPromotionReports(sellerSession, { marketplace_id: 'EBAY_US' })).resolves.toBe(
      failedLookup,
    );
  });
});
