import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbayRequestHeaders, EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/account-management/sellAccountV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const marketplaceIdSchema = z.string().min(1);
const contentLanguageSchema = z.string().min(1);

const categoryTypeSchema = z
  .object({ name: z.enum(['ALL_EXCLUDING_MOTORS_VEHICLES', 'MOTORS_VEHICLES']) })
  .strict();

const depositAmountSchema = z
  .object({
    currency: z.string().regex(/^[A-Z]{3}$/, 'currency must be an uppercase ISO 4217 code'),
    value: z
      .string()
      .regex(/^\d+(?:\.\d+)?$/, 'deposit amount must be a non-negative decimal number')
      .refine((depositAmount) => Number(depositAmount) > 0, 'deposit amount must be positive'),
  })
  .strict();

const depositDeadlineSchema = z
  .object({
    unit: z.literal('HOUR'),
    value: z.union([z.literal(24), z.literal(48), z.literal(72)]),
  })
  .strict();

const depositSchema = z
  .object({
    amount: depositAmountSchema,
    dueIn: depositDeadlineSchema,
  })
  .strict();

const fullPaymentDeadlineSchema = z
  .object({
    unit: z.literal('DAY'),
    value: z.union([z.literal(3), z.literal(7), z.literal(10), z.literal(14)]),
  })
  .strict();

const offlinePaymentMethodSchema = z
  .object({
    paymentMethodType: z.enum([
      'CASH_IN_PERSON',
      'CASH_ON_DELIVERY',
      'CASH_ON_PICKUP',
      'CASHIER_CHECK',
      'ESCROW',
      'MONEY_ORDER',
      'PERSONAL_CHECK',
      'OTHER',
    ]),
  })
  .strict();

const paymentPolicyFields = {
  categoryTypes: z.array(categoryTypeSchema).min(1).max(2).optional(),
  deposit: depositSchema.optional(),
  description: z.string().max(250).optional(),
  fullPaymentDueIn: fullPaymentDeadlineSchema.optional(),
  immediatePay: z.boolean().optional(),
  marketplaceId: marketplaceIdSchema,
  name: z.string().min(1).max(64),
  paymentMethods: z.array(offlinePaymentMethodSchema).min(1).optional(),
};

const paymentPolicyDocumentSchema = z.object(paymentPolicyFields).strict();

type PaymentPolicyDocument = z.infer<typeof paymentPolicyDocumentSchema>;

function includesMotorVehicleCategory(policyDocument: PaymentPolicyDocument): boolean {
  const categoryTypes = policyDocument.categoryTypes;
  if (categoryTypes === undefined) {
    return false;
  }
  return categoryTypes.some((categoryType) => categoryType.name === 'MOTORS_VEHICLES');
}

function validatePaymentPolicyDocument(
  policyDocument: PaymentPolicyDocument,
  validation: z.RefinementCtx,
): void {
  const includesMotorVehicles = includesMotorVehicleCategory(policyDocument);
  if (includesMotorVehicles && policyDocument.fullPaymentDueIn === undefined) {
    validation.addIssue({
      code: 'custom',
      message: 'fullPaymentDueIn is required for motor vehicle payment policies',
      path: ['fullPaymentDueIn'],
    });
  }
  if (includesMotorVehicles && policyDocument.paymentMethods === undefined) {
    validation.addIssue({
      code: 'custom',
      message: 'one offline payment method is required for motor vehicle payment policies',
      path: ['paymentMethods'],
    });
  }
  if (policyDocument.deposit === undefined) {
    return;
  }
  if (!includesMotorVehicles) {
    validation.addIssue({
      code: 'custom',
      message: 'deposit is only supported by motor vehicle payment policies',
      path: ['deposit'],
    });
  }
  const depositAmount = Number(policyDocument.deposit.amount.value);
  if (depositAmount > 2000) {
    validation.addIssue({
      code: 'custom',
      message: 'deposit amount cannot exceed 2000',
      path: ['deposit', 'amount', 'value'],
    });
  }
  if (policyDocument.immediatePay === true && depositAmount > 500) {
    validation.addIssue({
      code: 'custom',
      message: 'deposit amount cannot exceed 500 when immediate payment is required',
      path: ['deposit', 'amount', 'value'],
    });
  }
}

function contentLanguageHeadersFor(localizedSelection: {
  'Content-Language'?: string;
}): EbayRequestHeaders | undefined {
  const contentLanguage = localizedSelection['Content-Language'];
  if (contentLanguage === undefined) {
    return;
  }
  return { 'Content-Language': contentLanguage };
}

/** Exact eBay query and localization header accepted by getPaymentPolicies. */
export const getPaymentPoliciesArgumentsSchema = z
  .object({
    'Content-Language': contentLanguageSchema.optional(),
    marketplace_id: marketplaceIdSchema,
  })
  .strict();

