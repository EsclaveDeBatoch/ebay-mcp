import { describe, expect, it } from 'vitest';

import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import {
  bulkCancelPackages,
  bulkCancelPackagesArgumentsSchema,
  bulkConfirmPackages,
  bulkDeletePackages,
  cancelPackage,
  clonePackage,
  confirmPackage,
  createPackage,
  createPackageArgumentsSchema,
  deletePackage,
  getPackage,
  getPackagesByLineItemId,
  lineItemIdArgumentsSchema,
  packageIdArgumentsSchema,
} from './shipmentPackage.js';

const packageSubmission = {
  packageInfo: {
    consignPreferenceId: 'CONSIGN123',
    incoterm: 'DDP' as const,
    items: [
      {
        orderLineItem: 'ORDER-LINE-123',
        postedQuantity: 1,
        sku: {
          nameEn: 'Camera lens',
          price: { currency: 'USD', value: '75.00' },
          weight: 250,
        },
      },
    ],
    shippingServiceId: 'SERVICE123',
  },
};

describe('Sell eDelivery package arguments', () => {
  it('accepts direct generated documents and exact path fields', () => {
    const packageLookup = { package_id: 'PACKAGE123' };
    const lineItemLookup = { order_line_item_id: 'ORDER-LINE-123' };
    const bulkCancellation = { requests: { packageIds: ['P1', 'P2'] } };

    expect(createPackageArgumentsSchema.parse(packageSubmission)).toEqual(packageSubmission);
    expect(packageIdArgumentsSchema.parse(packageLookup)).toEqual(packageLookup);
    expect(lineItemIdArgumentsSchema.parse(lineItemLookup)).toEqual(lineItemLookup);
    expect(bulkCancelPackagesArgumentsSchema.parse(bulkCancellation)).toEqual(bulkCancellation);
  });

  it.each([
    { body: packageSubmission },
    { packageInfo: { items: [{}] } },
    { packageInfo: { items: [{ listingId: 'LISTING123' }] } },
    { packageInfo: { items: [{ transactionId: 'TRANSACTION123' }] } },
    { packageInfo: { incoterm: 'CIF' } },
    { packageId: 'PACKAGE123' },
    { requests: { packageIds: [] } },
  ])('rejects wrappers, renamed fields, and incomplete business selectors', (invalidPackage) => {
    const acceptedAsCreation = createPackageArgumentsSchema.safeParse(invalidPackage);
    const acceptedAsLookup = packageIdArgumentsSchema.safeParse(invalidPackage);
    const acceptedAsBulkCancellation = bulkCancelPackagesArgumentsSchema.safeParse(invalidPackage);
    expect(acceptedAsCreation.success).toBe(false);
    expect(acceptedAsLookup.success).toBe(false);
    expect(acceptedAsBulkCancellation.success).toBe(false);
  });
});

describe('Sell eDelivery package operations', () => {
  it('uses all official package paths and never invents a document wrapper', async () => {
    const packageLookup = { package_id: 'PACKAGE/123' };
    const lineItemLookup = { order_line_item_id: 'ORDER/LINE/123' };
    const bulkCancellation = { requests: { packageIds: ['P1'] } };
    const bulkConfirmation = { requests: { packageIds: ['P2'] } };
    const bulkDeletion = { requests: { packageIds: ['P3'] } };
    const { sellerSession, deleteCalls, getCalls, postCalls } = sellerSessionReturning({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await createPackage(sellerSession, packageSubmission);
    await getPackage(sellerSession, packageLookup);
    await deletePackage(sellerSession, packageLookup);
    await getPackagesByLineItemId(sellerSession, lineItemLookup);
    await cancelPackage(sellerSession, packageLookup);
    await clonePackage(sellerSession, packageLookup);
    await confirmPackage(sellerSession, packageLookup);
    await bulkCancelPackages(sellerSession, bulkCancellation);
    await bulkConfirmPackages(sellerSession, bulkConfirmation);
    await bulkDeletePackages(sellerSession, bulkDeletion);

    expect(getCalls).toEqual([
      { endpoint: '/sell/edelivery_international_shipping/v1/package/PACKAGE%2F123' },
      {
        endpoint: '/sell/edelivery_international_shipping/v1/package/ORDER%2FLINE%2F123/item',
      },
    ]);
    expect(deleteCalls).toEqual([
      { endpoint: '/sell/edelivery_international_shipping/v1/package/PACKAGE%2F123' },
    ]);
    expect(postCalls).toEqual([
      {
        endpoint: '/sell/edelivery_international_shipping/v1/package',
        requestDocument: packageSubmission,
      },
      {
        endpoint: '/sell/edelivery_international_shipping/v1/package/PACKAGE%2F123/cancel',
      },
      {
        endpoint: '/sell/edelivery_international_shipping/v1/package/PACKAGE%2F123/clone',
      },
      {
        endpoint: '/sell/edelivery_international_shipping/v1/package/PACKAGE%2F123/confirm',
      },
      {
        endpoint: '/sell/edelivery_international_shipping/v1/package/bulk_cancel_packages',
        requestDocument: bulkCancellation,
      },
      {
        endpoint: '/sell/edelivery_international_shipping/v1/package/bulk_confirm_packages',
        requestDocument: bulkConfirmation,
      },
      {
        endpoint: '/sell/edelivery_international_shipping/v1/package/bulk_delete_packages',
        requestDocument: bulkDeletion,
      },
    ]);
  });
});
