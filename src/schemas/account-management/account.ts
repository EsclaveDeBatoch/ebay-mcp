import { z } from '@/utils/effectSchema.js';
import { MarketplaceId } from '@/types/ebayEnums.js';

/**
 * Account Management API Schemas
 *
 * This file contains Effect-backed schemas for all Account Management endpoints.
 * Schemas are organized by endpoint and include both input and output validation.
 */

/** Validates the Account Management API payments program request payload. */
export const getPaymentsProgramInputSchema = z.object({
  marketplaceId: z.nativeEnum(MarketplaceId).describe('The eBay marketplace ID'),
  paymentsProgramType: z.string().describe('The type of payments program'),
});

/** Validates the Account Management API payments onboarding request payload. */
export const getPaymentsProgramOnboardingInputSchema = getPaymentsProgramInputSchema;
