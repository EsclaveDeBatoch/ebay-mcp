import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbayRequestHeaders, EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/account-management/sellAccountV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const marketplaceIdSchema = z.string().min(1);
const contentLanguageSchema = z.string().min(1);

const monetaryAmountSchema = z
  .object({
    currency: z.string().regex(/^[A-Z]{3}$/, 'currency must be an uppercase ISO 4217 code'),
    value: z.string().regex(/^\d+(?:\.\d+)?$/, 'value must be a non-negative decimal amount'),
  })
  .strict();

const timeDurationSchema = z
  .object({
    unit: z.enum([
      'YEAR',
      'MONTH',
      'DAY',
      'HOUR',
      'CALENDAR_DAY',
      'BUSINESS_DAY',
      'MINUTE',
      'SECOND',
      'MILLISECOND',
    ]),
    value: z.number().int().nonnegative(),
  })
  .strict();

const categoryTypeSchema = z
  .object({
    name: z.enum(['ALL_EXCLUDING_MOTORS_VEHICLES', 'MOTORS_VEHICLES']),
  })
  .strict();

const shippingRegionSchema = z
  .object({
    regionName: z.string().min(1),
    regionType: z.enum([
      'COUNTRY',
      'COUNTRY_REGION',
      'STATE_OR_PROVINCE',
      'WORLD_REGION',
      'WORLDWIDE',
    ]),
  })
  .strict();

const shippingRegionSetSchema = z
  .object({
    regionExcluded: z.array(shippingRegionSchema).min(1).optional(),
    regionIncluded: z.array(shippingRegionSchema).min(1).optional(),
  })
  .strict();

const shippingServiceSchema = z
  .object({
    additionalShippingCost: monetaryAmountSchema.optional(),
    buyerResponsibleForPickup: z.boolean().optional(),
    buyerResponsibleForShipping: z.boolean().optional(),
    freeShipping: z.boolean().optional(),
    shippingCarrierCode: z.string().min(1).optional(),
    shippingCost: monetaryAmountSchema.optional(),
    shippingServiceCode: z.string().min(1),
    shipToLocations: shippingRegionSetSchema.optional(),
    sortOrder: z.number().int().min(1).max(5).optional(),
  })
  .strict();

const shippingOptionSchema = z
  .object({
    costType: z.enum(['FLAT_RATE', 'CALCULATED', 'NOT_SPECIFIED']),
    optionType: z.enum(['DOMESTIC', 'INTERNATIONAL']),
    packageHandlingCost: monetaryAmountSchema.optional(),
    rateTableId: z.string().min(1).optional(),
    shippingDiscountProfileId: z.string().min(1).optional(),
    shippingPromotionOffered: z.boolean().optional(),
    shippingServices: z.array(shippingServiceSchema).min(1).max(5),
  })
  .strict();

const fulfillmentPolicyDocumentSchema = z
  .object({
    categoryTypes: z.array(categoryTypeSchema).min(1).max(2).optional(),
    description: z.string().max(250).optional(),
    freightShipping: z.boolean().optional(),
    globalShipping: z.boolean().optional(),
    handlingTime: timeDurationSchema.optional(),
    localPickup: z.boolean().optional(),
    marketplaceId: marketplaceIdSchema,
    name: z.string().min(1).max(64),
    pickupDropOff: z.boolean().optional(),
    shippingOptions: z.array(shippingOptionSchema).min(1).max(2).optional(),
    shipToLocations: shippingRegionSetSchema.optional(),
  })
  .strict();

function contentLanguageHeadersFor(localizedSelection: {
  'Content-Language'?: string;
}): EbayRequestHeaders | undefined {
  const contentLanguage = localizedSelection['Content-Language'];
  if (contentLanguage === undefined) {
    return;
  }
  return { 'Content-Language': contentLanguage };
}

/** Exact eBay query and localization header accepted by getFulfillmentPolicies. */
export const getFulfillmentPoliciesArgumentsSchema = z
  .object({
    'Content-Language': contentLanguageSchema.optional(),
    marketplace_id: marketplaceIdSchema,
  })
  .strict();

/** Direct eBay document accepted by createFulfillmentPolicy. */
export const createFulfillmentPolicyArgumentsSchema = fulfillmentPolicyDocumentSchema;

/** Exact eBay path accepted by getFulfillmentPolicy. */
export const getFulfillmentPolicyArgumentsSchema = z
  .object({ fulfillmentPolicyId: z.string().min(1) })
  .strict();

/** Exact eBay query and localization header accepted by getFulfillmentPolicyByName. */
export const getFulfillmentPolicyByNameArgumentsSchema = z
  .object({
    'Content-Language': contentLanguageSchema.optional(),
    marketplace_id: marketplaceIdSchema,
    name: z.string().min(1).max(64),
  })
  .strict();

