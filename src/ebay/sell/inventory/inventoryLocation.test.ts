import { describe, expect, it } from 'vitest';

import {
  createInventoryLocation,
  createInventoryLocationArgumentsSchema,
  deleteInventoryLocation,
  disableInventoryLocation,
  enableInventoryLocation,
  getInventoryLocation,
  getInventoryLocations,
  inventoryLocationKeyArgumentsSchema,
  inventoryLocationPageArgumentsSchema,
  updateInventoryLocation,
  updateInventoryLocationArgumentsSchema,
} from '@/ebay/sell/inventory/inventoryLocation.js';
import type { CreateInventoryLocationArguments } from '@/ebay/sell/inventory/inventoryLocation.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

const warehouseCreation: CreateInventoryLocationArguments = {
  merchantLocationKey: 'WAREHOUSE-1',
  location: { address: { country: 'US', postalCode: '94107' } },
  locationTypes: ['WAREHOUSE'],
  name: 'West warehouse',
};

const fulfillmentCenterCreation: CreateInventoryLocationArguments = {
  merchantLocationKey: 'FULFILLMENT-1',
  fulfillmentCenterSpecifications: {
    sameDayShippingCutOffTimes: {
      weeklySchedule: [{ cutOffTime: '14:00', dayOfWeekEnum: ['MONDAY', 'TUESDAY'] }],
    },
  },
  location: {
    address: {
      addressLine1: '123 Main Street',
      city: 'San Jose',
      country: 'US',
      postalCode: '95113',
      stateOrProvince: 'CA',
    },
  },
  locationTypes: ['FULFILLMENT_CENTER'],
  name: 'West fulfillment center',
};

describe('Sell Inventory location schemas', () => {
  it('accepts exact string pagination, keys, direct warehouse creation, and direct updates', () => {
    expect(inventoryLocationPageArgumentsSchema.parse({ limit: '20', offset: '40' })).toEqual({
      limit: '20',
      offset: '40',
    });
    expect(
      inventoryLocationKeyArgumentsSchema.parse({ merchantLocationKey: 'WAREHOUSE-1' }),
    ).toEqual({ merchantLocationKey: 'WAREHOUSE-1' });
    expect(createInventoryLocationArgumentsSchema.parse(warehouseCreation)).toEqual(
      warehouseCreation,
    );
    expect(
      updateInventoryLocationArgumentsSchema.parse({
        merchantLocationKey: 'WAREHOUSE-1',
        name: 'Renamed warehouse',
      }),
    ).toEqual({ merchantLocationKey: 'WAREHOUSE-1', name: 'Renamed warehouse' });
  });

  it('accepts a complete fulfillment center with weekly shipping cut-offs', () => {
    expect(createInventoryLocationArgumentsSchema.parse(fulfillmentCenterCreation)).toEqual(
      fulfillmentCenterCreation,
    );
  });

  it.each([
    { limit: 20 },
    { limit: '0' },
    { offset: '-1' },
    { merchantLocationKey: '' },
    { merchantLocationKey: 'x'.repeat(37) },
    { merchant_location_key: 'WAREHOUSE-1' },
    {
      merchantLocationKey: 'WAREHOUSE-1',
      body: { location: { address: { country: 'US', postalCode: '94107' } } },
    },
    {
      merchantLocationKey: 'WAREHOUSE-1',
      'Content-Type': 'application/json',
      location: { address: { country: 'US', postalCode: '94107' } },
    },
    { merchantLocationKey: 'WAREHOUSE-1', name: 'Missing location' },
    {
      merchantLocationKey: 'WAREHOUSE-1',
      location: { address: { country: 'US' } },
      locationTypes: ['WAREHOUSE'],
    },
    {
      merchantLocationKey: 'STORE-1',
      location: { address: { country: 'US', postalCode: '94107' } },
      locationTypes: ['STORE'],
    },
    {
      merchantLocationKey: 'FULFILLMENT-1',
      location: fulfillmentCenterCreation.location,
      locationTypes: ['FULFILLMENT_CENTER'],
    },
    {
      merchantLocationKey: 'STORE-1',
      location: {
        address: fulfillmentCenterCreation.location.address,
        geoCoordinates: { latitude: 37.3382 },
      },
      locationTypes: ['STORE'],
    },
    {
      merchantLocationKey: 'STORE-1',
      location: { address: fulfillmentCenterCreation.location.address },
      locationTypes: ['STORE'],
      operatingHours: [{ dayOfWeekEnum: 'MONDAY', intervals: [{ open: '09:00:00' }] }],
    },
  ])('rejects aliases, wrappers, transport headers, and invalid creation rules', (invalidCall) => {
    expect(() => createInventoryLocationArgumentsSchema.parse(invalidCall)).toThrow();
  });

  it.each([
    { merchantLocationKey: 'WAREHOUSE-1' },
    { merchantLocationKey: 'WAREHOUSE-1', body: { name: 'Wrapped' } },
    {
      merchantLocationKey: 'WAREHOUSE-1',
      'Content-Type': 'application/json',
      name: 'Renamed warehouse',
    },
  ])('rejects empty, wrapped, and transport-owned update fields', (invalidUpdate) => {
    expect(() => updateInventoryLocationArgumentsSchema.parse(invalidUpdate)).toThrow();
  });
});

describe('Sell Inventory location operations', () => {
  it('uses exact list pagination and encoded keys for reads and deletes', async () => {
    const { sellerSession, getCalls, deleteCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getInventoryLocations(sellerSession, { limit: '20', offset: '40' });
    await getInventoryLocation(sellerSession, { merchantLocationKey: 'WAREHOUSE/1' });
    await deleteInventoryLocation(sellerSession, { merchantLocationKey: 'WAREHOUSE/1' });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/location',
        searchParameters: { limit: '20', offset: '40' },
      },
      { endpoint: '/sell/inventory/v1/location/WAREHOUSE%2F1' },
    ]);
    expect(deleteCalls).toEqual([{ endpoint: '/sell/inventory/v1/location/WAREHOUSE%2F1' }]);
  });

  it('posts direct create and update documents', async () => {
    const { sellerSession, postCalls } = sellerSessionReturning<undefined>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    await createInventoryLocation(sellerSession, warehouseCreation);
    await updateInventoryLocation(sellerSession, {
      merchantLocationKey: 'WAREHOUSE/1',
      name: 'Renamed warehouse',
      phone: '555-0100',
    });

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/inventory/v1/location/WAREHOUSE-1',
        requestDocument: {
          location: { address: { country: 'US', postalCode: '94107' } },
          locationTypes: ['WAREHOUSE'],
          name: 'West warehouse',
        },
      },
      {
        endpoint: '/sell/inventory/v1/location/WAREHOUSE%2F1/update_location_details',
        requestDocument: { name: 'Renamed warehouse', phone: '555-0100' },
      },
    ]);
  });

  it('enables and disables without invented request documents', async () => {
    const { sellerSession, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await disableInventoryLocation(sellerSession, { merchantLocationKey: 'WAREHOUSE/1' });
    await enableInventoryLocation(sellerSession, { merchantLocationKey: 'WAREHOUSE/1' });

    expect(postCalls).toEqual([
      { endpoint: '/sell/inventory/v1/location/WAREHOUSE%2F1/disable' },
      { endpoint: '/sell/inventory/v1/location/WAREHOUSE%2F1/enable' },
    ]);
  });
});
