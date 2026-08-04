import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import {
  getPromotionSummaryReport,
  getPromotionSummaryReportArgumentsSchema,
  type PromotionSummaryReport,
} from './promotionSummaryReport.js';

const marketplaceSelection = { marketplace_id: 'EBAY_US' };

describe('Sell Marketing promotion-summary-report schemas', () => {
  it('requires the exact marketplace_id query field', () => {
    expect(getPromotionSummaryReportArgumentsSchema.parse(marketplaceSelection)).toEqual(
      marketplaceSelection,
    );
  });

  it.each([{ marketplaceId: 'EBAY_US' }, { marketplace_id: '' }, {}])(
    'rejects renamed or incomplete marketplace selectors',
    (invalidArguments) => {
      expect(getPromotionSummaryReportArgumentsSchema.safeParse(invalidArguments).success).toBe(
        false,
      );
    },
  );
});

describe('Sell Marketing promotion-summary-report operations', () => {
  it('gets the summary report with the exact marketplace_id query', async () => {
    const successfulLookup: EbayRequestCompletion<PromotionSummaryReport> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: {
        baseSale: { currency: 'USD', value: '1000.00' },
        percentageSalesLift: '12.5',
        promotionSale: { currency: 'USD', value: '125.00' },
        totalSale: { currency: 'USD', value: '1125.00' },
      },
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const summaryCompletion = await getPromotionSummaryReport(sellerSession, marketplaceSelection);

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/promotion_summary_report',
        searchParameters: marketplaceSelection,
      },
    ]);
    expect(summaryCompletion).toBe(successfulLookup);
  });

  it.each(ebayFailures)('passes a $kind failure through unchanged', async (ebayFailure) => {
    const failedLookup: EbayRequestCompletion<PromotionSummaryReport> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedLookup);

    await expect(getPromotionSummaryReport(sellerSession, marketplaceSelection)).resolves.toBe(
      failedLookup,
    );
  });
});