/** Exact eBay path and complete direct document accepted by updateFulfillmentPolicy. */
export const updateFulfillmentPolicyArgumentsSchema = fulfillmentPolicyDocumentSchema
  .extend({ fulfillmentPolicyId: z.string().min(1) })
  .strict();

/** Exact eBay path accepted by deleteFulfillmentPolicy. */
export const deleteFulfillmentPolicyArgumentsSchema = z
  .object({ fulfillmentPolicyId: z.string().min(1) })
  .strict();

/** Validated eBay marketplace selection for fulfillment-policy collection reads. */
export type GetFulfillmentPoliciesArguments = z.infer<typeof getFulfillmentPoliciesArgumentsSchema>;

/** Validated direct eBay fulfillment-policy creation document. */
export type CreateFulfillmentPolicyArguments = z.infer<
  typeof createFulfillmentPolicyArgumentsSchema
>;

/** Validated eBay fulfillment-policy path. */
export type GetFulfillmentPolicyArguments = z.infer<typeof getFulfillmentPolicyArgumentsSchema>;

/** Validated eBay marketplace and policy-name selection. */
export type GetFulfillmentPolicyByNameArguments = z.infer<
  typeof getFulfillmentPolicyByNameArgumentsSchema
>;

/** Validated eBay fulfillment-policy path and complete replacement document. */
export type UpdateFulfillmentPolicyArguments = z.infer<
  typeof updateFulfillmentPolicyArgumentsSchema
>;

/** Validated eBay fulfillment-policy deletion path. */
export type DeleteFulfillmentPolicyArguments = z.infer<
  typeof deleteFulfillmentPolicyArgumentsSchema
>;

/** @see https://developer.ebay.com/api-docs/sell/account/types/api:FulfillmentPolicyResponse */
export type FulfillmentPolicyCollection = components['schemas']['FulfillmentPolicyResponse'];

/** @see https://developer.ebay.com/api-docs/sell/account/types/api:FulfillmentPolicy */
export type FulfillmentPolicy = components['schemas']['FulfillmentPolicy'];

/** @see https://developer.ebay.com/api-docs/sell/account/types/api:SetFulfillmentPolicyResponse */
export type SetFulfillmentPolicy = components['schemas']['SetFulfillmentPolicyResponse'];

/**
 * Retrieves seller fulfillment policies for one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param marketplaceSelection - Exact eBay marketplace query and optional localization header.
 * @returns Explicit completion containing eBay's unchanged generated policy collection.
 * @example `await getFulfillmentPolicies(sellerSession, { marketplace_id: 'EBAY_US' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/fulfillment_policy/methods/getFulfillmentPolicies
 */
export const getFulfillmentPolicies = (
  sellerSession: EbaySellerSession,
  marketplaceSelection: GetFulfillmentPoliciesArguments,
): Promise<EbayRequestCompletion<FulfillmentPolicyCollection>> => {
  const requestHeaders = contentLanguageHeadersFor(marketplaceSelection);
  return sellerSession.get<FulfillmentPolicyCollection>({
    endpoint: '/sell/account/v1/fulfillment_policy',
    requestHeaders,
    searchParameters: { marketplace_id: marketplaceSelection.marketplace_id },
  });
};

/**
 * Creates one seller fulfillment policy.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param policyCreation - Direct eBay fulfillment-policy creation document.
 * @returns Explicit completion containing eBay's unchanged generated creation detail.
 * @example `await createFulfillmentPolicy(sellerSession, { marketplaceId: 'EBAY_US', name: 'Standard shipping', localPickup: true })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/fulfillment_policy/methods/createFulfillmentPolicy
 */
export const createFulfillmentPolicy = (
  sellerSession: EbaySellerSession,
  policyCreation: CreateFulfillmentPolicyArguments,
): Promise<EbayRequestCompletion<SetFulfillmentPolicy>> =>
  sellerSession.post<SetFulfillmentPolicy>({
    endpoint: '/sell/account/v1/fulfillment_policy/',
    requestDocument: policyCreation,
  });

/**
 * Retrieves one seller fulfillment policy by ID.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param policyLookup - Exact eBay fulfillment-policy path.
 * @returns Explicit completion containing eBay's unchanged generated policy.
 * @example `await getFulfillmentPolicy(sellerSession, { fulfillmentPolicyId: 'FULFILLMENT-1' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/fulfillment_policy/methods/getFulfillmentPolicy
 */
export const getFulfillmentPolicy = (
  sellerSession: EbaySellerSession,
  policyLookup: GetFulfillmentPolicyArguments,
): Promise<EbayRequestCompletion<FulfillmentPolicy>> =>
  sellerSession.get<FulfillmentPolicy>({
    endpoint: `/sell/account/v1/fulfillment_policy/${encodeURIComponent(policyLookup.fulfillmentPolicyId)}`,
  });