/** Direct eBay document accepted by createPaymentPolicy. */
export const createPaymentPolicyArgumentsSchema = paymentPolicyDocumentSchema.superRefine(
  validatePaymentPolicyDocument,
);

/** Exact eBay path accepted by getPaymentPolicy. */
export const getPaymentPolicyArgumentsSchema = z
  .object({ paymentPolicyId: z.string().min(1) })
  .strict();

/** Exact eBay query and localization header accepted by getPaymentPolicyByName. */
export const getPaymentPolicyByNameArgumentsSchema = z
  .object({
    'Content-Language': contentLanguageSchema.optional(),
    marketplace_id: marketplaceIdSchema,
    name: z.string().min(1).max(64),
  })
  .strict();

/** Exact eBay path and complete direct document accepted by updatePaymentPolicy. */
export const updatePaymentPolicyArgumentsSchema = paymentPolicyDocumentSchema
  .extend({ paymentPolicyId: z.string().min(1) })
  .strict()
  .superRefine(validatePaymentPolicyDocument);

/** Exact eBay path accepted by deletePaymentPolicy. */
export const deletePaymentPolicyArgumentsSchema = z
  .object({ paymentPolicyId: z.string().min(1) })
  .strict();

/** Validated eBay marketplace selection for payment-policy collection reads. */
export type GetPaymentPoliciesArguments = z.infer<typeof getPaymentPoliciesArgumentsSchema>;

/** Validated direct eBay payment-policy creation document. */
export type CreatePaymentPolicyArguments = z.infer<typeof createPaymentPolicyArgumentsSchema>;

/** Validated eBay payment-policy path. */
export type GetPaymentPolicyArguments = z.infer<typeof getPaymentPolicyArgumentsSchema>;

/** Validated eBay marketplace and payment-policy name selection. */
export type GetPaymentPolicyByNameArguments = z.infer<typeof getPaymentPolicyByNameArgumentsSchema>;

/** Validated eBay payment-policy path and complete replacement document. */
export type UpdatePaymentPolicyArguments = z.infer<typeof updatePaymentPolicyArgumentsSchema>;

/** Validated eBay payment-policy deletion path. */
export type DeletePaymentPolicyArguments = z.infer<typeof deletePaymentPolicyArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/account/types/api:PaymentPolicyResponse */
export type PaymentPolicyCollection = components['schemas']['PaymentPolicyResponse'];

/** @see https://developer.ebay.com/api-docs/sell/account/types/api:PaymentPolicy */
export type PaymentPolicy = components['schemas']['PaymentPolicy'];

/** @see https://developer.ebay.com/api-docs/sell/account/types/api:SetPaymentPolicyResponse */
export type SetPaymentPolicy = components['schemas']['SetPaymentPolicyResponse'];

/**
 * Retrieves seller payment policies for one marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param marketplaceSelection - Exact eBay marketplace query and optional localization header.
 * @returns Explicit completion containing eBay's unchanged generated policy collection.
 * @example `await getPaymentPolicies(sellerSession, { marketplace_id: 'EBAY_US' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/payment_policy/methods/getPaymentPolicies
 */
export const getPaymentPolicies = (
  sellerSession: EbaySellerSession,
  marketplaceSelection: GetPaymentPoliciesArguments,
): Promise<EbayRequestCompletion<PaymentPolicyCollection>> => {
  const requestHeaders = contentLanguageHeadersFor(marketplaceSelection);
  return sellerSession.get<PaymentPolicyCollection>({
    endpoint: '/sell/account/v1/payment_policy',
    requestHeaders,
    searchParameters: { marketplace_id: marketplaceSelection.marketplace_id },
  });
};

/**
 * Creates one seller payment policy.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param policyCreation - Direct eBay payment-policy creation document.
 * @returns Explicit completion containing eBay's unchanged generated creation detail.
 * @example `await createPaymentPolicy(sellerSession, { immediatePay: true, marketplaceId: 'EBAY_US', name: 'Immediate payment' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/payment_policy/methods/createPaymentPolicy
 */
export const createPaymentPolicy = (
  sellerSession: EbaySellerSession,
  policyCreation: CreatePaymentPolicyArguments,
): Promise<EbayRequestCompletion<SetPaymentPolicy>> =>
  sellerSession.post<SetPaymentPolicy>({
    endpoint: '/sell/account/v1/payment_policy',
    requestDocument: policyCreation,
  });

/**
 * Retrieves one seller payment policy by ID.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param policyLookup - Exact eBay payment-policy path.
 * @returns Explicit completion containing eBay's unchanged generated policy.
 * @example `await getPaymentPolicy(sellerSession, { paymentPolicyId: 'PAYMENT-1' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/payment_policy/methods/getPaymentPolicy
 */
export const getPaymentPolicy = (
  sellerSession: EbaySellerSession,
  policyLookup: GetPaymentPolicyArguments,
): Promise<EbayRequestCompletion<PaymentPolicy>> =>
  sellerSession.get<PaymentPolicy>({
    endpoint: `/sell/account/v1/payment_policy/${encodeURIComponent(policyLookup.paymentPolicyId)}`,
  });

