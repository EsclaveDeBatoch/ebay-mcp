import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import { defineTool } from '@/mcp/defineTool.js';

const complaintDetailsSchema = z
  .object({
    affectedPackages: z.array(z.string().min(1)).min(1).optional(),
    complaintDate: z.iso.datetime({ offset: true }),
    complaintReason: z.string().min(1).max(200),
    complaintType: z.enum(['ABNORMAL_COLLECTION_COMPLAINT', 'LOST_PACKAGE_COMPLAINT']),
    preferenceId: z.number().int().optional(),
    remark: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((complaintDetails, validation) => {
    if (
      complaintDetails.complaintType === 'LOST_PACKAGE_COMPLAINT' &&
      complaintDetails.affectedPackages === undefined
    ) {
      validation.addIssue({
        code: 'custom',
        message: 'affectedPackages is required for a lost-package complaint',
        path: ['affectedPackages'],
      });
    }
  });

/** Exact generated eBay document accepted by createComplaint. */
export const createComplaintArgumentsSchema = z
  .object({
    complaintRequest: complaintDetailsSchema,
  })
  .strict();

/** Validated generated eBay shipping-complaint document. */
export type ComplaintSubmission = z.infer<typeof createComplaintArgumentsSchema>;

/**
 * Files one eDelivery complaint about package loss or abnormal collection.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param complaintSubmission - Exact generated eBay complaint document.
 * @returns Explicit completion containing eBay's empty success document or failure.
 * @example
 * ```ts
 * await createComplaint(sellerSession, {
 *   complaintRequest: {
 *     affectedPackages: ['PACKAGE123'],
 *     complaintDate: '2026-07-15T10:00:00.000Z',
 *     complaintReason: 'Package has not arrived',
 *     complaintType: 'LOST_PACKAGE_COMPLAINT',
 *   },
 * });
 * ```
 * @see https://developer.ebay.com/api-docs/sell/edelivery_international_shipping/resources/complaint/methods/createComplaint
 */
export const createComplaint = (
  sellerSession: EbaySellerSession,
  complaintSubmission: ComplaintSubmission,
): Promise<EbayRequestCompletion<undefined>> =>
  sellerSession.post<undefined>({
    endpoint: '/sell/edelivery_international_shipping/v1/complaint',
    requestDocument: complaintSubmission,
  });

export const createComplaintTool = defineTool({
  name: 'ebay_sell_edelivery_create_complaint',
  namespace: 'sell.edelivery',
  description: 'File an eDelivery package-loss or collection complaint',
  argumentsSchema: createComplaintArgumentsSchema,
  operationKind: 'write',
  operation: createComplaint,
});