/**
 * Retrieves one seller fulfillment policy by marketplace and name.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param policyNameLookup - Exact eBay marketplace, name, and optional localization header.
 * @returns Explicit completion containing eBay's unchanged generated policy.
 * @example `await getFulfillmentPolicyByName(sellerSession, { marketplace_id: 'EBAY_US', name: 'Standard shipping' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/fulfillment_policy/methods/getFulfillmentPolicyByName
 */
export const getFulfillmentPolicyByName = (
  sellerSession: EbaySellerSession,
  policyNameLookup: GetFulfillmentPolicyByNameArguments,
): Promise<EbayRequestCompletion<FulfillmentPolicy>> => {
  const requestHeaders = contentLanguageHeadersFor(policyNameLookup);
  return sellerSession.get<FulfillmentPolicy>({
    endpoint: '/sell/account/v1/fulfillment_policy/get_by_policy_name',
    requestHeaders,
    searchParameters: {
      marketplace_id: policyNameLookup.marketplace_id,
      name: policyNameLookup.name,
    },
  });
};

/**
 * Replaces one seller fulfillment policy.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param policyReplacement - Exact eBay path and complete direct replacement document.
 * @returns Explicit completion containing eBay's unchanged generated update detail.
 * @example `await updateFulfillmentPolicy(sellerSession, { fulfillmentPolicyId: 'FULFILLMENT-1', marketplaceId: 'EBAY_US', name: 'Updated shipping', localPickup: true })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/fulfillment_policy/methods/updateFulfillmentPolicy
 */
export const updateFulfillmentPolicy = (
  sellerSession: EbaySellerSession,
  policyReplacement: UpdateFulfillmentPolicyArguments,
): Promise<EbayRequestCompletion<SetFulfillmentPolicy>> => {
  const { fulfillmentPolicyId, ...replacementDocument } = policyReplacement;
  return sellerSession.put<SetFulfillmentPolicy>({
    endpoint: `/sell/account/v1/fulfillment_policy/${encodeURIComponent(fulfillmentPolicyId)}`,
    requestDocument: replacementDocument,
  });
};

/**
 * Deletes one seller fulfillment policy.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param policyDeletion - Exact eBay fulfillment-policy path.
 * @returns Explicit completion for eBay's empty success document.
 * @example `await deleteFulfillmentPolicy(sellerSession, { fulfillmentPolicyId: 'FULFILLMENT-1' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/fulfillment_policy/methods/deleteFulfillmentPolicy
 */
export const deleteFulfillmentPolicy = (
  sellerSession: EbaySellerSession,
  policyDeletion: DeleteFulfillmentPolicyArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.delete<undefined>({
    endpoint: `/sell/account/v1/fulfillment_policy/${encodeURIComponent(policyDeletion.fulfillmentPolicyId)}`,
  });

export const getFulfillmentPoliciesTool = defineTool({
  name: 'ebay_sell_account_get_fulfillment_policies',
  namespace: 'sell.account',
  description: 'Retrieve seller fulfillment policies for one eBay marketplace',
  argumentsSchema: getFulfillmentPoliciesArgumentsSchema,
  operationKind: 'read',
  operation: getFulfillmentPolicies,
});

export const createFulfillmentPolicyTool = defineTool({
  name: 'ebay_sell_account_create_fulfillment_policy',
  namespace: 'sell.account',
  description: 'Create one seller fulfillment policy using the direct eBay document',
  argumentsSchema: createFulfillmentPolicyArgumentsSchema,
  operationKind: 'write',
  operation: createFulfillmentPolicy,
});

export const getFulfillmentPolicyTool = defineTool({
  name: 'ebay_sell_account_get_fulfillment_policy',
  namespace: 'sell.account',
  description: 'Retrieve one seller fulfillment policy by its exact eBay identifier',
  argumentsSchema: getFulfillmentPolicyArgumentsSchema,
  operationKind: 'read',
  operation: getFulfillmentPolicy,
});

export const getFulfillmentPolicyByNameTool = defineTool({
  name: 'ebay_sell_account_get_fulfillment_policy_by_name',
  namespace: 'sell.account',
  description: 'Retrieve one seller fulfillment policy by marketplace and policy name',
  argumentsSchema: getFulfillmentPolicyByNameArgumentsSchema,
  operationKind: 'read',
  operation: getFulfillmentPolicyByName,
});

export const updateFulfillmentPolicyTool = defineTool({
  name: 'ebay_sell_account_update_fulfillment_policy',
  namespace: 'sell.account',
  description: 'Replace one seller fulfillment policy using the complete direct eBay document',
  argumentsSchema: updateFulfillmentPolicyArgumentsSchema,
  operationKind: 'write',
  operation: updateFulfillmentPolicy,
});

export const deleteFulfillmentPolicyTool = defineTool({
  name: 'ebay_sell_account_delete_fulfillment_policy',
  namespace: 'sell.account',
  description: 'Delete one seller fulfillment policy by its exact eBay identifier',
  argumentsSchema: deleteFulfillmentPolicyArgumentsSchema,
  operationKind: 'write',
  operation: deleteFulfillmentPolicy,
});
