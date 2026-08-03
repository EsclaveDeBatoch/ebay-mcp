import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/other-apis/sellEdeliveryInternationalShippingOas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const chinaAddressFields = {
  city: z.string().min(1).optional(),
  company: z.string().min(1).max(50).optional(),
  contact: z.string().min(1).max(50).optional(),
  countryCode: z.enum(['CN', 'HK']).optional(),
  district: z.string().min(1).optional(),
  name: z.string().min(1).max(50).optional(),
  phone: z.string().min(1).optional(),
  postcode: z.string().min(1).optional(),
  province: z.string().min(1).optional(),
  street1: z.string().min(1).max(50).optional(),
  street2: z.string().min(1).max(50).optional(),
  street3: z.string().min(1).max(50).optional(),
};

const shipFromAddressSchema = z
  .object({
    ...chinaAddressFields,
    type: z.enum(['SHIP_FROM_ADDRESS', 'RETURN_ADRESS']).optional(),
  })
  .strict();

const pickupAddressSchema = z.object(chinaAddressFields).strict();

const consignAddressSchema = z
  .object({
    consignPreferenceName: z.string().min(1).optional(),
    dropoffSiteId: z.string().min(1).optional(),
    pickupAddress: pickupAddressSchema.optional(),
    pickupTime: z.string().min(1).optional(),
    type: z
      .enum([
        'PICK_UP',
        'DROP_OFF',
        'FORWARD_DEPLOYMENT',
        'RDC',
        'CN_POST_DROP_OFF',
        'CN_POST_PICK_UP',
        'HK_POST_DROP_OFF',
      ])
      .optional(),
  })
  .strict()
  .superRefine((consignAddress, validation) => {
    if (consignAddress.type === 'DROP_OFF' && consignAddress.dropoffSiteId === undefined) {
      validation.addIssue({
        code: 'custom',
        message: 'dropoffSiteId is required for a DROP_OFF preference',
        path: ['dropoffSiteId'],
      });
    }
    if (consignAddress.type === 'PICK_UP') {
      if (consignAddress.pickupAddress === undefined) {
        validation.addIssue({
          code: 'custom',
          message: 'pickupAddress is required for a PICK_UP preference',
          path: ['pickupAddress'],
        });
      }
      if (consignAddress.pickupTime === undefined) {
        validation.addIssue({
          code: 'custom',
          message: 'pickupTime is required for a PICK_UP preference',
          path: ['pickupTime'],
        });
      }
    }
  });

/** Empty argument contract accepted by getAddressPreferences. */
export const getAddressPreferencesArgumentsSchema = z.object({}).strict();

/** Exact generated eBay document accepted by createAddressPreference. */
export const createAddressPreferenceArgumentsSchema = z
  .object({
    shipFromAddress: shipFromAddressSchema,
  })
  .strict();

/** Empty argument contract accepted by getConsignPreferences. */
export const getConsignPreferencesArgumentsSchema = z.object({}).strict();

/** Exact generated eBay document accepted by createConsignPreference. */
export const createConsignPreferenceArgumentsSchema = z
  .object({
    consignAddress: consignAddressSchema,
  })
  .strict();

/** Validated eBay address-preference document. */
export type AddressPreferenceSubmission = z.infer<typeof createAddressPreferenceArgumentsSchema>;

/** Validated eBay consign-preference document. */
export type ConsignPreferenceSubmission = z.infer<typeof createConsignPreferenceArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/types/api:GetAddressPreferenceListResponses */
export type AddressPreferenceCollection =
  components['schemas']['GetAddressPreferenceListResponses'];

/** @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/types/api:CreateAddressPreferenceResponses */
export type AddressPreferenceCreation = components['schemas']['CreateAddressPreferenceResponses'];

/** @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/types/api:GetConsignPreferenceListResponses */
export type ConsignPreferenceCollection =
  components['schemas']['GetConsignPreferenceListResponses'];

