import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/marketing-and-promotions/sellMarketingV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const promotionIdSchema = z.string().min(1);
const marketplaceIdSchema = z.string().min(1);

const monetaryAmountSchema = z
  .object({
    currency: z.string().regex(/^[A-Z]{3}$/, 'currency must be an uppercase ISO 4217 code'),
    value: z.string().regex(/^\d+(?:\.\d+)?$/, 'value must be a non-negative decimal amount'),
  })
  .strict();

const inventoryItemSchema = z
  .object({
    inventoryReferenceId: z.string().min(1).max(50),
  })
  .strict();

const selectionRuleSchema = z
  .object({
    brands: z.array(z.string().min(1)).min(1).optional(),
    categoryIds: z.array(z.string().min(1)).min(1).optional(),
    categoryScope: z.string().min(1).optional(),
    listingConditionIds: z.array(z.string().min(1)).min(1).optional(),
    maxPrice: monetaryAmountSchema.optional(),
    minPrice: monetaryAmountSchema.optional(),
  })
  .strict();

const ruleCriteriaSchema = z
  .object({
    excludeInventoryItems: z.array(inventoryItemSchema).min(1).optional(),
    excludeListingIds: z.array(z.string().min(1)).min(1).optional(),
    markupInventoryItems: z.array(inventoryItemSchema).min(1).optional(),
    markupListingIds: z.array(z.string().min(1)).min(1).optional(),
    selectionRules: z.array(selectionRuleSchema).min(1).optional(),
  })
  .strict();

const inventoryCriterionSchema = z
  .object({
    inventoryCriterionType: z.string().min(1).optional(),
    inventoryItems: z.array(inventoryItemSchema).min(1).max(2000).optional(),
    listingIds: z.array(z.string().min(1)).min(1).max(2000).optional(),
    ruleCriteria: ruleCriteriaSchema.optional(),
  })
  .strict();

const discountBenefitSchema = z
  .object({
    amountOffItem: monetaryAmountSchema.optional(),
    amountOffOrder: monetaryAmountSchema.optional(),
    percentageOffItem: z.string().min(1).optional(),
    percentageOffOrder: z.string().min(1).optional(),
  })
  .strict();

const discountSpecificationSchema = z
  .object({
    forEachAmount: monetaryAmountSchema.optional(),
    forEachQuantity: z.number().int().positive().optional(),
    minAmount: monetaryAmountSchema.optional(),
    minQuantity: z.number().int().positive().optional(),
    numberOfDiscountedItems: z.number().int().positive().optional(),
  })
  .strict();

const discountRuleSchema = z
  .object({
    discountBenefit: discountBenefitSchema.optional(),
    discountSpecification: discountSpecificationSchema.optional(),
    maxDiscountAmount: monetaryAmountSchema.optional(),
    ruleOrder: z.number().int().optional(),
  })
  .strict();

const couponConfigurationSchema = z
  .object({
    couponCode: z.string().min(8).max(15).optional(),
    couponType: z.string().min(1).optional(),
    maxCouponRedemptionPerUser: z.number().int().min(1).max(10).optional(),
  })
  .strict();

const itemPromotionDocumentSchema = z
  .object({
    applyDiscountToSingleItemOnly: z.boolean().optional(),
    budget: monetaryAmountSchema.optional(),
    couponConfiguration: couponConfigurationSchema.optional(),
    description: z.string().min(1).optional(),
    discountRules: z.array(discountRuleSchema).min(1).optional(),
    endDate: z.string().min(1).optional(),
    inventoryCriterion: inventoryCriterionSchema.optional(),
    marketplaceId: marketplaceIdSchema.optional(),
    name: z.string().min(1).optional(),
    priority: z.string().min(1).optional(),
    promotionImageUrl: z.string().min(1).optional(),
    promotionStatus: z.string().min(1).optional(),
    promotionType: z.string().min(1).optional(),
    startDate: z.string().min(1).optional(),
  })
  .strict();

/** Direct eBay ItemPromotion document accepted by createItemPromotion. */
export const createItemPromotionArgumentsSchema = itemPromotionDocumentSchema;

/** Exact eBay path accepted by getItemPromotion and deleteItemPromotion. */
export const promotionIdArgumentsSchema = z
  .object({
    promotion_id: promotionIdSchema,
  })
  .strict();

/** Exact eBay path and direct ItemPromotion document for updateItemPromotion. */
export const updateItemPromotionArgumentsSchema = itemPromotionDocumentSchema
  .extend({
    promotion_id: promotionIdSchema,
  })
  .strict();

/** Validated direct create document for createItemPromotion. */
export type CreateItemPromotionArguments = z.infer<typeof createItemPromotionArgumentsSchema>;

/** Validated exact promotion path. */
export type PromotionIdArguments = z.infer<typeof promotionIdArgumentsSchema>;

