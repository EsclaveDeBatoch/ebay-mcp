import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import {
  createItemPriceMarkdownPromotion,
  createItemPriceMarkdownPromotionArgumentsSchema,
  deleteItemPriceMarkdownPromotion,
  getItemPriceMarkdownPromotion,
  type ItemPriceMarkdown,
  promotionIdArgumentsSchema,
  updateItemPriceMarkdownPromotion,
  updateItemPriceMarkdownPromotionArgumentsSchema,
} from './itemPriceMarkdown.js';

const markdownCreation = {
  applyFreeShipping: true,
  description: 'Save on designer shoes',
  endDate: '2026-08-20T00:00:00Z',
  marketplaceId: 'EBAY_US',
  name: 'Weekend markdown',
  promotionImageUrl: 'https://i.ebayimg.com/images/g/markdown.jpg',
  promotionStatus: 'SCHEDULED',
  selectedInventoryDiscounts: [
    {
      discountBenefit: { percentageOffItem: '15' },
      inventoryCriterion: {
        inventoryCriterionType: 'INVENTORY_BY_VALUE',
        listingIds: ['110000000000'],
      },
    },
  ],
  startDate: '2026-08-10T00:00:00Z',
};

const markdownDocument: ItemPriceMarkdown = {
  ...markdownCreation,
  name: 'Weekend markdown',
};

describe('Sell Marketing item-price-markdown schemas', () => {
  it('accepts a direct markdown document and the exact promotion_id path', () => {
    expect(createItemPriceMarkdownPromotionArgumentsSchema.parse(markdownCreation)).toEqual(
      markdownCreation,
    );
    expect(promotionIdArgumentsSchema.parse({ promotion_id: 'PROMO-1' })).toEqual({
      promotion_id: 'PROMO-1',
    });
    expect(
      updateItemPriceMarkdownPromotionArgumentsSchema.parse({
        promotion_id: 'PROMO-1',
        ...markdownCreation,
        name: 'Updated markdown',
      }),
    ).toEqual({
      promotion_id: 'PROMO-1',
      ...markdownCreation,
      name: 'Updated markdown',
    });
  });

  it.each([
    { promotionId: 'PROMO-1' },
    { promotion_id: '' },
    {
      body: markdownCreation,
    },
    {
      ...markdownCreation,
      'Content-Type': 'application/json',
    },
    {
      promotion_id: 'PROMO-1',
      request: markdownCreation,
    },
  ])('rejects aliases, wrappers, transport headers, and invalid fields', (invalidArguments) => {
    expect(
      createItemPriceMarkdownPromotionArgumentsSchema.safeParse(invalidArguments).success,
    ).toBe(false);
    expect(promotionIdArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
    expect(
      updateItemPriceMarkdownPromotionArgumentsSchema.safeParse(invalidArguments).success,
    ).toBe(false);
  });
});

describe('Sell Marketing item-price-markdown operations', () => {
  it('posts the direct markdown document without a request wrapper', async () => {
    const successfulCreate: EbayRequestCompletion<Record<string, never>> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulCreate);

    const createCompletion = await createItemPriceMarkdownPromotion(
      sellerSession,
      markdownCreation,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/item_price_markdown',
        requestDocument: markdownCreation,
      },
    ]);
    expect(createCompletion).toBe(successfulCreate);
  });

  it('encodes the promotion_id path for get, update, and delete', async () => {
    const successfulLookup: EbayRequestCompletion<ItemPriceMarkdown> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: markdownDocument,
    };
    const { sellerSession, getCalls, putCalls, deleteCalls } =
      sellerSessionReturning(successfulLookup);

    await getItemPriceMarkdownPromotion(sellerSession, { promotion_id: 'PROMO/1' });
    await updateItemPriceMarkdownPromotion(sellerSession, {
      promotion_id: 'PROMO/1',
      ...markdownCreation,
      name: 'Updated markdown',
    });
    await deleteItemPriceMarkdownPromotion(sellerSession, { promotion_id: 'PROMO/1' });

    expect(getCalls).toEqual([{ endpoint: '/sell/marketing/v1/item_price_markdown/PROMO%2F1' }]);
    expect(putCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/item_price_markdown/PROMO%2F1',
        requestDocument: {
          ...markdownCreation,
          name: 'Updated markdown',
        },
      },
    ]);
    expect(deleteCalls).toEqual([{ endpoint: '/sell/marketing/v1/item_price_markdown/PROMO%2F1' }]);
  });

  it.each(ebayFailures)('passes a $kind failure through unchanged', async (ebayFailure) => {
    const failedLookup: EbayRequestCompletion<ItemPriceMarkdown> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedLookup);

    await expect(
      getItemPriceMarkdownPromotion(sellerSession, { promotion_id: 'PROMO-1' }),
    ).resolves.toBe(failedLookup);
  });
});
