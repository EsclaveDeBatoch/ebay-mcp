import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbayRequestHeaders, EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/account-management/sellAccountV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const marketplaceIdSchema = z.string().min(1);
const contentLanguageSchema = z.string().min(1);

const categoryTypeSchema = z.object({ name: z.literal('ALL_EXCLUDING_MOTORS_VEHICLES') }).strict();

const returnPeriodSchema = z
  .object({
    unit: z.literal('DAY'),
    value: z.number().int().positive(),
  })
  .strict();

const internationalReturnOverrideSchema = z
  .object({
    returnMethod: z.literal('REPLACEMENT').optional(),
    returnPeriod: returnPeriodSchema.optional(),
    returnsAccepted: z.boolean(),
    returnShippingCostPayer: z.enum(['BUYER', 'SELLER']).optional(),
  })
  .strict()
  .superRefine((internationalTerms, validation) => {
    if (internationalTerms.returnsAccepted !== true) {
      return;
    }
    if (internationalTerms.returnPeriod === undefined) {
      validation.addIssue({
        code: 'custom',
        message: 'returnPeriod is required when international returns are accepted',
        path: ['returnPeriod'],
      });
    }
    if (internationalTerms.returnShippingCostPayer === undefined) {
      validation.addIssue({
        code: 'custom',
        message: 'returnShippingCostPayer is required when international returns are accepted',
        path: ['returnShippingCostPayer'],
      });
    }
  });

const returnPolicyDocumentSchema = z
  .object({
    categoryTypes: z.array(categoryTypeSchema).min(1).max(1).optional(),
    description: z.string().max(250).optional(),
    internationalOverride: internationalReturnOverrideSchema.optional(),
    marketplaceId: marketplaceIdSchema,
    name: z.string().min(1).max(64),
    refundMethod: z.literal('MONEY_BACK').optional(),
    returnInstructions: z.string().max(8000).optional(),
    returnMethod: z.literal('REPLACEMENT').optional(),
    returnPeriod: returnPeriodSchema.optional(),
    returnsAccepted: z.boolean(),
    returnShippingCostPayer: z.enum(['BUYER', 'SELLER']).optional(),
  })
  .strict()
  .superRefine((policyDocument, validation) => {
    if (policyDocument.returnsAccepted === true) {
      if (policyDocument.returnPeriod === undefined) {
        validation.addIssue({
          code: 'custom',
          message: 'returnPeriod is required when returns are accepted',
          path: ['returnPeriod'],
        });
      }
      if (policyDocument.returnShippingCostPayer === undefined) {
        validation.addIssue({
          code: 'custom',
          message: 'returnShippingCostPayer is required when returns are accepted',
          path: ['returnShippingCostPayer'],
        });
      }
    }
    const returnInstructions = policyDocument.returnInstructions;
    if (returnInstructions === undefined) {
      return;
    }
    if (policyDocument.marketplaceId === 'EBAY_DE') {
      return;
    }
    if (returnInstructions.length > 5000) {
      validation.addIssue({
        code: 'custom',
        message: 'returnInstructions cannot exceed 5000 characters outside EBAY_DE',
        path: ['returnInstructions'],
      });
    }
  });

function contentLanguageHeadersFor(localizedSelection: {
  'Content-Language'?: string;
}): EbayRequestHeaders | undefined {
  const contentLanguage = localizedSelection['Content-Language'];
  if (contentLanguage === undefined) {
    return;
  }
  return { 'Content-Language': contentLanguage };
}

/** Exact eBay query and localization header accepted by getReturnPolicies. */
export const getReturnPoliciesArgumentsSchema = z
  .object({
    'Content-Language': contentLanguageSchema.optional(),
    marketplace_id: marketplaceIdSchema,
  })
  .strict();

/** Direct eBay document accepted by createReturnPolicy. */
export const createReturnPolicyArgumentsSchema = returnPolicyDocumentSchema;

/** Exact eBay path accepted by getReturnPolicy. */
export const getReturnPolicyArgumentsSchema = z
  .object({ returnPolicyId: z.string().min(1) })
  .strict();

/** Exact eBay query and localization header accepted by getReturnPolicyByName. */
export const getReturnPolicyByNameArgumentsSchema = z
  .object({
    'Content-Language': contentLanguageSchema.optional(),
    marketplace_id: marketplaceIdSchema,
    name: z.string().min(1).max(64),
  })
  .strict();

