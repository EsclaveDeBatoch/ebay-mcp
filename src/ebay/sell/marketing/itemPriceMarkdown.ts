import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type {
  components,
  operations,
} from '@/generated/ebay/sell-apps/marketing-and-promotions/sellMarketingV1Oas3.js';
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

const selectedInventoryDiscountSchema = z
  .object({
    discountBenefit: discountBenefitSchema.optional(),
    discountId: z.string().min(1).optional(),
    inventoryCriterion: inventoryCriterionSchema.optional(),
    ruleOrder: z.number().int().optional(),
  })
  .strict();

const itemPriceMarkdownDocumentSchema = z
  .object({
    applyFreeShipping: z.boolean().optional(),
    autoSelectFutureInventory: z.boolean().optional(),
    blockPriceIncreaseInItemRevision: z.boolean().optional(),
    description: z.string().min(1).max(50).optional(),
    endDate: z.string().min(1).optional(),
    marketplaceId: marketplaceIdSchema.optional(),
    name: z.string().min(1).max(90).optional(),
    priority: z.string().min(1).optional(),
    promotionImageUrl: z.string().min(1).optional(),
    promotionStatus: z.string().min(1).optional(),
    selectedInventoryDiscounts: z.array(selectedInventoryDiscountSchema).min(1).optional(),
    startDate: z.string().min(1).optional(),
  })
  .strict();

/** Direct eBay ItemPriceMarkdown document accepted by createItemPriceMarkdownPromotion. */
export const createItemPriceMarkdownPromotionArgumentsSchema = itemPriceMarkdownDocumentSchema;

/** Exact eBay path accepted by getItemPriceMarkdownPromotion and deleteItemPriceMarkdownPromotion. */
export const promotionIdArgumentsSchema = z
  .object({
    promotion_id: promotionIdSchema,
  })
  .strict();

/** Exact eBay path and direct ItemPriceMarkdown document for updateItemPriceMarkdownPromotion. */
export const updateItemPriceMarkdownPromotionArgumentsSchema = itemPriceMarkdownDocumentSchema
  .extend({
    promotion_id: promotionIdSchema,
  })
  .strict();

/** Validated direct create document for createItemPriceMarkdownPromotion. */
export type CreateItemPriceMarkdownPromotionArguments = z.infer<
  typeof createItemPriceMarkdownPromotionArgumentsSchema
>;

/** Validated exact promotion path. */
export type PromotionIdArguments = z.infer<typeof promotionIdArgumentsSchema>;

/** Validated path and direct replacement document for updateItemPriceMarkdownPromotion. */
export type UpdateItemPriceMarkdownPromotionArguments = z.infer<
  typeof updateItemPriceMarkdownPromotionArgumentsSchema
