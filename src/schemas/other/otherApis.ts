import { z } from '@/utils/effectSchema.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * Other eBay APIs Schemas
 *
 * This file contains Effect-backed schemas for Sell eDelivery.
 */

// ============================================================================
// Common Schemas
// ============================================================================

const errorParameterSchema = z.object({
  name: z.string().optional(),
  value: z.string().optional(),
});

const errorSchema = z.object({
  category: z.string().optional(),
  domain: z.string().optional(),
  errorId: z.number().int().optional(),
  inputRefIds: z.array(z.string()).optional(),
  longMessage: z.string().optional(),
  message: z.string().optional(),
  outputRefIds: z.array(z.string()).optional(),
  parameters: z.array(errorParameterSchema).optional(),
  subdomain: z.string().optional(),
});

const pageMetadataSchema = z.object({
  href: z.string().optional(),
  limit: z.number().int().optional(),
  next: z.string().optional(),
  offset: z.number().int().optional(),
  prev: z.string().optional(),
  total: z.number().int().optional(),
});

// ============================================================================
// Sell eDelivery International Shipping API Schemas
// ============================================================================

const addressSchema = z.object({
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  stateOrProvince: z.string().optional(),
  postalCode: z.string().optional(),
  countryCode: z.string().optional(),
});

const contactSchema = z.object({
  companyName: z.string().optional(),
  contactAddress: addressSchema.optional(),
  email: z.string().optional(),
  fullName: z.string().optional(),
  primaryPhone: z
    .object({
      phoneNumber: z.string().optional(),
    })
    .optional(),
});

const dimensionsSchema = z.object({
  height: z.number().optional(),
  length: z.number().optional(),
  width: z.number().optional(),
  unit: z.string().optional(),
});

const weightSchema = z.object({
  value: z.number().optional(),
  unit: z.string().optional(),
});

const generatedEDeliveryBodySchema = z.object({}).passthrough();

const generatedEDeliveryResponseSchema = z.object({}).passthrough();

const emptyResponseSchema = z.object({});

/** Input schema for eDelivery endpoints that accept a generated request body. */
export const edeliveryBodyInputSchema = z.object({
  body: generatedEDeliveryBodySchema,
});

/** Shared pagination input schema for eDelivery list endpoints. */
export const edeliveryPaginationInputSchema = z.object({
  limit: z.number().int().optional(),
  offset: z.number().int().optional(),
});

/** Input schema for eDelivery getActualCosts. */
export const getActualCostsInputSchema = z.object({
  trackingNumbers: z.string().optional(),
  transactionBeginTime: z.string().optional(),
  transactionEndTime: z.string().optional(),
});

/** Input schema for eDelivery endpoints addressed by bundle ID. */
export const bundleIdInputSchema = z.object({
  bundleId: z.string(),
});

/** Input schema for eDelivery endpoints addressed by package ID. */
export const packageIdInputSchema = z.object({
  packageId: z.string(),
});

/** Input schema for eDelivery getPackagesByLineItemId. */
export const getPackagesByLineItemIdInputSchema = z.object({
  orderLineItemId: z.string(),
});

/** Input schema for eDelivery getLabels. */
export const getLabelsInputSchema = z.object({
  pageSize: z.string().optional(),
  printPreference: z.string().optional(),
  trackingNumbers: z.string(),
});

/** Input schema for eDelivery getHandoverSheet. */
export const getHandoverSheetInputSchema = z.object({
  trackingNumbers: z.string(),
});

/** Input schema for eDelivery getTracking. */
export const getTrackingInputSchema = z.object({
  trackingNumber: z.string(),
});

// ============================================================================
// Input Schemas for Operations
// ============================================================================

/** Empty input schema for Commerce Identity API getUser. */

/** Empty input schema for eDelivery getAddressPreferences. */
export const getAddressPreferencesInputSchema = z.object({});

/** Empty input schema for eDelivery getConsignPreferences. */
export const getConsignPreferencesInputSchema = z.object({});

