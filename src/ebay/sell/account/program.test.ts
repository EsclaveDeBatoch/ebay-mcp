import { describe, expect, it } from 'vitest';

import {
  getOptedInPrograms,
  getOptedInProgramsArgumentsSchema,
  optInToProgram,
  optOutOfProgram,
  programEnrollmentArgumentsSchema,
} from '@/ebay/sell/account/program.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

describe('Sell Account seller-program schemas', () => {
  it.each(['OUT_OF_STOCK_CONTROL', 'PARTNER_MOTORS_DEALER', 'SELLING_POLICY_MANAGEMENT'] as const)(
    'accepts the official %s program type',
    (programType) => {
      expect(programEnrollmentArgumentsSchema.parse({ programType })).toEqual({ programType });
    },
  );

  it.each([
    { programType: 'TOP_RATED' },
    { program_type: 'OUT_OF_STOCK_CONTROL' },
    { programType: 'OUT_OF_STOCK_CONTROL', sellerNote: 'keep listings active' },
    { sellerProgram: { programType: 'OUT_OF_STOCK_CONTROL' } },
  ])('rejects unsupported values, aliases, extras, and wrappers', (invalidEnrollment) => {
    expect(() => programEnrollmentArgumentsSchema.parse(invalidEnrollment)).toThrow();
  });

  it('accepts only the exact empty collection contract', () => {
    expect(getOptedInProgramsArgumentsSchema.parse({})).toEqual({});
    expect(() => getOptedInProgramsArgumentsSchema.parse({ programType: 'x' })).toThrow();
  });
});

describe('Sell Account seller-program operations', () => {
  it('retrieves opted-in programs without transport arguments', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getOptedInPrograms(sellerSession);

    expect(getCalls).toEqual([{ endpoint: '/sell/account/v1/program/get_opted_in_programs' }]);
  });

  it('posts the direct eBay document to opt in and opt out', async () => {
    const { sellerSession, postCalls } = sellerSessionReturning<Record<string, never>>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const programEnrollment = { programType: 'OUT_OF_STOCK_CONTROL' as const };

    await optInToProgram(sellerSession, programEnrollment);
    await optOutOfProgram(sellerSession, programEnrollment);

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/account/v1/program/opt_in',
        requestDocument: programEnrollment,
      },
      {
        endpoint: '/sell/account/v1/program/opt_out',
        requestDocument: programEnrollment,
      },
    ]);
  });
});