/**
 * Retrieves one seller payment policy by marketplace and name.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param policyNameLookup - Exact eBay marketplace, name, and optional localization header.
 * @returns Explicit completion containing eBay's unchanged generated policy.
 * @example `await getPaymentPolicyByName(sellerSession, { marketplace_id: 'EBAY_US', name: 'Immediate payment' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/payment_policy/methods/getPaymentPolicyByName
 */
export const getPaymentPolicyByName = (
  sellerSession: EbaySellerSession,
  policyNameLookup: GetPaymentPolicyByNameArguments,
): Promise<EbayRequestCompletion<PaymentPolicy>> => {
  const requestHeaders = contentLanguageHeadersFor(policyNameLookup);
  return sellerSession.get<PaymentPolicy>({
    endpoint: '/sell/account/v1/payment_policy/get_by_policy_name',
    requestHeaders,
    searchParameters: {
      marketplace_id: policyNameLookup.marketplace_id,
      name: policyNameLookup.name,
    },
  });
};

/**
 * Replaces one seller payment policy.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param policyReplacement - Exact eBay path and complete direct replacement document.
 * @returns Explicit completion containing eBay's unchanged generated update detail.
 * @example `await updatePaymentPolicy(sellerSession, { immediatePay: true, marketplaceId: 'EBAY_US', name: 'Updated payment', paymentPolicyId: 'PAYMENT-1' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/payment_policy/methods/updatePaymentPolicy
 */
export const updatePaymentPolicy = (
  sellerSession: EbaySellerSession,
  policyReplacement: UpdatePaymentPolicyArguments,
): Promise<EbayRequestCompletion<SetPaymentPolicy>> => {
  const { paymentPolicyId, ...replacementDocument } = policyReplacement;
  return sellerSession.put<SetPaymentPolicy>({
    endpoint: `/sell/account/v1/payment_policy/${encodeURIComponent(paymentPolicyId)}`,
    requestDocument: replacementDocument,
  });
};

/**
 * Deletes one seller payment policy.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param policyDeletion - Exact eBay payment-policy path.
 * @returns Explicit completion for eBay's empty success document.
 * @example `await deletePaymentPolicy(sellerSession, { paymentPolicyId: 'PAYMENT-1' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/payment_policy/methods/deletePaymentPolicy
 */
export const deletePaymentPolicy = (
  sellerSession: EbaySellerSession,
  policyDeletion: DeletePaymentPolicyArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.delete<undefined>({
    endpoint: `/sell/account/v1/payment_policy/${encodeURIComponent(policyDeletion.paymentPolicyId)}`,
  });

export const getPaymentPoliciesTool = defineTool({
  name: 'ebay_sell_account_get_payment_policies',
  namespace: 'sell.account',
  description: 'Retrieve seller payment policies for one eBay marketplace',
  argumentsSchema: getPaymentPoliciesArgumentsSchema,
  operationKind: 'read',
  operation: getPaymentPolicies,
});

export const createPaymentPolicyTool = defineTool({
  name: 'ebay_sell_account_create_payment_policy',
  namespace: 'sell.account',
  description: 'Create one seller payment policy using the direct eBay document',
  argumentsSchema: createPaymentPolicyArgumentsSchema,
  operationKind: 'write',
  operation: createPaymentPolicy,
});

export const getPaymentPolicyTool = defineTool({
  name: 'ebay_sell_account_get_payment_policy',
  namespace: 'sell.account',
  description: 'Retrieve one seller payment policy by its exact eBay identifier',
  argumentsSchema: getPaymentPolicyArgumentsSchema,
  operationKind: 'read',
  operation: getPaymentPolicy,
});

export const getPaymentPolicyByNameTool = defineTool({
  name: 'ebay_sell_account_get_payment_policy_by_name',
  namespace: 'sell.account',
  description: 'Retrieve one seller payment policy by marketplace and policy name',
  argumentsSchema: getPaymentPolicyByNameArgumentsSchema,
  operationKind: 'read',
  operation: getPaymentPolicyByName,
});

export const updatePaymentPolicyTool = defineTool({
  name: 'ebay_sell_account_update_payment_policy',
  namespace: 'sell.account',
  description: 'Replace one seller payment policy using the complete direct eBay document',
  argumentsSchema: updatePaymentPolicyArgumentsSchema,
  operationKind: 'write',
  operation: updatePaymentPolicy,
});

export const deletePaymentPolicyTool = defineTool({
  name: 'ebay_sell_account_delete_payment_policy',
  namespace: 'sell.account',
  description: 'Delete one seller payment policy by its exact eBay identifier',
  argumentsSchema: deletePaymentPolicyArgumentsSchema,
  operationKind: 'write',
  operation: deletePaymentPolicy,
});