/** Exact eBay path and complete direct document accepted by updateReturnPolicy. */
export const updateReturnPolicyArgumentsSchema = returnPolicyDocumentSchema
  .extend({ returnPolicyId: z.string().min(1) })
  .strict();

/** Exact eBay path accepted by deleteReturnPolicy. */
export const deleteReturnPolicyArgumentsSchema = z
  .object({ returnPolicyId: z.string().min(1) })
  .strict();

/** Validated eBay marketplace selection for return-policy collection reads. */
export type GetReturnPoliciesArguments = z.infer<typeof getReturnPoliciesArgumentsSchema>;

/** Validated direct eBay return-policy creation document. */
export type CreateReturnPolicyArguments = z.infer<typeof createReturnPolicyArgumentsSchema>;

/** Validated eBay return-policy path. */
export type GetReturnPolicyArguments = z.infer<typeof getReturnPolicyArgumentsSchema>;

/** Validated eBay marketplace and return-policy name selection. */
export type GetReturnPolicyByNameArguments = z.infer<typeof getReturnPolicyByNameArgumentsSchema>;

/** Validated eBay return-policy path and complete replacement document. */
export type UpdateReturnPolicyArguments = z.infer<typeof updateReturnPolicyArgumentsSchema>;

/** Validated eBay return-policy deletion path. */
export type DeleteReturnPolicyArguments = z.infer<typeof deleteReturnPolicyArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/account/types/api:ReturnPolicyResponse */
export type ReturnPolicyCollection = components['schemas']['ReturnPolicyResponse'];

/** @see https://developer.ebay.com/api-docs/sell/account/types/api:ReturnPolicy */
export type ReturnPolicy = components['schemas']['ReturnPolicy'];

/** @see https://developer.ebay.com/api-docs/sell/account/types/api:SetReturnPolicyResponse */
export type SetReturnPolicy = components['schemas']['SetReturnPolicyResponse'];

/**
 * Retrieves seller return policies for one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param marketplaceSelection - Exact eBay marketplace query and optional localization header.
 * @returns Explicit completion containing eBay's unchanged generated policy collection.
 * @example `await getReturnPolicies(sellerSession, { marketplace_id: 'EBAY_US' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/return_policy/methods/getReturnPolicies
 */
export const getReturnPolicies = (
  sellerSession: EbaySellerSession,
  marketplaceSelection: GetReturnPoliciesArguments,
): Promise<EbayRequestCompletion<ReturnPolicyCollection>> => {
  const requestHeaders = contentLanguageHeadersFor(marketplaceSelection);
  return sellerSession.get<ReturnPolicyCollection>({
    endpoint: '/sell/account/v1/return_policy',
    requestHeaders,
    searchParameters: { marketplace_id: marketplaceSelection.marketplace_id },
  });
};

/**
 * Creates one seller return policy.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param policyCreation - Direct eBay return-policy creation document.
 * @returns Explicit completion containing eBay's unchanged generated creation detail.
 * @example `await createReturnPolicy(sellerSession, { marketplaceId: 'EBAY_US', name: '30-day returns', returnPeriod: { unit: 'DAY', value: 30 }, returnsAccepted: true, returnShippingCostPayer: 'BUYER' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/return_policy/methods/createReturnPolicy
 */
export const createReturnPolicy = (
  sellerSession: EbaySellerSession,
  policyCreation: CreateReturnPolicyArguments,
): Promise<EbayRequestCompletion<SetReturnPolicy>> =>
  sellerSession.post<SetReturnPolicy>({
    endpoint: '/sell/account/v1/return_policy',
    requestDocument: policyCreation,
  });

/**
 * Retrieves one seller return policy by ID.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param policyLookup - Exact eBay return-policy path.
 * @returns Explicit completion containing eBay's unchanged generated policy.
 * @example `await getReturnPolicy(sellerSession, { returnPolicyId: 'RETURN-1' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/return_policy/methods/getReturnPolicy
 */
export const getReturnPolicy = (
  sellerSession: EbaySellerSession,
  policyLookup: GetReturnPolicyArguments,
): Promise<EbayRequestCompletion<ReturnPolicy>> =>
  sellerSession.get<ReturnPolicy>({
    endpoint: `/sell/account/v1/return_policy/${encodeURIComponent(policyLookup.returnPolicyId)}`,
  });

/**
 * Retrieves one seller return policy by marketplace and name.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param policyNameLookup - Exact eBay marketplace, name, and optional localization header.
 * @returns Explicit completion containing eBay's unchanged generated policy.
 * @example `await getReturnPolicyByName(sellerSession, { marketplace_id: 'EBAY_US', name: '30-day returns' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/return_policy/methods/getReturnPolicyByName
 */
