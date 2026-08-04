import { describe, expect, it } from 'vitest';

import {
  getPaymentsProgram,
  getPaymentsProgramOnboarding,
  paymentsProgramArgumentsSchema,
} from '@/ebay/sell/account/paymentsProgram.js';
import { MarketplaceId } from '@/types/ebayEnums.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

describe('Sell Account deprecated payments-program schema', () => {
  it('accepts the exact official path fields', () => {
    const paymentsProgramSelection = {
      marketplace_id: 'EBAY_US',
      payments_program_type: 'EBAY_PAYMENTS',
    };

    expect(paymentsProgramArgumentsSchema.parse(paymentsProgramSelection)).toEqual(
      paymentsProgramSelection,
    );
  });

  it.each([
    { marketplaceId: 'EBAY_US', paymentsProgramType: 'EBAY_PAYMENTS' },
    { marketplace_id: 'EBAY_US', payments_program_type: 'STANDARD' },
    { marketplace_id: 'NOT_A_MARKETPLACE', payments_program_type: 'EBAY_PAYMENTS' },
    {
      marketplace_id: 'EBAY_US',
      payments_program_type: 'EBAY_PAYMENTS',
      includeSteps: true,
    },
  ])('rejects aliases, unsupported values, and extras', (invalidProgramSelection) => {
    expect(() => paymentsProgramArgumentsSchema.parse(invalidProgramSelection)).toThrow();
  });
});

describe('Sell Account deprecated payments-program operations', () => {
  it('uses the exact encoded eBay paths', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const paymentsProgramSelection = {
      marketplace_id: MarketplaceId.EBAY_MOTORS_US,
      payments_program_type: 'EBAY_PAYMENTS' as const,
    };

    await getPaymentsProgram(sellerSession, paymentsProgramSelection);
    await getPaymentsProgramOnboarding(sellerSession, paymentsProgramSelection);

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/account/v1/payments_program/EBAY_MOTORS_US/EBAY_PAYMENTS',
      },
      {
        endpoint: '/sell/account/v1/payments_program/EBAY_MOTORS_US/EBAY_PAYMENTS/onboarding',
      },
    ]);
  });
});
