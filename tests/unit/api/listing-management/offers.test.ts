import { Effect } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EbayApiClient } from '@/api/client.js';
import { createInventoryOffersMethods } from '@/api/listing-management/offers.js';
import type { EbayApiError, EndpointInputError } from '@/api/shared/request.js';
import { invalidInput } from '@tests/helpers/invalidInput.js';

type GetOffersFailure = EbayApiError | EndpointInputError;

const expectSkuInputError = async (
  program: Effect.Effect<unknown, GetOffersFailure>,
): Promise<void> => {
  const error = await Effect.runPromise(Effect.flip(program));

  expect(error).toMatchObject({ _tag: 'EndpointInputError', parameter: 'sku' });
};

describe('createInventoryOffersMethods getOffers', () => {
  let client: EbayApiClient;
  let getOffers: ReturnType<typeof createInventoryOffersMethods>['getOffers'];

  beforeEach(() => {
    client = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    } as unknown as EbayApiClient;
    ({ getOffers } = createInventoryOffersMethods(client));
  });

  it('sends the required SKU with compatible optional query parameters', async () => {
    const response = { offers: [] };
    vi.mocked(client.get).mockResolvedValue(response);

    const result = await Effect.runPromise(
      getOffers({
        sku: 'SKU-1',
        format: 'FIXED_PRICE',
        marketplaceId: 'EBAY_US',
        limit: 10,
        offset: 5,
      }),
    );

    expect(client.get).toHaveBeenCalledWith('/sell/inventory/v1/offer', {
      format: 'FIXED_PRICE',
      limit: '10',
      marketplace_id: 'EBAY_US',
      offset: '5',
      sku: 'SKU-1',
    });
    expect(result).toBe(response);
  });

  it('rejects omitted and empty SKUs before calling eBay', async () => {
    await expectSkuInputError(getOffers(invalidInput({})));
    await expectSkuInputError(getOffers({ sku: '' }));

    expect(client.get).not.toHaveBeenCalled();
  });
});