// ============================================================================
// JSON Schema Conversion Functions
// ============================================================================

/**
 * Converts other eBay API Effect-backed schemas to JSON Schema format for MCP tools.
 *
 * @returns Other API JSON schemas keyed by endpoint or shared model name.
 * @example
 * ```ts
 * const schemas = getOtherApisJsonSchemas();
 * ```
 */
export const getOtherApisJsonSchemas = () => {
  return {
    // Sell eDelivery International Shipping API
    getActualCostsInput: zodToJsonSchema(getActualCostsInputSchema, 'getActualCostsInput'),
    getActualCostsOutput: zodToJsonSchema(generatedEDeliveryResponseSchema, 'getActualCostsOutput'),
    getAddressPreferencesInput: zodToJsonSchema(
      getAddressPreferencesInputSchema,
      'getAddressPreferencesInput',
    ),
    getAddressPreferencesOutput: zodToJsonSchema(
      generatedEDeliveryResponseSchema,
      'getAddressPreferencesOutput',
    ),
    createAddressPreferenceInput: zodToJsonSchema(
      edeliveryBodyInputSchema,
      'createAddressPreferenceInput',
    ),
    createAddressPreferenceOutput: zodToJsonSchema(
      generatedEDeliveryResponseSchema,
      'createAddressPreferenceOutput',
    ),
    getConsignPreferencesOutput: zodToJsonSchema(
      generatedEDeliveryResponseSchema,
      'getConsignPreferencesOutput',
    ),
    getConsignPreferencesInput: zodToJsonSchema(
      getConsignPreferencesInputSchema,
      'getConsignPreferencesInput',
    ),
    createConsignPreferenceInput: zodToJsonSchema(
      edeliveryBodyInputSchema,
      'createConsignPreferenceInput',
    ),
    createConsignPreferenceOutput: zodToJsonSchema(
      generatedEDeliveryResponseSchema,
      'createConsignPreferenceOutput',
    ),
    getAgentsInput: zodToJsonSchema(edeliveryPaginationInputSchema, 'getAgentsInput'),
    getAgentsOutput: zodToJsonSchema(generatedEDeliveryResponseSchema, 'getAgentsOutput'),
    getBatteryQualificationsInput: zodToJsonSchema(
      edeliveryPaginationInputSchema,
      'getBatteryQualificationsInput',
    ),
    getBatteryQualificationsOutput: zodToJsonSchema(
      generatedEDeliveryResponseSchema,
      'getBatteryQualificationsOutput',
    ),
    getDropoffSitesInput: zodToJsonSchema(edeliveryPaginationInputSchema, 'getDropoffSitesInput'),
    getDropoffSitesOutput: zodToJsonSchema(
      generatedEDeliveryResponseSchema,
      'getDropoffSitesOutput',
    ),
    getServicesInput: zodToJsonSchema(edeliveryPaginationInputSchema, 'getServicesInput'),
    getServicesOutput: zodToJsonSchema(generatedEDeliveryResponseSchema, 'getServicesOutput'),
    createBundleInput: zodToJsonSchema(edeliveryBodyInputSchema, 'createBundleInput'),
    createBundleOutput: zodToJsonSchema(generatedEDeliveryResponseSchema, 'createBundleOutput'),
    getBundleInput: zodToJsonSchema(bundleIdInputSchema, 'getBundleInput'),
    getBundleOutput: zodToJsonSchema(generatedEDeliveryResponseSchema, 'getBundleOutput'),
    cancelBundleInput: zodToJsonSchema(bundleIdInputSchema, 'cancelBundleInput'),
    cancelBundleOutput: zodToJsonSchema(emptyResponseSchema, 'cancelBundleOutput'),
    getBundleLabelInput: zodToJsonSchema(bundleIdInputSchema, 'getBundleLabelInput'),
    getBundleLabelOutput: zodToJsonSchema(generatedEDeliveryResponseSchema, 'getBundleLabelOutput'),
    createPackageInput: zodToJsonSchema(edeliveryBodyInputSchema, 'createPackageInput'),
    createPackageOutput: zodToJsonSchema(generatedEDeliveryResponseSchema, 'createPackageOutput'),
    getPackageInput: zodToJsonSchema(packageIdInputSchema, 'getPackageInput'),
    getPackageOutput: zodToJsonSchema(generatedEDeliveryResponseSchema, 'getPackageOutput'),
    deletePackageInput: zodToJsonSchema(packageIdInputSchema, 'deletePackageInput'),
    deletePackageOutput: zodToJsonSchema(emptyResponseSchema, 'deletePackageOutput'),
    getPackagesByLineItemIdInput: zodToJsonSchema(
      getPackagesByLineItemIdInputSchema,
      'getPackagesByLineItemIdInput',
    ),
    getPackagesByLineItemIdOutput: zodToJsonSchema(
      generatedEDeliveryResponseSchema,
      'getPackagesByLineItemIdOutput',
    ),
    cancelPackageInput: zodToJsonSchema(packageIdInputSchema, 'cancelPackageInput'),
    cancelPackageOutput: zodToJsonSchema(emptyResponseSchema, 'cancelPackageOutput'),
    clonePackageInput: zodToJsonSchema(packageIdInputSchema, 'clonePackageInput'),
    clonePackageOutput: zodToJsonSchema(generatedEDeliveryResponseSchema, 'clonePackageOutput'),
    confirmPackageInput: zodToJsonSchema(packageIdInputSchema, 'confirmPackageInput'),
    confirmPackageOutput: zodToJsonSchema(emptyResponseSchema, 'confirmPackageOutput'),
    bulkCancelPackagesInput: zodToJsonSchema(edeliveryBodyInputSchema, 'bulkCancelPackagesInput'),
    bulkCancelPackagesOutput: zodToJsonSchema(
      generatedEDeliveryResponseSchema,
      'bulkCancelPackagesOutput',
    ),
    bulkConfirmPackagesInput: zodToJsonSchema(edeliveryBodyInputSchema, 'bulkConfirmPackagesInput'),
    bulkConfirmPackagesOutput: zodToJsonSchema(
      generatedEDeliveryResponseSchema,
      'bulkConfirmPackagesOutput',
    ),
    bulkDeletePackagesInput: zodToJsonSchema(edeliveryBodyInputSchema, 'bulkDeletePackagesInput'),
    bulkDeletePackagesOutput: zodToJsonSchema(
      generatedEDeliveryResponseSchema,
      'bulkDeletePackagesOutput',
    ),
    getLabelsInput: zodToJsonSchema(getLabelsInputSchema, 'getLabelsInput'),
    getLabelsOutput: zodToJsonSchema(generatedEDeliveryResponseSchema, 'getLabelsOutput'),
    getHandoverSheetInput: zodToJsonSchema(getHandoverSheetInputSchema, 'getHandoverSheetInput'),
    getHandoverSheetOutput: zodToJsonSchema(
      generatedEDeliveryResponseSchema,
      'getHandoverSheetOutput',
    ),
    getTrackingInput: zodToJsonSchema(getTrackingInputSchema, 'getTrackingInput'),
    getTrackingOutput: zodToJsonSchema(generatedEDeliveryResponseSchema, 'getTrackingOutput'),
    createComplaintInput: zodToJsonSchema(edeliveryBodyInputSchema, 'createComplaintInput'),
    createComplaintOutput: zodToJsonSchema(emptyResponseSchema, 'createComplaintOutput'),

    // Common Types
    error: zodToJsonSchema(errorSchema, 'error'),
    errorParameter: zodToJsonSchema(errorParameterSchema, 'errorParameter'),
    address: zodToJsonSchema(addressSchema, 'address'),
    contact: zodToJsonSchema(contactSchema, 'contact'),
    dimensions: zodToJsonSchema(dimensionsSchema, 'dimensions'),
    weight: zodToJsonSchema(weightSchema, 'weight'),
    pageMetadata: zodToJsonSchema(pageMetadataSchema, 'pageMetadata'),
  };
};
