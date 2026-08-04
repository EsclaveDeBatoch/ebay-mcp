import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type {
  components,
  operations,
} from '@/generated/ebay/sell-apps/listing-management/sellInventoryV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';
import { mapLocationsToTable } from '@/tools/ui/maps.js';

const merchantLocationKeySchema = z.string().min(1).max(36);
const pageSizeSchema = z.string().regex(/^[1-9]\d*$/, 'limit must be a positive integer string');
const pageOffsetSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)$/, 'offset must be a non-negative integer string');
const dayOfWeekSchema = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);
const locationTypeSchema = z.enum(['STORE', 'WAREHOUSE', 'FULFILLMENT_CENTER']);
const merchantLocationStatusSchema = z.enum(['ENABLED', 'DISABLED']);
const clockTimeSchema = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/, 'time must use HH:mm:ss');
const cutOffTimeSchema = z
  .string()
  .regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, 'cut-off time must use HH:mm');

const operatingIntervalSchema = z
  .object({
    close: clockTimeSchema,
    open: clockTimeSchema,
  })
  .strict();

const operatingHoursSchema = z
  .object({
    dayOfWeekEnum: dayOfWeekSchema,
    intervals: z.array(operatingIntervalSchema).min(1),
  })
  .strict();

const specialHoursSchema = z
  .object({
    date: z.iso.datetime(),
    intervals: z.array(operatingIntervalSchema),
  })
  .strict();

const geoCoordinatesSchema = z
  .object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  })
  .strict();

const addressSchema = z
  .object({
    addressLine1: z.string().min(1).max(128).optional(),
    addressLine2: z.string().min(1).max(128).optional(),
    city: z.string().min(1).max(128).optional(),
    country: z.string().length(2).optional(),
    county: z.string().min(1).optional(),
    postalCode: z.string().min(1).max(16).optional(),
    stateOrProvince: z.string().min(1).max(128).optional(),
  })
  .strict();

const locationDetailsSchema = z
  .object({
    address: addressSchema.optional(),
    geoCoordinates: geoCoordinatesSchema.optional(),
  })
  .strict()
  .refine((locationDetails) => Object.keys(locationDetails).length > 0, {
    message: 'Location details require an address or geographic coordinates',
  });

const cutOffOverrideSchema = z
  .object({
    cutOffTime: cutOffTimeSchema,
    endDate: z.iso.date(),
    startDate: z.iso.date(),
  })
  .strict();

const weeklyCutOffSchema = z
  .object({
    cutOffTime: cutOffTimeSchema,
    dayOfWeekEnum: z.array(dayOfWeekSchema).min(1),
  })
  .strict();

const fulfillmentCenterSpecificationsSchema = z
  .object({
    sameDayShippingCutOffTimes: z
      .object({
        overrides: z.array(cutOffOverrideSchema).optional(),
        weeklySchedule: z.array(weeklyCutOffSchema).min(1),
      })
      .strict(),
  })
  .strict();

const inventoryLocationSharedFields = {
  fulfillmentCenterSpecifications: fulfillmentCenterSpecificationsSchema.optional(),
  location: locationDetailsSchema.optional(),
  locationAdditionalInformation: z.string().max(256).optional(),
  locationInstructions: z.string().max(1000).optional(),
  locationTypes: z.array(locationTypeSchema).min(1).optional(),
  locationWebUrl: z.url().max(512).optional(),
  name: z.string().min(1).max(1000).optional(),
  operatingHours: z.array(operatingHoursSchema).optional(),
  phone: z.string().max(36).optional(),
  specialHours: z.array(specialHoursSchema).optional(),
  timeZoneId: z.string().min(1).optional(),
} as const;

type InventoryAddress = z.infer<typeof addressSchema>;

function hasFullStreetAddress(inventoryAddress: InventoryAddress): boolean {
  return (
    inventoryAddress.addressLine1 !== undefined &&
    inventoryAddress.city !== undefined &&
    inventoryAddress.country !== undefined &&
    inventoryAddress.postalCode !== undefined &&
    inventoryAddress.stateOrProvince !== undefined
  );
}

function hasWarehouseAddress(inventoryAddress: InventoryAddress): boolean {
  if (inventoryAddress.country === undefined) {
    return false;
  }
  if (inventoryAddress.postalCode !== undefined) {
    return true;
  }
  return inventoryAddress.city !== undefined && inventoryAddress.stateOrProvince !== undefined;
}

