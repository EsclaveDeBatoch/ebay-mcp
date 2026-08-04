import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/other-apis/sellEdeliveryInternationalShippingOas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const monetaryAmountSchema = z
  .object({
    currency: z.string().regex(/^[A-Z]{3}$/, 'currency must be an uppercase ISO 4217 code'),
    value: z.string().regex(/^\d+(?:\.\d+)?$/, 'value must be a non-negative decimal'),
  })
  .strict();

const authorizedRepresentativeSchema = z
  .object({
    agentAddress: z.string().min(1).optional(),
    agentName: z.string().min(1).optional(),
    agentPhone: z.string().min(1).optional(),
  })
  .strict();

const forwardDeploymentSkuSchema = z
  .object({
    quantity: z.number().int().positive().optional(),
    skuId: z.string().min(1).optional(),
  })
  .strict();

const skuDetailsSchema = z
  .object({
    elecQualificationId: z.string().min(1).optional(),
    fdcSkus: z.array(forwardDeploymentSkuSchema).min(1).optional(),
    height: z.number().positive().optional(),
    isLiBattery: z.boolean().optional(),
    length: z.number().positive().optional(),
    liBatteryType: z.string().min(1).optional(),
    nameEn: z.string().min(1).optional(),
    nameZh: z.string().min(1).optional(),
    origin: z.string().min(1).optional(),
    price: monetaryAmountSchema.optional(),
    remark: z.string().min(1).optional(),
    skuNumber: z.string().min(1).optional(),
    tariffCode: z.string().min(1).optional(),
    weight: z.number().positive().optional(),
    width: z.number().positive().optional(),
  })
  .strict();

