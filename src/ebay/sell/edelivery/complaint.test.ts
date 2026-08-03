import { describe, expect, it } from 'vitest';

import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import { createComplaint, createComplaintArgumentsSchema } from './complaint.js';

const lostPackageComplaint = {
  complaintRequest: {
    affectedPackages: ['PACKAGE123'],
    complaintDate: '2026-07-15T10:00:00.000Z',
    complaintReason: 'Package has not arrived',
    complaintType: 'LOST_PACKAGE_COMPLAINT' as const,
  },
};

describe('Sell eDelivery complaint', () => {
  it('accepts and posts the direct generated complaint document', async () => {
    const { sellerSession, postCalls } = sellerSessionReturning({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    expect(createComplaintArgumentsSchema.parse(lostPackageComplaint)).toEqual(
      lostPackageComplaint,
    );
    await createComplaint(sellerSession, lostPackageComplaint);
    expect(postCalls).toEqual([
      {
        endpoint: '/sell/edelivery_international_shipping/v1/complaint',
        requestDocument: lostPackageComplaint,
      },
    ]);
  });

  it.each([
    { body: lostPackageComplaint },
    {
      complaintRequest: {
        complaintDate: '2026-07-15T10:00:00.000Z',
        complaintReason: 'Package has not arrived',
        complaintType: 'LOST_PACKAGE_COMPLAINT',
      },
    },
    {
      complaintRequest: {
        complaintDate: 'yesterday',
        complaintReason: 'Package has not arrived',
        complaintType: 'ABNORMAL_COLLECTION_COMPLAINT',
      },
    },
  ])('rejects wrappers and incomplete complaint documents', (invalidComplaint) => {
    expect(createComplaintArgumentsSchema.safeParse(invalidComplaint).success).toBe(false);
  });
});