>;

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/sme:ItemPriceMarkdown */
export type ItemPriceMarkdown = components['schemas']['ItemPriceMarkdown'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/resources/item_price_markdown/methods/createItemPriceMarkdownPromotion */
export type CreatedItemPriceMarkdownPromotion =
  operations['createItemPriceMarkdownPromotion']['responses'][201]['content']['application/json'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/resources/item_price_markdown/methods/updateItemPriceMarkdownPromotion */
export type UpdatedItemPriceMarkdownPromotion =
  | operations['updateItemPriceMarkdownPromotion']['responses'][200]['content']['application/json']
  | undefined;

const itemPriceMarkdownEndpoint = (promotionId: string): string =>
  `/sell/marketing/v1/item_price_markdown/${encodeURIComponent(promotionId)}`;

/**
 * Creates one item price markdown discount.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param markdownCreation - Direct eBay ItemPriceMarkdown document.
 * @returns Explicit completion containing eBay's empty creation document.
 * @example `await createItemPriceMarkdownPromotion(sellerSession, { name: 'Weekend markdown', marketplaceId: 'EBAY_US', promotionStatus: 'SCHEDULED' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/item_price_markdown/methods/createItemPriceMarkdownPromotion
 */
export const createItemPriceMarkdownPromotion = (
  sellerSession: EbaySellerSession,
  markdownCreation: CreateItemPriceMarkdownPromotionArguments,
): Promise<EbayRequestCompletion<CreatedItemPriceMarkdownPromotion>> =>
  sellerSession.post<CreatedItemPriceMarkdownPromotion>({
    endpoint: '/sell/marketing/v1/item_price_markdown',
    requestDocument: markdownCreation,
  });

/**
 * Retrieves one item price markdown discount by promotion identifier.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param promotionSelection - Exact eBay promotion_id path.
 * @returns Explicit completion containing eBay's unchanged markdown document.
 * @example `await getItemPriceMarkdownPromotion(sellerSession, { promotion_id: 'PROMO-1' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/item_price_markdown/methods/getItemPriceMarkdownPromotion
 */
export const getItemPriceMarkdownPromotion = (
  sellerSession: EbaySellerSession,
  promotionSelection: PromotionIdArguments,
): Promise<EbayRequestCompletion<ItemPriceMarkdown>> =>
  sellerSession.get<ItemPriceMarkdown>({
    endpoint: itemPriceMarkdownEndpoint(promotionSelection.promotion_id),
  });

/**
 * Fully replaces one item price markdown discount.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param markdownReplacement - Exact promotion_id path and direct ItemPriceMarkdown fields.
 * @returns Explicit completion containing eBay's empty success document or no content.
 * @example `await updateItemPriceMarkdownPromotion(sellerSession, { promotion_id: 'PROMO-1', name: 'Updated markdown', promotionStatus: 'SCHEDULED' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/item_price_markdown/methods/updateItemPriceMarkdownPromotion
 */
export const updateItemPriceMarkdownPromotion = (
  sellerSession: EbaySellerSession,
  markdownReplacement: UpdateItemPriceMarkdownPromotionArguments,
): Promise<EbayRequestCompletion<UpdatedItemPriceMarkdownPromotion>> => {
  const { promotion_id: promotionId, ...markdownDocument } = markdownReplacement;
  return sellerSession.put<UpdatedItemPriceMarkdownPromotion>({
    endpoint: itemPriceMarkdownEndpoint(promotionId),
    requestDocument: markdownDocument,
  });
};

/**
 * Deletes one item price markdown discount.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param promotionSelection - Exact eBay promotion_id path.
 * @returns Explicit completion after eBay deletes the markdown discount.
 * @example `await deleteItemPriceMarkdownPromotion(sellerSession, { promotion_id: 'PROMO-1' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/item_price_markdown/methods/deleteItemPriceMarkdownPromotion
 */
export const deleteItemPriceMarkdownPromotion = (
  sellerSession: EbaySellerSession,
  promotionSelection: PromotionIdArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.delete<undefined>({
    endpoint: itemPriceMarkdownEndpoint(promotionSelection.promotion_id),
  });

/** MCP definition for Sell Marketing createItemPriceMarkdownPromotion. */
export const createItemPriceMarkdownPromotionTool = defineTool({
  name: 'ebay_sell_marketing_create_item_price_markdown_promotion',
  namespace: 'sell.marketing',
  description: 'Create one item price markdown discount using the direct eBay document',
  argumentsSchema: createItemPriceMarkdownPromotionArgumentsSchema,
  operationKind: 'write',
  operation: createItemPriceMarkdownPromotion,
});

/** MCP definition for Sell Marketing getItemPriceMarkdownPromotion. */
export const getItemPriceMarkdownPromotionTool = defineTool({
  name: 'ebay_sell_marketing_get_item_price_markdown_promotion',
  namespace: 'sell.marketing',
  description: 'Retrieve one item price markdown discount by its exact eBay promotion_id',
  argumentsSchema: promotionIdArgumentsSchema,
  operationKind: 'read',
  operation: getItemPriceMarkdownPromotion,
});

/** MCP definition for Sell Marketing updateItemPriceMarkdownPromotion. */
export const updateItemPriceMarkdownPromotionTool = defineTool({
  name: 'ebay_sell_marketing_update_item_price_markdown_promotion',
  namespace: 'sell.marketing',
  description: 'Replace one item price markdown discount using the complete direct eBay document',
  argumentsSchema: updateItemPriceMarkdownPromotionArgumentsSchema,
  operationKind: 'write',
  operation: updateItemPriceMarkdownPromotion,
});

/** MCP definition for Sell Marketing deleteItemPriceMarkdownPromotion. */
export const deleteItemPriceMarkdownPromotionTool = defineTool({
  name: 'ebay_sell_marketing_delete_item_price_markdown_promotion',
  namespace: 'sell.marketing',
  description: 'Delete one item price markdown discount by its exact eBay promotion_id',
  argumentsSchema: promotionIdArgumentsSchema,
  operationKind: 'write',
  operation: deleteItemPriceMarkdownPromotion,
});