function requiresFullStreetAddress(locationTypes: readonly string[] | undefined): boolean {
  if (locationTypes === undefined) {
    return false;
  }
  if (locationTypes.includes('STORE')) {
    return true;
  }
  return locationTypes.includes('FULFILLMENT_CENTER');
}

function validatesInventoryLocationCreation(
  inventoryLocationCreation: {
    fulfillmentCenterSpecifications?: z.infer<typeof fulfillmentCenterSpecificationsSchema>;
    location: z.infer<typeof locationDetailsSchema>;
    locationTypes?: z.infer<typeof locationTypeSchema>[];
  },
  refinement: z.RefinementCtx,
): void {
  const inventoryAddress = inventoryLocationCreation.location.address;
  if (inventoryAddress === undefined) {
    refinement.addIssue({
      code: 'custom',
      message: 'Inventory location creation requires an address',
      path: ['location', 'address'],
    });
    return;
  }
  if (
    requiresFullStreetAddress(inventoryLocationCreation.locationTypes) &&
    !hasFullStreetAddress(inventoryAddress)
  ) {
    refinement.addIssue({
      code: 'custom',
      message: 'Store and fulfillment-center locations require a full street address',
      path: ['location', 'address'],
    });
  }
  if (
    !requiresFullStreetAddress(inventoryLocationCreation.locationTypes) &&
    !hasWarehouseAddress(inventoryAddress)
  ) {
    refinement.addIssue({
      code: 'custom',
      message: 'Warehouse locations require country plus postal code or city and state',
      path: ['location', 'address'],
    });
  }
  if (inventoryLocationCreation.locationTypes === undefined) {
    return;
  }
  if (!inventoryLocationCreation.locationTypes.includes('FULFILLMENT_CENTER')) {
    return;
  }
  if (inventoryLocationCreation.fulfillmentCenterSpecifications !== undefined) {
    return;
  }
  refinement.addIssue({
    code: 'custom',
    message: 'Fulfillment centers require shipping cut-off specifications',
    path: ['fulfillmentCenterSpecifications'],
  });
}

/** Exact eBay string pagination fields for inventory locations. */
export const inventoryLocationPageArgumentsSchema = z
  .object({
    limit: pageSizeSchema.optional(),
    offset: pageOffsetSchema.optional(),
  })
  .strict();

/** Exact eBay merchant location key path. */
export const inventoryLocationKeyArgumentsSchema = z
  .object({
    merchantLocationKey: merchantLocationKeySchema,
  })
  .strict();

/** Exact path and direct InventoryLocationFull fields accepted by eBay. */
export const createInventoryLocationArgumentsSchema = z
  .object({
    merchantLocationKey: merchantLocationKeySchema,
    ...inventoryLocationSharedFields,
    location: locationDetailsSchema,
    merchantLocationStatus: merchantLocationStatusSchema.optional(),
  })
  .strict()
  .superRefine(validatesInventoryLocationCreation);

/** Exact path and direct InventoryLocation fields accepted by eBay updates. */
export const updateInventoryLocationArgumentsSchema = z
  .object({
    merchantLocationKey: merchantLocationKeySchema,
    ...inventoryLocationSharedFields,
  })
  .strict()
  .refine((inventoryLocationChange) => Object.keys(inventoryLocationChange).length > 1, {
    message: 'An inventory location update requires at least one changed field',
  });

/** Validated exact eBay pagination for inventory locations. */
export type InventoryLocationPageArguments = z.infer<typeof inventoryLocationPageArgumentsSchema>;

/** Validated exact merchant location key path. */
export type InventoryLocationKeyArguments = z.infer<typeof inventoryLocationKeyArgumentsSchema>;

/** Validated direct location creation accepted by createInventoryLocation. */
export type CreateInventoryLocationArguments = z.infer<
  typeof createInventoryLocationArgumentsSchema
>;

/** Validated direct location change accepted by updateInventoryLocation. */
export type UpdateInventoryLocationArguments = z.infer<
  typeof updateInventoryLocationArgumentsSchema
>;

/** @see https://developer.ebay.com/api-docs/sell/inventory/types/api:InventoryLocationResponse */
export type InventoryLocation = components['schemas']['InventoryLocationResponse'];

/** @see https://developer.ebay.com/api-docs/sell/inventory/types/api:LocationResponse */
export type InventoryLocationCollection = components['schemas']['LocationResponse'];