/** Validated path and direct replacement document for updateItemPromotion. */
export type UpdateItemPromotionArguments = z.infer<typeof updateItemPromotionArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/sme:ItemPromotionResponse */
export type ItemPromotionResponse = components['schemas']['ItemPromotionResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/sme:BaseResponse */
export type ItemPromotionWriteCompletion = components['schemas']['BaseResponse'];

const itemPromotionEndpoint = (promotionId: string): string =>
  `/sell/marketing/v1/item_promotion/${encodeURIComponent(promotionId)}`;

/**
 * Creates one threshold item discount.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param promotionCreation - Direct eBay ItemPromotion document.
 * @returns Explicit completion containing eBay's unchanged BaseResponse document.
 * @example `await createItemPromotion(sellerSession, { name: 'Buy more save more', marketplaceId: 'EBAY_US', promotionType: 'ORDER_DISCOUNT', promotionStatus: 'SCHEDULED' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/item_promotion/methods/createItemPromotion
 */
export const createItemPromotion = (
  sellerSession: EbaySellerSession,
  promotionCreation: CreateItemPromotionArguments,
): Promise<EbayRequestCompletion<ItemPromotionWriteCompletion>> =>
  sellerSession.post<ItemPromotionWriteCompletion>({
    endpoint: '/sell/marketing/v1/item_promotion',
    requestDocument: promotionCreation,
  });

/**
 * Retrieves one threshold item discount by promotion identifier.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param promotionSelection - Exact eBay promotion_id path.
 * @returns Explicit completion containing eBay's unchanged item-promotion response.
 * @example `await getItemPromotion(sellerSession, { promotion_id: 'PROMO-1' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/item_promotion/methods/getItemPromotion
 */
export const getItemPromotion = (
  sellerSession: EbaySellerSession,
  promotionSelection: PromotionIdArguments,
): Promise<EbayRequestCompletion<ItemPromotionResponse>> =>
  sellerSession.get<ItemPromotionResponse>({
    endpoint: itemPromotionEndpoint(promotionSelection.promotion_id),
  });

/**
 * Fully replaces one threshold item discount.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param promotionReplacement - Exact promotion_id path and direct ItemPromotion fields.
 * @returns Explicit completion containing eBay's unchanged BaseResponse or no content.
 * @example `await updateItemPromotion(sellerSession, { promotion_id: 'PROMO-1', name: 'Updated order discount', promotionStatus: 'SCHEDULED' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/item_promotion/methods/updateItemPromotion
 */
export const updateItemPromotion = (
  sellerSession: EbaySellerSession,
  promotionReplacement: UpdateItemPromotionArguments,
): Promise<EbayRequestCompletion<ItemPromotionWriteCompletion | undefined>> => {
  const { promotion_id: promotionId, ...promotionDocument } = promotionReplacement;
  return sellerSession.put<ItemPromotionWriteCompletion | undefined>({
    endpoint: itemPromotionEndpoint(promotionId),
    requestDocument: promotionDocument,
  });
};

/**
 * Deletes one threshold item discount.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param promotionSelection - Exact eBay promotion_id path.
 * @returns Explicit completion after eBay deletes the item promotion.
 * @example `await deleteItemPromotion(sellerSession, { promotion_id: 'PROMO-1' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/item_promotion/methods/deleteItemPromotion
 */
export const deleteItemPromotion = (
  sellerSession: EbaySellerSession,
  promotionSelection: PromotionIdArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.delete<undefined>({
    endpoint: itemPromotionEndpoint(promotionSelection.promotion_id),
  });

/** MCP definition for Sell Marketing createItemPromotion. */
export const createItemPromotionTool = defineTool({
  name: 'ebay_sell_marketing_create_item_promotion',
  namespace: 'sell.marketing',
  description: 'Create one threshold item discount using the direct eBay document',
  argumentsSchema: createItemPromotionArgumentsSchema,
  operationKind: 'write',
  operation: createItemPromotion,
});

/** MCP definition for Sell Marketing getItemPromotion. */
export const getItemPromotionTool = defineTool({
  name: 'ebay_sell_marketing_get_item_promotion',
  namespace: 'sell.marketing',
  description: 'Retrieve one threshold item discount by its exact eBay promotion_id',
  argumentsSchema: promotionIdArgumentsSchema,
  operationKind: 'read',
  operation: getItemPromotion,
});

/** MCP definition for Sell Marketing updateItemPromotion. */
export const updateItemPromotionTool = defineTool({
  name: 'ebay_sell_marketing_update_item_promotion',
  namespace: 'sell.marketing',
  description: 'Replace one threshold item discount using the complete direct eBay document',
  argumentsSchema: updateItemPromotionArgumentsSchema,
  operationKind: 'write',
  operation: updateItemPromotion,
});

/** MCP definition for Sell Marketing deleteItemPromotion. */
export const deleteItemPromotionTool = defineTool({
  name: 'ebay_sell_marketing_delete_item_promotion',
  namespace: 'sell.marketing',
  description: 'Delete one threshold item discount by its exact eBay promotion_id',
  argumentsSchema: promotionIdArgumentsSchema,
  operationKind: 'write',
  operation: deleteItemPromotion,
});