const shippedLineItemSchema = z
  .object({
    buyerId: z.string().min(1).optional(),
    buyerTaxId: z.string().min(1).optional(),
    buyerTaxType: z.string().min(1).optional(),
    ebayCollectAndRemitTax: z.boolean().optional(),
    ebayCollectAndRemitTaxesValue: z.string().min(1).optional(),
    email: z.email().optional(),
    itemTitle: z.string().min(1).optional(),
    listingId: z.string().min(1).optional(),
    message: z.string().min(1).optional(),
    orderId: z.string().min(1).optional(),
    orderLineItem: z.string().min(1).optional(),
    paymentDate: z.iso.datetime({ offset: true }).optional(),
    payPalEmail: z.email().optional(),
    payPalMessage: z.string().min(1).optional(),
    postedQuantity: z.number().int().min(1).max(999).optional(),
    siteId: z.number().int().optional(),
    sku: skuDetailsSchema.optional(),
    soldDate: z.iso.datetime({ offset: true }).optional(),
    soldPrice: monetaryAmountSchema.optional(),
    soldQuantity: z.number().int().positive().optional(),
    transactionId: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((shippedLineItem, validation) => {
    if (shippedLineItem.orderLineItem !== undefined) {
      return;
    }
    if (shippedLineItem.listingId === undefined) {
      validation.addIssue({
        code: 'custom',
        message: 'listingId is required when orderLineItem is omitted',
        path: ['listingId'],
      });
    }
    if (shippedLineItem.transactionId === undefined) {
      validation.addIssue({
        code: 'custom',
        message: 'transactionId is required when orderLineItem is omitted',
        path: ['transactionId'],
      });
    }
  });

const shipToAddressSchema = z
  .object({
    city: z.string().min(1).optional(),
    company: z.string().min(1).optional(),
    contact: z.string().min(1).optional(),
    countryCode: z.string().length(2).optional(),
    countryName: z.string().min(1).optional(),
    district: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    postcode: z.string().min(1).optional(),
    province: z.string().min(1).optional(),
    street1: z.string().min(1).max(50).optional(),
    street2: z.string().min(1).max(50).optional(),
    street3: z.string().min(1).max(50).optional(),
  })
  .strict();

const specialServiceSchema = z
  .object({
    insuranceFee: z.string().min(1).optional(),
    packagingType: z.enum(['PAK', 'PACKAGE']).optional(),
    signatureType: z.enum(['ISR', 'DSR', 'ASR']).optional(),
    specialServiceTypes: z.array(z.string().min(1)).min(1).optional(),
  })
  .strict();

const packageDetailsSchema = z
  .object({
    agentInfoRequest: authorizedRepresentativeSchema.optional(),
    consignPreferenceId: z.string().min(1).optional(),
    incoterm: z.enum(['DDP', 'DDU']).optional(),
    items: z.array(shippedLineItemSchema).min(1).optional(),
    maxQuantityLimit: z.number().int().positive().optional(),
    packageComment: z.string().min(1).optional(),
    packageHeight: z.number().positive().optional(),
    packageLength: z.number().positive().optional(),
    packageWeight: z.number().positive().optional(),
    packageWidth: z.number().positive().optional(),
    shipFromAddressId: z.string().min(1).optional(),
    shippingServiceId: z.string().min(1).optional(),
    shipToAddress: shipToAddressSchema.optional(),
    specialServiceDetail: specialServiceSchema.optional(),
    valueForCarriage: z.string().min(1).optional(),
  })
  .strict();

const packageIdsSchema = z
  .object({
    packageIds: z.array(z.string().min(1)).min(1).max(200),
  })
  .strict();

/** Exact generated eBay document accepted by createPackage. */
export const createPackageArgumentsSchema = z
  .object({
    packageInfo: packageDetailsSchema,
  })
  .strict();

/** Exact eBay path field accepted by package-ID operations. */
export const packageIdArgumentsSchema = z
  .object({
    package_id: z.string().min(1),
  })
  .strict();

/** Exact eBay path field accepted by getPackagesByLineItemID. */
export const lineItemIdArgumentsSchema = z
  .object({
    order_line_item_id: z.string().min(1),
  })
  .strict();

/** Exact generated eBay document accepted by bulkCancelPackages. */
export const bulkCancelPackagesArgumentsSchema = z
  .object({
    requests: packageIdsSchema,
  })
  .strict();

/** Exact generated eBay document accepted by bulkConfirmPackages. */
export const bulkConfirmPackagesArgumentsSchema = z
  .object({
    requests: packageIdsSchema,
  })
  .strict();

/** Exact generated eBay document accepted by bulkDeletePackages. */
export const bulkDeletePackagesArgumentsSchema = z
  .object({
    requests: packageIdsSchema,
  })
  .strict();

export type PackageSubmission = z.infer<typeof createPackageArgumentsSchema>;
export type PackageLookup = z.infer<typeof packageIdArgumentsSchema>;
export type LineItemPackageLookup = z.infer<typeof lineItemIdArgumentsSchema>;
export type BulkPackageCancellation = z.infer<typeof bulkCancelPackagesArgumentsSchema>;
export type BulkPackageConfirmation = z.infer<typeof bulkConfirmPackagesArgumentsSchema>;
export type BulkPackageDeletion = z.infer<typeof bulkDeletePackagesArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/types/api:AddPackageResponses */
export type PackageCreation = components['schemas']['AddPackageResponses'];
/** @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/types/api:GetPackageDetailResponses */
export type PackageDetail = components['schemas']['GetPackageDetailResponses'];
/** @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/types/api:GetItemPackageIdResponses */
export type LineItemPackageCollection = components['schemas']['GetItemPackageIdResponses'];
/** @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/types/api:ClonePackageResponses */
export type PackageClone = components['schemas']['ClonePackageResponses'];
/** @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/types/api:CancelPackagesResponses */
export type BulkPackageCancellationConfirmation = components['schemas']['CancelPackagesResponses'];
/** @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/types/api:ConfirmPackagesResponses */
export type BulkPackageConfirmationReceipt = components['schemas']['ConfirmPackagesResponses'];
/** @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/types/api:DeletePackagesResponses */
export type BulkPackageDeletionConfirmation = components['schemas']['DeletePackagesResponses'];

/**
 * Creates one eDelivery shipment package.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param packageSubmission - Exact generated eBay package document.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await createPackage(sellerSession, { packageInfo: { shippingServiceId: 'S1' } })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/package/methods/createPackage
 */
export const createPackage = (
  sellerSession: EbaySellerSession,
  packageSubmission: PackageSubmission,
): Promise<EbayRequestCompletion<PackageCreation>> =>
  sellerSession.post<PackageCreation>({
    endpoint: '/sell/edelivery_international_shipping/v1/package',
    requestDocument: packageSubmission,
  });

/**
 * Retrieves one eDelivery package.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param packageLookup - Exact eBay package path field.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getPackage(sellerSession, { package_id: 'PACKAGE123' })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/package/methods/getPackage
 */
export const getPackage = (
  sellerSession: EbaySellerSession,
  packageLookup: PackageLookup,
): Promise<EbayRequestCompletion<PackageDetail>> =>
  sellerSession.get<PackageDetail>({
    endpoint: `/sell/edelivery_international_shipping/v1/package/${encodeURIComponent(packageLookup.package_id)}`,
  });

/**
 * Deletes one cancelled eDelivery package that has no tracking number.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param packageLookup - Exact eBay package path field.
 * @returns Explicit completion containing eBay's empty success document or failure.
 * @example `await deletePackage(sellerSession, { package_id: 'PACKAGE123' })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/package/methods/deletePackage
 */
export const deletePackage = (
  sellerSession: EbaySellerSession,
  packageLookup: PackageLookup,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.delete<undefined>({
    endpoint: `/sell/edelivery_international_shipping/v1/package/${encodeURIComponent(packageLookup.package_id)}`,
  });

/**
 * Retrieves eDelivery packages associated with one order line item.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param lineItemLookup - Exact eBay order-line-item path field.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await getPackagesByLineItemId(sellerSession, { order_line_item_id: 'LINE123' })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/package/methods/getPackagesByLineItemID
 */
export const getPackagesByLineItemId = (
  sellerSession: EbaySellerSession,
  lineItemLookup: LineItemPackageLookup,
): Promise<EbayRequestCompletion<LineItemPackageCollection>> =>
  sellerSession.get<LineItemPackageCollection>({
    endpoint: `/sell/edelivery_international_shipping/v1/package/${encodeURIComponent(lineItemLookup.order_line_item_id)}/item`,
  });

/**
 * Cancels one eDelivery package.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param packageLookup - Exact eBay package path field.
 * @returns Explicit completion containing eBay's empty success document or failure.
 * @example `await cancelPackage(sellerSession, { package_id: 'PACKAGE123' })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/package/methods/cancelPackage
 */
export const cancelPackage = (
  sellerSession: EbaySellerSession,
  packageLookup: PackageLookup,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.post<undefined>({
    endpoint: `/sell/edelivery_international_shipping/v1/package/${encodeURIComponent(packageLookup.package_id)}/cancel`,
  });

/**
 * Clones one eDelivery package into a new package.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param packageLookup - Exact eBay package path field.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await clonePackage(sellerSession, { package_id: 'PACKAGE123' })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/package/methods/clonePackage
 */
export const clonePackage = (
  sellerSession: EbaySellerSession,
  packageLookup: PackageLookup,
): Promise<EbayRequestCompletion<PackageClone>> =>
  sellerSession.post<PackageClone>({
    endpoint: `/sell/edelivery_international_shipping/v1/package/${encodeURIComponent(packageLookup.package_id)}/clone`,
  });

/**
 * Confirms one eDelivery package and submits its pickup request.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param packageLookup - Exact eBay package path field.
 * @returns Explicit completion containing eBay's empty success document or failure.
 * @example `await confirmPackage(sellerSession, { package_id: 'PACKAGE123' })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/package/methods/confirmPackage
 */
export const confirmPackage = (
  sellerSession: EbaySellerSession,
  packageLookup: PackageLookup,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.post<undefined>({
    endpoint: `/sell/edelivery_international_shipping/v1/package/${encodeURIComponent(packageLookup.package_id)}/confirm`,
  });

/**
 * Cancels up to 200 eDelivery packages in one call.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param packageCancellation - Exact generated eBay package-ID document.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await bulkCancelPackages(sellerSession, { requests: { packageIds: ['P1'] } })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/package/methods/bulkCancelPackages
 */
export const bulkCancelPackages = (
  sellerSession: EbaySellerSession,
  packageCancellation: BulkPackageCancellation,
): Promise<EbayRequestCompletion<BulkPackageCancellationConfirmation>> =>
  sellerSession.post<BulkPackageCancellationConfirmation>({
    endpoint: '/sell/edelivery_international_shipping/v1/package/bulk_cancel_packages',
    requestDocument: packageCancellation,
  });

/**
 * Confirms up to 200 eDelivery packages in one call.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param packageConfirmation - Exact generated eBay package-ID document.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await bulkConfirmPackages(sellerSession, { requests: { packageIds: ['P1'] } })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/package/methods/bulkConfirmPackages
 */
export const bulkConfirmPackages = (
  sellerSession: EbaySellerSession,
  packageConfirmation: BulkPackageConfirmation,
): Promise<EbayRequestCompletion<BulkPackageConfirmationReceipt>> =>
  sellerSession.post<BulkPackageConfirmationReceipt>({
    endpoint: '/sell/edelivery_international_shipping/v1/package/bulk_confirm_packages',
    requestDocument: packageConfirmation,
  });

/**
 * Deletes up to 200 cancelled eDelivery packages in one call.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param packageDeletion - Exact generated eBay package-ID document.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 * @example `await bulkDeletePackages(sellerSession, { requests: { packageIds: ['P1'] } })`
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/package/methods/bulkDeletePackages
 */
export const bulkDeletePackages = (
  sellerSession: EbaySellerSession,
  packageDeletion: BulkPackageDeletion,
): Promise<EbayRequestCompletion<BulkPackageDeletionConfirmation>> =>
  sellerSession.post<BulkPackageDeletionConfirmation>({
    endpoint: '/sell/edelivery_international_shipping/v1/package/bulk_delete_packages',
    requestDocument: packageDeletion,
  });

export const createPackageTool = defineTool({
  name: 'ebay_sell_edelivery_create_package',
  namespace: 'sell.edelivery',
  description: 'Create one eDelivery shipment package',
  argumentsSchema: createPackageArgumentsSchema,
  operationKind: 'write',
  operation: createPackage,
});

export const getPackageTool = defineTool({
  name: 'ebay_sell_edelivery_get_package',
  namespace: 'sell.edelivery',
  description: 'Retrieve one eDelivery shipment package',
  argumentsSchema: packageIdArgumentsSchema,
  operationKind: 'read',
  operation: getPackage,
});

export const deletePackageTool = defineTool({
  name: 'ebay_sell_edelivery_delete_package',
  namespace: 'sell.edelivery',
  description: 'Delete one cancelled eDelivery package without a tracking number',
  argumentsSchema: packageIdArgumentsSchema,
  operationKind: 'write',
  operation: deletePackage,
});

export const getPackagesByLineItemIdTool = defineTool({
  name: 'ebay_sell_edelivery_get_packages_by_line_item_id',
  namespace: 'sell.edelivery',
  description: 'Retrieve eDelivery packages for one eBay order line item',
  argumentsSchema: lineItemIdArgumentsSchema,
  operationKind: 'read',
  operation: getPackagesByLineItemId,
});

export const cancelPackageTool = defineTool({
  name: 'ebay_sell_edelivery_cancel_package',
  namespace: 'sell.edelivery',
  description: 'Cancel one eDelivery package',
  argumentsSchema: packageIdArgumentsSchema,
  operationKind: 'write',
  operation: cancelPackage,
});

export const clonePackageTool = defineTool({
  name: 'ebay_sell_edelivery_clone_package',
  namespace: 'sell.edelivery',
  description: 'Clone one eDelivery package',
  argumentsSchema: packageIdArgumentsSchema,
  operationKind: 'write',
  operation: clonePackage,
});

export const confirmPackageTool = defineTool({
  name: 'ebay_sell_edelivery_confirm_package',
  namespace: 'sell.edelivery',
  description: 'Confirm one eDelivery package for shipment',
  argumentsSchema: packageIdArgumentsSchema,
  operationKind: 'write',
  operation: confirmPackage,
});

export const bulkCancelPackagesTool = defineTool({
  name: 'ebay_sell_edelivery_bulk_cancel_packages',
  namespace: 'sell.edelivery',
  description: 'Cancel up to 200 eDelivery packages',
  argumentsSchema: bulkCancelPackagesArgumentsSchema,
  operationKind: 'write',
  operation: bulkCancelPackages,
});

export const bulkConfirmPackagesTool = defineTool({
  name: 'ebay_sell_edelivery_bulk_confirm_packages',
  namespace: 'sell.edelivery',
  description: 'Confirm up to 200 eDelivery packages for shipment',
  argumentsSchema: bulkConfirmPackagesArgumentsSchema,
  operationKind: 'write',
  operation: bulkConfirmPackages,
});

export const bulkDeletePackagesTool = defineTool({
  name: 'ebay_sell_edelivery_bulk_delete_packages',
  namespace: 'sell.edelivery',
  description: 'Delete up to 200 cancelled eDelivery packages',
  argumentsSchema: bulkDeletePackagesArgumentsSchema,
  operationKind: 'write',
  operation: bulkDeletePackages,
});
