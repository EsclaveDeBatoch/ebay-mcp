import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type {
  components,
  operations,
} from '@/generated/ebay/sell-apps/account-management/sellAccountV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const customPolicyTypeSchema = z.enum(['PRODUCT_COMPLIANCE', 'TAKE_BACK']);

const customPolicyTypeFilterSchema = z
  .string()
  .regex(
    /^(?:PRODUCT_COMPLIANCE|TAKE_BACK)(?:,(?:PRODUCT_COMPLIANCE|TAKE_BACK))*$/,
    'policy_types must be a comma-delimited list of official custom policy types',
  );

const customPolicyDescriptionSchema = z.string().max(15_000);
const customPolicyLabelSchema = z.string().max(65);
const customPolicyNameSchema = z.string().min(1).max(65);

/** Exact eBay query accepted by getCustomPolicies. */
export const getCustomPoliciesArgumentsSchema = z
  .object({ policy_types: customPolicyTypeFilterSchema.optional() })
  .strict();

/** Exact eBay path accepted by getCustomPolicy. */
export const getCustomPolicyArgumentsSchema = z
  .object({ custom_policy_id: z.string().min(1) })
  .strict();

/** Direct eBay document accepted by createCustomPolicy. */
export const createCustomPolicyArgumentsSchema = z
  .object({
    description: customPolicyDescriptionSchema.optional(),
    label: customPolicyLabelSchema.optional(),
    name: customPolicyNameSchema,
    policyType: customPolicyTypeSchema,
  })
  .strict();

/** Exact eBay path and complete replacement document accepted by updateCustomPolicy. */
export const updateCustomPolicyArgumentsSchema = z
  .object({
    custom_policy_id: z.string().min(1),
    description: customPolicyDescriptionSchema,
    label: customPolicyLabelSchema,
    name: customPolicyNameSchema,
  })
  .strict();

/** Validated eBay custom-policy collection query. */
export type GetCustomPoliciesArguments = z.infer<typeof getCustomPoliciesArgumentsSchema>;

/** Validated eBay custom-policy path. */
export type GetCustomPolicyArguments = z.infer<typeof getCustomPolicyArgumentsSchema>;

/** Validated direct eBay custom-policy creation document. */
export type CreateCustomPolicyArguments = z.infer<typeof createCustomPolicyArgumentsSchema>;

/** Validated eBay custom-policy path and complete replacement document. */
export type UpdateCustomPolicyArguments = z.infer<typeof updateCustomPolicyArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/account/types/api:CustomPolicyResponse */
export type CustomPolicyCollection = components['schemas']['CustomPolicyResponse'];

/** @see https://developer.ebay.com/api-docs/sell/account/types/api:CustomPolicy */
export type CustomPolicy = components['schemas']['CustomPolicy'];

/** @see https://developer.ebay.com/api-docs/sell/account/resources/custom_policy/methods/createCustomPolicy */
export type CreatedCustomPolicy =
  operations['createCustomPolicy']['responses'][201]['content']['application/json'];

/**
 * Retrieves seller custom policies through the official Account API operation.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param policySearch - Exact eBay custom-policy type filter.
 * @returns Explicit completion containing eBay's unchanged generated custom-policy collection.
 * @example `await getCustomPolicies(sellerSession, { policy_types: 'PRODUCT_COMPLIANCE,TAKE_BACK' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/custom_policy/methods/getCustomPolicies
 */
export const getCustomPolicies = (
  sellerSession: EbaySellerSession,
  policySearch: GetCustomPoliciesArguments = {},
): Promise<EbayRequestCompletion<CustomPolicyCollection>> =>
  sellerSession.get<CustomPolicyCollection>({
    endpoint: '/sell/account/v1/custom_policy/',
    searchParameters: policySearch,
  });

/**
 * Retrieves one seller custom policy through the official Account API operation.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param policyLookup - Exact eBay custom-policy path.
 * @returns Explicit completion containing eBay's unchanged generated custom policy.
 * @example `await getCustomPolicy(sellerSession, { custom_policy_id: 'POLICY-1' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/custom_policy/methods/getCustomPolicy
 */
export const getCustomPolicy = (
  sellerSession: EbaySellerSession,
  policyLookup: GetCustomPolicyArguments,
): Promise<EbayRequestCompletion<CustomPolicy>> =>
  sellerSession.get<CustomPolicy>({
    endpoint: `/sell/account/v1/custom_policy/${encodeURIComponent(policyLookup.custom_policy_id)}`,
  });

/**
 * Creates one seller custom policy through the official Account API operation.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param policyCreation - Direct eBay custom-policy creation document.
 * @returns Explicit completion containing eBay's unchanged empty creation document.
 * @example `await createCustomPolicy(sellerSession, { name: 'Take-back policy', policyType: 'TAKE_BACK' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/custom_policy/methods/createCustomPolicy
 */
export const createCustomPolicy = (
  sellerSession: EbaySellerSession,
  policyCreation: CreateCustomPolicyArguments,
): Promise<EbayRequestCompletion<CreatedCustomPolicy>> =>
  sellerSession.post<CreatedCustomPolicy>({
    endpoint: '/sell/account/v1/custom_policy/',
    requestDocument: policyCreation,
  });

/**
 * Replaces one seller custom policy through the official Account API operation.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param policyReplacement - Exact eBay path and complete replacement document.
 * @returns Explicit completion for eBay's empty success document.
 * @example `await updateCustomPolicy(sellerSession, { custom_policy_id: 'POLICY-1', description: 'Updated terms', label: 'Updated details', name: 'Updated policy' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/custom_policy/methods/updateCustomPolicy
 */
export const updateCustomPolicy = (
  sellerSession: EbaySellerSession,
  policyReplacement: UpdateCustomPolicyArguments,
): Promise<EbayRequestCompletion<undefined>> => {
  const { custom_policy_id: customPolicyId, ...replacementDocument } = policyReplacement;
  return sellerSession.put<undefined>({
    endpoint: `/sell/account/v1/custom_policy/${encodeURIComponent(customPolicyId)}`,
    requestDocument: replacementDocument,
  });
};

export const getCustomPoliciesTool = defineTool({
  name: 'ebay_sell_account_get_custom_policies',
  namespace: 'sell.account',
  description: 'Retrieve seller custom policies using the exact eBay policy_types filter',
  argumentsSchema: getCustomPoliciesArgumentsSchema,
  operationKind: 'read',
  operation: getCustomPolicies,
});

export const createCustomPolicyTool = defineTool({
  name: 'ebay_sell_account_create_custom_policy',
  namespace: 'sell.account',
  description: 'Create one seller custom policy using the direct eBay document',
  argumentsSchema: createCustomPolicyArgumentsSchema,
  operationKind: 'write',
  operation: createCustomPolicy,
});

export const getCustomPolicyTool = defineTool({
  name: 'ebay_sell_account_get_custom_policy',
  namespace: 'sell.account',
  description: 'Retrieve one seller custom policy by its exact eBay identifier',
  argumentsSchema: getCustomPolicyArgumentsSchema,
  operationKind: 'read',
  operation: getCustomPolicy,
});

export const updateCustomPolicyTool = defineTool({
  name: 'ebay_sell_account_update_custom_policy',
  namespace: 'sell.account',
  description: 'Replace one seller custom policy using the complete direct eBay document',
  argumentsSchema: updateCustomPolicyArgumentsSchema,
  operationKind: 'write',
  operation: updateCustomPolicy,
});