export const getReturnPolicyByName = (
  sellerSession: EbaySellerSession,
  policyNameLookup: GetReturnPolicyByNameArguments,
): Promise<EbayRequestCompletion<ReturnPolicy>> => {
  const requestHeaders = contentLanguageHeadersFor(policyNameLookup);
  return sellerSession.get<ReturnPolicy>({
    endpoint: '/sell/account/v1/return_policy/get_by_policy_name',
    requestHeaders,
    searchParameters: {
      marketplace_id: policyNameLookup.marketplace_id,
      name: policyNameLookup.name,
    },
  });
};

/**
 * Replaces one seller return policy.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param policyReplacement - Exact eBay path and complete direct replacement document.
 * @returns Explicit completion containing eBay's unchanged generated update detail.
 * @example `await updateReturnPolicy(sellerSession, { marketplaceId: 'EBAY_US', name: 'Updated returns', returnPeriod: { unit: 'DAY', value: 60 }, returnPolicyId: 'RETURN-1', returnsAccepted: true, returnShippingCostPayer: 'SELLER' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/return_policy/methods/updateReturnPolicy
 */
export const updateReturnPolicy = (
  sellerSession: EbaySellerSession,
  policyReplacement: UpdateReturnPolicyArguments,
): Promise<EbayRequestCompletion<SetReturnPolicy>> => {
  const { returnPolicyId, ...replacementDocument } = policyReplacement;
  return sellerSession.put<SetReturnPolicy>({
    endpoint: `/sell/account/v1/return_policy/${encodeURIComponent(returnPolicyId)}`,
    requestDocument: replacementDocument,
  });
};

/**
 * Deletes one seller return policy.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param policyDeletion - Exact eBay return-policy path.
 * @returns Explicit completion for eBay's empty success document.
 * @example `await deleteReturnPolicy(sellerSession, { returnPolicyId: 'RETURN-1' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/return_policy/methods/deleteReturnPolicy
 */
export const deleteReturnPolicy = (
  sellerSession: EbaySellerSession,
  policyDeletion: DeleteReturnPolicyArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.delete<undefined>({
    endpoint: `/sell/account/v1/return_policy/${encodeURIComponent(policyDeletion.returnPolicyId)}`,
  });

export const getReturnPoliciesTool = defineTool({
  name: 'ebay_sell_account_get_return_policies',
  namespace: 'sell.account',
  description: 'Retrieve seller return policies for one eBay marketplace',
  argumentsSchema: getReturnPoliciesArgumentsSchema,
  operationKind: 'read',
  operation: getReturnPolicies,
});

export const createReturnPolicyTool = defineTool({
  name: 'ebay_sell_account_create_return_policy',
  namespace: 'sell.account',
  description: 'Create one seller return policy using the direct eBay document',
  argumentsSchema: createReturnPolicyArgumentsSchema,
  operationKind: 'write',
  operation: createReturnPolicy,
});

export const getReturnPolicyTool = defineTool({
  name: 'ebay_sell_account_get_return_policy',
  namespace: 'sell.account',
  description: 'Retrieve one seller return policy by its exact eBay identifier',
  argumentsSchema: getReturnPolicyArgumentsSchema,
  operationKind: 'read',
  operation: getReturnPolicy,
});

export const getReturnPolicyByNameTool = defineTool({
  name: 'ebay_sell_account_get_return_policy_by_name',
  namespace: 'sell.account',
  description: 'Retrieve one seller return policy by marketplace and policy name',
  argumentsSchema: getReturnPolicyByNameArgumentsSchema,
  operationKind: 'read',
  operation: getReturnPolicyByName,
});

export const updateReturnPolicyTool = defineTool({
  name: 'ebay_sell_account_update_return_policy',
  namespace: 'sell.account',
  description: 'Replace one seller return policy using the complete direct eBay document',
  argumentsSchema: updateReturnPolicyArgumentsSchema,
  operationKind: 'write',
  operation: updateReturnPolicy,
});

export const deleteReturnPolicyTool = defineTool({
  name: 'ebay_sell_account_delete_return_policy',
  namespace: 'sell.account',
  description: 'Delete one seller return policy by its exact eBay identifier',
  argumentsSchema: deleteReturnPolicyArgumentsSchema,
  operationKind: 'write',
  operation: deleteReturnPolicy,
});