/** @see https://developer.ebay.com/api-docs/sell/inventory/resources/location/methods/disableInventoryLocation */
export type InventoryLocationStatusCompletion =
  operations['disableInventoryLocation']['responses'][200]['content']['application/json'];

const inventoryLocationEndpoint = (merchantLocationKey: string): string =>
  `/sell/inventory/v1/location/${encodeURIComponent(merchantLocationKey)}`;

/**
 * Retrieves the seller's paginated inventory locations.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param inventoryLocationPage - Exact eBay string pagination.
 * @returns Explicit completion containing eBay's unchanged location collection.
 * @example `await getInventoryLocations(sellerSession, { limit: '20', offset: '0' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/location/methods/getInventoryLocations
 */
export const getInventoryLocations = (
  sellerSession: EbaySellerSession,
  inventoryLocationPage: InventoryLocationPageArguments = {},
): Promise<EbayRequestCompletion<InventoryLocationCollection>> =>
  sellerSession.get<InventoryLocationCollection>({
    endpoint: '/sell/inventory/v1/location',
    searchParameters: inventoryLocationPage,
  });

/**
 * Retrieves one seller-defined inventory location.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param inventoryLocationSelection - Exact merchant location key path.
 * @returns Explicit completion containing eBay's unchanged inventory location.
 * @example `await getInventoryLocation(sellerSession, { merchantLocationKey: 'WAREHOUSE-1' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/location/methods/getInventoryLocation
 */
export const getInventoryLocation = (
  sellerSession: EbaySellerSession,
  inventoryLocationSelection: InventoryLocationKeyArguments,
): Promise<EbayRequestCompletion<InventoryLocation>> =>
  sellerSession.get<InventoryLocation>({
    endpoint: inventoryLocationEndpoint(inventoryLocationSelection.merchantLocationKey),
  });

/**
 * Creates one seller-defined inventory location.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param inventoryLocationCreation - Exact key and direct InventoryLocationFull document.
 * @returns Explicit completion after eBay creates the location.
 * @example `await createInventoryLocation(sellerSession, { merchantLocationKey: 'WAREHOUSE-1', location: { address: { country: 'US', postalCode: '94107' } } })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/location/methods/createInventoryLocation
 */
export const createInventoryLocation = (
  sellerSession: EbaySellerSession,
  inventoryLocationCreation: CreateInventoryLocationArguments,
): Promise<EbayRequestCompletion<undefined>> => {
  const { merchantLocationKey, ...inventoryLocationDocument } = inventoryLocationCreation;

  return sellerSession.post<undefined>({
    endpoint: inventoryLocationEndpoint(merchantLocationKey),
    requestDocument: inventoryLocationDocument,
  });
};

/**
 * Deletes one warehouse or store inventory location.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param inventoryLocationSelection - Exact merchant location key path.
 * @returns Explicit completion after eBay deletes the location.
 * @example `await deleteInventoryLocation(sellerSession, { merchantLocationKey: 'WAREHOUSE-1' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/location/methods/deleteInventoryLocation
 */
