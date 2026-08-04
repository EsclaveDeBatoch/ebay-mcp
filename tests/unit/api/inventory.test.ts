import { Effect } from 'effect';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createInventoryApi, type InventoryApi } from '@/api/listing-management/inventory.js';
import type { EbayApiClient } from '@/api/client.js';

describe('InventoryApi', () => {
  let client: EbayApiClient;
  let api: InventoryApi;

  beforeEach(() => {
    client = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as EbayApiClient;
    api = createInventoryApi(client);
  });

  describe('offers', () => {
    it('gets offers with generated query parameter names', async () => {
      vi.mocked(client.get).mockResolvedValue({ offers: [] });

      await Effect.runPromise(
        api.getOffers({
          format: 'FIXED_PRICE',
          limit: 25,
          marketplaceId: 'EBAY_US',
          offset: 50,
          sku: 'SKU-1',
        }),
      );

      expect(client.get).toHaveBeenCalledWith('/sell/inventory/v1/offer', {
        format: 'FIXED_PRICE',
        limit: '25',
        marketplace_id: 'EBAY_US',
        offset: '50',
        sku: 'SKU-1',
      });
    });

    it('creates, gets, updates, and deletes offers', async () => {
      // sku, marketplaceId, and format are set at creation and are not accepted on update.
      const createBody = {
        sku: 'SKU-1',
        marketplaceId: 'EBAY_US',
        format: 'FIXED_PRICE',
      };
      const updateBody = { availableQuantity: 5 };
      vi.mocked(client.post).mockResolvedValue({ offerId: 'OFFER-1' });
      vi.mocked(client.get).mockResolvedValue({ offerId: 'OFFER-1' });
      vi.mocked(client.put).mockResolvedValue({ offerId: 'OFFER-1' });
      vi.mocked(client.delete).mockResolvedValue(undefined);

      await Effect.runPromise(api.createOffer({ body: createBody }));
      await Effect.runPromise(api.getOffer({ offerId: 'OFFER-1' }));
      await Effect.runPromise(api.updateOffer({ offerId: 'OFFER-1', body: updateBody }));
      await Effect.runPromise(api.deleteOffer({ offerId: 'OFFER-1' }));

      expect(client.post).toHaveBeenCalledWith('/sell/inventory/v1/offer', createBody);
      expect(client.get).toHaveBeenCalledWith('/sell/inventory/v1/offer/OFFER-1');
      expect(client.put).toHaveBeenCalledWith('/sell/inventory/v1/offer/OFFER-1', updateBody);
      expect(client.delete).toHaveBeenCalledWith('/sell/inventory/v1/offer/OFFER-1');
    });

    it('publishes and withdraws offers without synthetic request bodies', async () => {
      vi.mocked(client.post).mockResolvedValue({ listingId: 'LISTING-1' });

      await Effect.runPromise(api.publishOffer({ offerId: 'OFFER-1' }));
      await Effect.runPromise(api.withdrawOffer({ offerId: 'OFFER-1' }));

      expect(client.post).toHaveBeenNthCalledWith(1, '/sell/inventory/v1/offer/OFFER-1/publish');
      expect(client.post).toHaveBeenNthCalledWith(2, '/sell/inventory/v1/offer/OFFER-1/withdraw');
    });

    it('posts offer bulk and fee request bodies', async () => {
      const bulkCreateBody = { requests: [{ sku: 'SKU-1' }] };
      const bulkPublishBody = { requests: [{ offerId: 'OFFER-1' }] };
      const feesBody = { offers: [{ offerId: 'OFFER-1' }] };
      vi.mocked(client.post).mockResolvedValue({ responses: [] });

      await Effect.runPromise(api.bulkCreateOffer({ body: bulkCreateBody }));
      await Effect.runPromise(api.bulkPublishOffer({ body: bulkPublishBody }));
      await Effect.runPromise(api.getListingFees({ body: feesBody }));

      expect(client.post).toHaveBeenNthCalledWith(
        1,
        '/sell/inventory/v1/bulk_create_offer',
        bulkCreateBody,
      );
      expect(client.post).toHaveBeenNthCalledWith(
        2,
        '/sell/inventory/v1/bulk_publish_offer',
        bulkPublishBody,
      );
      expect(client.post).toHaveBeenNthCalledWith(
        3,
        '/sell/inventory/v1/offer/get_listing_fees',
        feesBody,
      );
    });

    it('posts inventory item group offer request bodies', async () => {
      const body = { inventoryItemGroupKey: 'GROUP-1', marketplaceId: 'EBAY_US' };
      vi.mocked(client.post).mockResolvedValue({ listingId: 'LISTING-1' });

      await Effect.runPromise(api.publishOfferByInventoryItemGroup({ body }));
      await Effect.runPromise(api.withdrawOfferByInventoryItemGroup({ body }));

      expect(client.post).toHaveBeenNthCalledWith(
        1,
        '/sell/inventory/v1/offer/publish_by_inventory_item_group',
        body,
      );
      expect(client.post).toHaveBeenNthCalledWith(
        2,
        '/sell/inventory/v1/offer/withdraw_by_inventory_item_group',
        body,
      );
    });
  });
});