/** @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/types/api:CreateConsignPreferenceResponses */
export type ConsignPreferenceCreation = components['schemas']['CreateConsignPreferenceResponses'];

/**
 * Retrieves ship-from and return addresses saved on the seller's eDIS account.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getAddressPreferences(sellerSession)`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/address_preference/methods/getAddressPreferences
 */
export const getAddressPreferences = (
  sellerSession: EbaySellerSession,
): Promise<EbayRequestCompletion<AddressPreferenceCollection>> =>
  sellerSession.get<AddressPreferenceCollection>({
    endpoint: '/sell/edelivery_international_shipping/v1/address_preference',
  });

/**
 * Creates one ship-from or return address on the seller's eDIS account.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param addressPreference - Exact generated eBay address-preference document.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await createAddressPreference(sellerSession, { shipFromAddress: { countryCode: 'CN' } })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/address_preference/methods/createAddressPreference
 */
export const createAddressPreference = (
  sellerSession: EbaySellerSession,
  addressPreference: AddressPreferenceSubmission,
): Promise<EbayRequestCompletion<AddressPreferenceCreation>> =>
  sellerSession.post<AddressPreferenceCreation>({
    endpoint: '/sell/edelivery_international_shipping/v1/address_preference',
    requestDocument: addressPreference,
  });

/**
 * Retrieves pickup, drop-off, and deployment preferences from the seller's eDIS account.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getConsignPreferences(sellerSession)`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/consign_preference/methods/getConsignPreferences
 */
export const getConsignPreferences = (
  sellerSession: EbaySellerSession,
): Promise<EbayRequestCompletion<ConsignPreferenceCollection>> =>
  sellerSession.get<ConsignPreferenceCollection>({
    endpoint: '/sell/edelivery_international_shipping/v1/consign_preference',
  });

/**
 * Creates one pickup, drop-off, or deployment preference on the seller's eDIS account.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param consignPreference - Exact generated eBay consign-preference document.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await createConsignPreference(sellerSession, { consignAddress: { type: 'RDC' } })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/consign_preference/methods/createConsignPreference
 */
export const createConsignPreference = (
  sellerSession: EbaySellerSession,
  consignPreference: ConsignPreferenceSubmission,
): Promise<EbayRequestCompletion<ConsignPreferenceCreation>> =>
  sellerSession.post<ConsignPreferenceCreation>({
    endpoint: '/sell/edelivery_international_shipping/v1/consign_preference',
    requestDocument: consignPreference,
  });

export const getAddressPreferencesTool = defineTool({
  name: 'ebay_sell_edelivery_get_address_preferences',
  namespace: 'sell.edelivery',
  description: 'Retrieve eDIS ship-from and return address preferences',
  argumentsSchema: getAddressPreferencesArgumentsSchema,
  operationKind: 'read',
  operation: getAddressPreferences,
});

export const createAddressPreferenceTool = defineTool({
  name: 'ebay_sell_edelivery_create_address_preference',
  namespace: 'sell.edelivery',
  description: 'Create one eDIS ship-from or return address preference',
  argumentsSchema: createAddressPreferenceArgumentsSchema,
  operationKind: 'write',
  operation: createAddressPreference,
});

export const getConsignPreferencesTool = defineTool({
  name: 'ebay_sell_edelivery_get_consign_preferences',
  namespace: 'sell.edelivery',
  description: 'Retrieve eDIS pickup, drop-off, and deployment preferences',
  argumentsSchema: getConsignPreferencesArgumentsSchema,
  operationKind: 'read',
  operation: getConsignPreferences,
});

export const createConsignPreferenceTool = defineTool({
  name: 'ebay_sell_edelivery_create_consign_preference',
  namespace: 'sell.edelivery',
  description: 'Create one eDIS pickup, drop-off, or deployment preference',
  argumentsSchema: createConsignPreferenceArgumentsSchema,
  operationKind: 'write',
  operation: createConsignPreference,
});