export const deleteInventoryLocation = (
  sellerSession: EbaySellerSession,
  inventoryLocationSelection: InventoryLocationKeyArguments,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.delete<undefined>({
    endpoint: inventoryLocationEndpoint(inventoryLocationSelection.merchantLocationKey),
  });

/**
 * Disables one inventory location without sending a request document.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param inventoryLocationSelection - Exact merchant location key path.
 * @returns Explicit completion containing eBay's status acknowledgement.
 * @example `await disableInventoryLocation(sellerSession, { merchantLocationKey: 'WAREHOUSE-1' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/location/methods/disableInventoryLocation
 */
export const disableInventoryLocation = (
  sellerSession: EbaySellerSession,
  inventoryLocationSelection: InventoryLocationKeyArguments,
): Promise<EbayRequestCompletion<InventoryLocationStatusCompletion>> =>
  sellerSession.post<InventoryLocationStatusCompletion>({
    endpoint: `${inventoryLocationEndpoint(inventoryLocationSelection.merchantLocationKey)}/disable`,
  });

/**
 * Enables one disabled inventory location without sending a request document.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param inventoryLocationSelection - Exact merchant location key path.
 * @returns Explicit completion containing eBay's status acknowledgement.
 * @example `await enableInventoryLocation(sellerSession, { merchantLocationKey: 'WAREHOUSE-1' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/location/methods/enableInventoryLocation
 */
export const enableInventoryLocation = (
  sellerSession: EbaySellerSession,
  inventoryLocationSelection: InventoryLocationKeyArguments,
): Promise<EbayRequestCompletion<InventoryLocationStatusCompletion>> =>
  sellerSession.post<InventoryLocationStatusCompletion>({
    endpoint: `${inventoryLocationEndpoint(inventoryLocationSelection.merchantLocationKey)}/enable`,
  });

/**
 * Updates selected details of one inventory location.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param inventoryLocationChange - Exact key and direct InventoryLocation fields to change.
 * @returns Explicit completion after eBay applies the changes.
 * @example `await updateInventoryLocation(sellerSession, { merchantLocationKey: 'WAREHOUSE-1', name: 'West warehouse' })`
 * @see https://developer.ebay.com/api-docs/sell/inventory/resources/location/methods/updateInventoryLocation
 */
export const updateInventoryLocation = (
  sellerSession: EbaySellerSession,
  inventoryLocationChange: UpdateInventoryLocationArguments,
): Promise<EbayRequestCompletion<undefined>> => {
  const { merchantLocationKey, ...inventoryLocationDocument } = inventoryLocationChange;

  return sellerSession.post<undefined>({
    endpoint: `${inventoryLocationEndpoint(merchantLocationKey)}/update_location_details`,
    requestDocument: inventoryLocationDocument,
  });
};

/** MCP definition for Inventory API getInventoryLocations. */
export const getInventoryLocationsTool = defineTool({
  name: 'ebay_sell_inventory_get_inventory_locations',
  namespace: 'sell.inventory',
  description: 'Retrieve seller inventory locations with exact eBay pagination',
  argumentsSchema: inventoryLocationPageArgumentsSchema,
  operationKind: 'read',
  operation: getInventoryLocations,
  presentation: { archetype: 'table', project: mapLocationsToTable },
});

/** MCP definition for Inventory API getInventoryLocation. */
export const getInventoryLocationTool = defineTool({
  name: 'ebay_sell_inventory_get_inventory_location',
  namespace: 'sell.inventory',
  description: 'Retrieve one seller-defined eBay inventory location',
  argumentsSchema: inventoryLocationKeyArgumentsSchema,
  operationKind: 'read',
  operation: getInventoryLocation,
});

/** MCP definition for Inventory API createInventoryLocation. */
export const createInventoryLocationTool = defineTool({
  name: 'ebay_sell_inventory_create_inventory_location',
  namespace: 'sell.inventory',
  description: 'Create one eBay warehouse, store, or fulfillment-center location',
  argumentsSchema: createInventoryLocationArgumentsSchema,
  operationKind: 'write',
  operation: createInventoryLocation,
});

/** MCP definition for Inventory API deleteInventoryLocation. */
export const deleteInventoryLocationTool = defineTool({
  name: 'ebay_sell_inventory_delete_inventory_location',
  namespace: 'sell.inventory',
  description: 'Delete one eBay warehouse or store inventory location',
  argumentsSchema: inventoryLocationKeyArgumentsSchema,
  operationKind: 'write',
  operation: deleteInventoryLocation,
});

/** MCP definition for Inventory API disableInventoryLocation. */
export const disableInventoryLocationTool = defineTool({
  name: 'ebay_sell_inventory_disable_inventory_location',
  namespace: 'sell.inventory',
  description: 'Disable one eBay inventory location',
  argumentsSchema: inventoryLocationKeyArgumentsSchema,
  operationKind: 'write',
  operation: disableInventoryLocation,
});

/** MCP definition for Inventory API enableInventoryLocation. */
export const enableInventoryLocationTool = defineTool({
  name: 'ebay_sell_inventory_enable_inventory_location',
  namespace: 'sell.inventory',
  description: 'Enable one disabled eBay inventory location',
  argumentsSchema: inventoryLocationKeyArgumentsSchema,
  operationKind: 'write',
  operation: enableInventoryLocation,
});

/** MCP definition for Inventory API updateInventoryLocation. */
export const updateInventoryLocationTool = defineTool({
  name: 'ebay_sell_inventory_update_inventory_location',
  namespace: 'sell.inventory',
  description: 'Update selected details of one eBay inventory location',
  argumentsSchema: updateInventoryLocationArgumentsSchema,
  operationKind: 'write',
  operation: updateInventoryLocation,
});
