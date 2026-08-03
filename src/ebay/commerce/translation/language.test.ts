import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import {
  listingTranslationDocument,
  translateListingTitleArguments,
} from '@tests/fixtures/listingTranslation.js';

import {
  type ListingTranslation,
  translateListingText,
  translateListingTextArgumentsSchema,
} from './language.js';

describe('Commerce Translation listing text arguments', () => {
  it('accepts one supported listing-title translation', () => {
    expect(translateListingTextArgumentsSchema.parse(translateListingTitleArguments)).toEqual(
      translateListingTitleArguments,
    );
  });

  it.each([
    { ...translateListingTitleArguments, from: 'nl' },
    { ...translateListingTitleArguments, to: 'pl' },
    { ...translateListingTitleArguments, to: 'en' },
    { ...translateListingTitleArguments, translationContext: 'PRODUCT_TITLE' },
    { ...translateListingTitleArguments, text: [] },
    { ...translateListingTitleArguments, text: ['First title', 'Second title'] },
    { ...translateListingTitleArguments, text: [''] },
    { ...translateListingTitleArguments, targetMarketplace: 'EBAY_ES' },
    {
      to: translateListingTitleArguments.to,
      text: translateListingTitleArguments.text,
      translationContext: translateListingTitleArguments.translationContext,
    },
  ])('rejects an unsupported, incomplete, or unknown translation field', (invalidTranslation) => {
    expect(translateListingTextArgumentsSchema.safeParse(invalidTranslation).success).toBe(false);
  });
});

describe('Commerce Translation listing text operation', () => {
  it('posts the exact generated request document to the official endpoint', async () => {
    const successfulTranslation: EbayRequestCompletion<ListingTranslation> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: listingTranslationDocument,
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulTranslation);

    const translationCompletion = await translateListingText(
      sellerSession,
      translateListingTitleArguments,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/commerce/translation/v1_beta/translate',
        requestDocument: translateListingTitleArguments,
      },
    ]);
    expect(translationCompletion).toBe(successfulTranslation);
  });

  it.each(ebayFailures)('passes the $kind completion through unchanged', async (ebayFailure) => {
    const failedTranslation: EbayRequestCompletion<ListingTranslation> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedTranslation);

    await expect(translateListingText(sellerSession, translateListingTitleArguments)).resolves.toBe(
      failedTranslation,
    );
  });
});
