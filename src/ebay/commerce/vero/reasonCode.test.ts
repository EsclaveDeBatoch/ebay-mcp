import { describe, expect, it } from 'vitest';

import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import {
  getVeroReasonCode,
  getVeroReasonCodeArgumentsSchema,
  getVeroReasonCodes,
  getVeroReasonCodesArgumentsSchema,
} from './reasonCode.js';

describe('Commerce VeRO reason-code arguments', () => {
  it('uses the official reason-code path field', () => {
    const reasonCodeLookup = { vero_reason_code_id: 'CODE123' };

    expect(getVeroReasonCodeArgumentsSchema.parse(reasonCodeLookup)).toEqual(reasonCodeLookup);
    expect(
      getVeroReasonCodeArgumentsSchema.safeParse({ veroReasonCodeId: 'CODE123' }).success,
    ).toBe(false);
  });

  it('uses the official optional marketplace header and rejects aliases', () => {
    const marketplaceSelection = { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' };

    expect(getVeroReasonCodesArgumentsSchema.parse(marketplaceSelection)).toEqual(
      marketplaceSelection,
    );
    expect(getVeroReasonCodesArgumentsSchema.safeParse({ marketplaceId: 'EBAY_US' }).success).toBe(
      false,
    );
  });
});

describe('Commerce VeRO reason-code operations', () => {
  it('encodes the reason-code ID and returns eBay completion unchanged', async () => {
    const reasonCode = {
      marketplaceId: 'EBAY_US',
      reasonCodeDetails: { veroReasonCodeId: 'CODE/123' },
    };
    const { sellerSession, getCalls } = sellerSessionReturning({
      kind: 'ebayRequestSucceeded',
      ebayDocument: reasonCode,
    });

    await expect(
      getVeroReasonCode(sellerSession, { vero_reason_code_id: 'CODE/123' }),
    ).resolves.toEqual({ kind: 'ebayRequestSucceeded', ebayDocument: reasonCode });
    expect(getCalls).toEqual([{ endpoint: '/commerce/vero/v1/vero_reason_code/CODE%2F123' }]);
  });

  it('sends the marketplace selection as a header', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { veroReasonCodes: [] },
    });

    await getVeroReasonCodes(sellerSession, { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE' });

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/vero/v1/vero_reason_code',
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_DE' },
      },
    ]);
  });

  it('omits request headers when no marketplace is selected', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { veroReasonCodes: [] },
    });

    await getVeroReasonCodes(sellerSession);

    expect(getCalls).toEqual([{ endpoint: '/commerce/vero/v1/vero_reason_code' }]);
  });
});
