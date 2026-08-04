import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import {
  createItemPromotion,
  createItemPromotionArgumentsSchema,
  deleteItemPromotion,
  getItemPromotion,
  type ItemPromotionResponse,
  type ItemPromotionWriteCompletion,
  promotionIdArgumentsSchema,
  updateItemPromotion,
  updateItemPromotionArgumentsSchema,
} from './itemPromotion.js';

const promotionCreation = {
  description: 'Buy more, save more',
  discountRules: [
    {
      discountBenefit: { percentageOffOrder: '10' },
      discountSpecification: { minQuantity: 2 },
      ruleOrder: 1,
    },
  ],
  endDate: '2026-08-20T00:00:00Z',
  inventoryCriterion: {
    inventoryCriterionType: 'INVENTORY_BY_VALUE',
    listingIds: ['110000000000'],
  },
  marketplaceId: 'EBAY_US',
  name: 'Order discount',
  promotionImageUrl: 'https://i.ebayimg.com/images/g/order-discount.jpg',
  promotionStatus: 'SCHEDULED',
  promotionType: 'ORDER_DISCOUNT',
  startDate: '2026-08-10T00:00:00Z',
};

const promotionDocument: ItemPromotionResponse = {
  ...promotionCreation,
  promotionId: 'PROMO-1',
};

describe('Sell Marketing item-promotion schemas', () => {
  it('accepts a direct item-promotion document and the exact promotion_id path', () => {
    expect(createItemPromotionArgumentsSchema.parse(promotionCreation)).toEqual(promotionCreation);
    expect(promotionIdArgumentsSchema.parse({ promotion_id: 'PROMO-1' })).toEqual({
      promotion_id: 'PROMO-1',
    });
    expect(
      updateItemPromotionArgumentsSchema.parse({
        promotion_id: 'PROMO-1',
        ...promotionCreation,
        name: 'Updated order discount',
      }),
    ).toEqual({
      promotion_id: 'PROMO-1',
      ...promotionCreation,
      name: 'Updated order discount',
    });
  });

  it.each([
    { promotionId: 'PROMO-1' },
    { promotion_id: '' },
    { body: promotionCreation },
    { request: promotionCreation },
    { ...promotionCreation, 'Content-Type': 'application/json' },
  ])('rejects aliases, wrappers, transport headers, and invalid fields', (invalidArguments) => {
    expect(createItemPromotionArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
    expect(promotionIdArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
    expect(updateItemPromotionArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
  });
});

describe('Sell Marketing item-promotion operations', () => {
  it('posts the direct item-promotion document without a request wrapper', async () => {
    const successfulCreate: EbayRequestCompletion<ItemPromotionWriteCompletion> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: { warnings: [] },
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulCreate);

    const createCompletion = await createItemPromotion(sellerSession, promotionCreation);

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/item_promotion',
        requestDocument: promotionCreation,
      },
    ]);
    expect(createCompletion).toBe(successfulCreate);
  });

  it('encodes the promotion_id path for get, update, and delete', async () => {
    const successfulLookup: EbayRequestCompletion<ItemPromotionResponse> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: promotionDocument,
    };
    const { sellerSession, getCalls, putCalls, deleteCalls } =
      sellerSessionReturning(successfulLookup);

    await getItemPromotion(sellerSession, { promotion_id: 'PROMO/1' });
    await updateItemPromotion(sellerSession, {
      promotion_id: 'PROMO/1',
      ...promotionCreation,
      name: 'Updated order discount',
    });
    await deleteItemPromotion(sellerSession, { promotion_id: 'PROMO/1' });

    expect(getCalls).toEqual([{ endpoint: '/sell/marketing/v1/item_promotion/PROMO%2F1' }]);
    expect(putCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/item_promotion/PROMO%2F1',
        requestDocument: {
          ...promotionCreation,
          name: 'Updated order discount',
        },
      },
    ]);
    expect(deleteCalls).toEqual([{ endpoint: '/sell/marketing/v1/item_promotion/PROMO%2F1' }]);
  });

  it.each(ebayFailures)('passes a $kind failure through unchanged', async (ebayFailure) => {
    const failedLookup: EbayRequestCompletion<ItemPromotionResponse> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedLookup);

    await expect(getItemPromotion(sellerSession, { promotion_id: 'PROMO-1' })).resolves.toBe(
      failedLookup,
    );
  });
});
