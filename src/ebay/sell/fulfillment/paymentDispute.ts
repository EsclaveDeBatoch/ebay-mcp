import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/order-management/sellFulfillmentV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';
import { mapDisputeSummariesToTable, mapDisputeToCard } from '@/tools/ui/maps.js';

const paymentDisputeIdSchema = z.string().min(1);

const disputePageSizeSchema = z
  .string()
  .regex(/^(?:[1-9]|[1-9]\d|1\d{2}|200)$/, 'limit must be an integer from 1 through 200');

const disputePageOffsetSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)$/, 'offset must be a non-negative integer');

const phoneSchema = z
  .object({
    countryCode: z.string().length(2).optional(),
    number: z.string().min(1),
  })
  .strict();

const returnAddressSchema = z
  .object({
    addressLine1: z.string().min(1).optional(),
    addressLine2: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    country: z.string().length(2).optional(),
    county: z.string().min(1).optional(),
    fullName: z.string().min(1).optional(),
    postalCode: z.string().min(1).optional(),
    primaryPhone: phoneSchema.optional(),
    stateOrProvince: z.string().min(1).optional(),
  })
  .strict();

const evidenceFileSchema = z.object({ fileId: z.string().min(1) }).strict();

const disputedLineItemSchema = z
  .object({
    itemId: z.string().min(1),
    lineItemId: z.string().min(1),
  })
  .strict();

/** Exact eBay payment-dispute path accepted by detail and activity operations. */
export const paymentDisputeArgumentsSchema = z
  .object({ payment_dispute_id: paymentDisputeIdSchema })
  .strict();

/** Exact eBay path and query fields accepted by fetchEvidenceContent. */
export const fetchEvidenceContentArgumentsSchema = z
  .object({
    evidence_id: z.string().min(1),
    file_id: z.string().min(1),
    payment_dispute_id: paymentDisputeIdSchema,
  })
  .strict();

/** Exact eBay filters and pagination fields accepted by getPaymentDisputeSummaries. */
export const getPaymentDisputeSummariesArgumentsSchema = z
  .object({
    buyer_username: z.string().min(1).optional(),
    limit: disputePageSizeSchema.optional(),
    offset: disputePageOffsetSchema.optional(),
    open_date_from: z.iso.datetime({ offset: true }).optional(),
    open_date_to: z.iso.datetime({ offset: true }).optional(),
    order_id: z.string().min(1).optional(),
    payment_dispute_status: z.string().min(1).optional(),
  })
  .strict();

/** Exact eBay path and direct document accepted by acceptPaymentDispute. */
export const acceptPaymentDisputeArgumentsSchema = z
  .object({
    payment_dispute_id: paymentDisputeIdSchema,
    returnAddress: returnAddressSchema.optional(),
    revision: z.number().int().nonnegative(),
  })
  .strict();

/** Exact eBay path and direct document accepted by contestPaymentDispute. */
export const contestPaymentDisputeArgumentsSchema = acceptPaymentDisputeArgumentsSchema.extend({
  note: z.string().max(1000).optional(),
});

/** Exact eBay path and direct document accepted by addEvidence. */
export const addEvidenceArgumentsSchema = z
  .object({
    evidenceType: z.string().min(1).optional(),
    files: z.array(evidenceFileSchema).min(1),
    lineItems: z.array(disputedLineItemSchema).min(1).optional(),
    payment_dispute_id: paymentDisputeIdSchema,
  })
  .strict();

/** Exact eBay path and direct document accepted by updateEvidence. */
export const updateEvidenceArgumentsSchema = z
  .object({
    evidenceId: z.string().min(1),
    evidenceType: z.string().min(1).optional(),
    files: z.array(evidenceFileSchema).min(1),
    lineItems: z.array(disputedLineItemSchema).min(1),
    payment_dispute_id: paymentDisputeIdSchema,
  })
  .strict();

/** Exact MCP file fields and eBay path accepted by uploadEvidenceFile. */
export const uploadEvidenceFileArgumentsSchema = z
  .object({
    fileContentBase64: z.base64(),
    fileName: z
      .string()
      .min(1)
      .max(255)
      .regex(/\.(jpeg|jpg|png)$/i),
    payment_dispute_id: paymentDisputeIdSchema,
  })
  .strict()
  .superRefine((evidenceUpload, validation) => {
    const evidenceBytes = Buffer.from(evidenceUpload.fileContentBase64, 'base64');
    if (evidenceBytes.byteLength > 1_500_000) {
      validation.addIssue({
        code: 'custom',
        path: ['fileContentBase64'],
        message: 'evidence file must not exceed 1.5 MB',
      });
    }
  });

/** Validated eBay payment-dispute path. */
export type PaymentDisputeArguments = z.infer<typeof paymentDisputeArgumentsSchema>;

/** Validated eBay evidence download path and query. */
export type FetchEvidenceContentArguments = z.infer<typeof fetchEvidenceContentArgumentsSchema>;

/** Validated eBay payment-dispute search fields. */
export type GetPaymentDisputeSummariesArguments = z.infer<
  typeof getPaymentDisputeSummariesArgumentsSchema
>;

/** Validated direct eBay accept document. */
export type AcceptPaymentDisputeArguments = z.infer<typeof acceptPaymentDisputeArgumentsSchema>;

/** Validated direct eBay contest document. */
export type ContestPaymentDisputeArguments = z.infer<typeof contestPaymentDisputeArgumentsSchema>;

/** Validated direct eBay add-evidence document. */
export type AddEvidenceArguments = z.infer<typeof addEvidenceArgumentsSchema>;

/** Validated direct eBay update-evidence document. */
export type UpdateEvidenceArguments = z.infer<typeof updateEvidenceArgumentsSchema>;

/** Validated MCP file fields and eBay upload path. */
export type UploadEvidenceFileArguments = z.infer<typeof uploadEvidenceFileArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/fulfillment/types/api:PaymentDispute */
export type PaymentDispute = components['schemas']['PaymentDispute'];

/** @see https://developer.ebay.com/api-docs/sell/fulfillment/types/api:PaymentDisputeActivityHistory */
export type PaymentDisputeActivities = components['schemas']['PaymentDisputeActivityHistory'];

/** @see https://developer.ebay.com/api-docs/sell/fulfillment/types/api:DisputeSummaryResponse */
export type PaymentDisputeSummaries = components['schemas']['DisputeSummaryResponse'];

/** @see https://developer.ebay.com/api-docs/sell/fulfillment/types/api:FileEvidence */
export type UploadedEvidenceFile = components['schemas']['FileEvidence'];

/** @see https://developer.ebay.com/api-docs/sell/fulfillment/types/api:AddEvidencePaymentDisputeResponse */
export type AddedEvidence = components['schemas']['AddEvidencePaymentDisputeResponse'];

/** Binary evidence content returned unchanged by eBay. */
export type EvidenceContent = Buffer;

function evidenceMediaType(fileName: string): 'image/jpeg' | 'image/png' {
  if (fileName.toLowerCase().endsWith('.png')) {
    return 'image/png';
  }
  return 'image/jpeg';
}

/**
 * Retrieves one payment dispute from eBay's alternate API host.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param disputeLookup - Exact eBay payment-dispute path.
 * @returns Explicit completion containing eBay's unchanged generated dispute.
 * @example `await getPaymentDispute(sellerSession, { payment_dispute_id: '5001234567' })`
 * @see https://developer.ebay.com/api-docs/sell/fulfillment/resources/payment_dispute/methods/getPaymentDispute
 */
export const getPaymentDispute = (
  sellerSession: EbaySellerSession,
  disputeLookup: PaymentDisputeArguments,
): Promise<EbayRequestCompletion<PaymentDispute>> =>
  sellerSession.get<PaymentDispute>({
    apiHost: 'apiz',
    endpoint: `/sell/fulfillment/v1/payment_dispute/${encodeURIComponent(disputeLookup.payment_dispute_id)}`,
  });

/**
 * Downloads one binary evidence file from eBay's alternate API host.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param evidenceLookup - Exact eBay dispute path and evidence query fields.
 * @returns Explicit completion containing the unchanged binary file.
 * @example `await fetchEvidenceContent(sellerSession, { payment_dispute_id: '5001234567', evidence_id: 'EVIDENCE-1', file_id: 'FILE-1' })`
 * @see https://developer.ebay.com/api-docs/sell/fulfillment/resources/payment_dispute/methods/fetchEvidenceContent
 */
export const fetchEvidenceContent = (
  sellerSession: EbaySellerSession,
  evidenceLookup: FetchEvidenceContentArguments,
): Promise<EbayRequestCompletion<EvidenceContent>> => {
  const { payment_dispute_id: paymentDisputeId, ...evidenceSearch } = evidenceLookup;
  return sellerSession.get<EvidenceContent>({
    apiHost: 'apiz',
    endpoint: `/sell/fulfillment/v1/payment_dispute/${encodeURIComponent(paymentDisputeId)}/fetch_evidence_content`,
    requestHeaders: { Accept: 'application/octet-stream' },
    responseType: 'arraybuffer',
    searchParameters: evidenceSearch,
  });
};

/**
 * Retrieves the activity history for one payment dispute.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param disputeLookup - Exact eBay payment-dispute path.
 * @returns Explicit completion containing eBay's unchanged generated activity history.
 * @example `await getActivities(sellerSession, { payment_dispute_id: '5001234567' })`
 * @see https://developer.ebay.com/api-docs/sell/fulfillment/resources/payment_dispute/methods/getActivities
 */
export const getActivities = (
  sellerSession: EbaySellerSession,
  disputeLookup: PaymentDisputeArguments,
): Promise<EbayRequestCompletion<PaymentDisputeActivities>> =>
  sellerSession.get<PaymentDisputeActivities>({
    apiHost: 'apiz',
    endpoint: `/sell/fulfillment/v1/payment_dispute/${encodeURIComponent(disputeLookup.payment_dispute_id)}/activity`,
  });

/**
 * Retrieves payment-dispute summaries from eBay's alternate API host.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param disputeSearch - Exact eBay filters and pagination fields.
 * @returns Explicit completion containing eBay's unchanged generated summary collection.
 * @example `await getPaymentDisputeSummaries(sellerSession, { order_id: '01-12345-67890' })`
 * @see https://developer.ebay.com/api-docs/sell/fulfillment/resources/payment_dispute/methods/getPaymentDisputeSummaries
 */
export const getPaymentDisputeSummaries = (
  sellerSession: EbaySellerSession,
  disputeSearch: GetPaymentDisputeSummariesArguments,
): Promise<EbayRequestCompletion<PaymentDisputeSummaries>> =>
  sellerSession.get<PaymentDisputeSummaries>({
    apiHost: 'apiz',
    endpoint: '/sell/fulfillment/v1/payment_dispute_summary',
    searchParameters: disputeSearch,
  });

/**
 * Accepts one payment dispute through eBay's alternate API host.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param disputeAcceptance - Exact eBay path and direct accept document.
 * @returns Explicit completion for eBay's empty success document.
 * @example `await acceptPaymentDispute(sellerSession, { payment_dispute_id: '5001234567', revision: 3 })`
 * @see https://developer.ebay.com/api-docs/sell/fulfillment/resources/payment_dispute/methods/acceptPaymentDispute
 */
export const acceptPaymentDispute = (
  sellerSession: EbaySellerSession,
  disputeAcceptance: AcceptPaymentDisputeArguments,
): Promise<EbayRequestCompletion<undefined>> => {
  const { payment_dispute_id: paymentDisputeId, ...acceptDocument } = disputeAcceptance;
  return sellerSession.post<undefined>({
    apiHost: 'apiz',
    endpoint: `/sell/fulfillment/v1/payment_dispute/${encodeURIComponent(paymentDisputeId)}/accept`,
    requestDocument: acceptDocument,
  });
};

/**
 * Contests one payment dispute through eBay's alternate API host.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param disputeContest - Exact eBay path and direct contest document.
 * @returns Explicit completion for eBay's empty success document.
 * @example `await contestPaymentDispute(sellerSession, { payment_dispute_id: '5001234567', revision: 3 })`
 * @see https://developer.ebay.com/api-docs/sell/fulfillment/resources/payment_dispute/methods/contestPaymentDispute
 */
export const contestPaymentDispute = (
  sellerSession: EbaySellerSession,
  disputeContest: ContestPaymentDisputeArguments,
): Promise<EbayRequestCompletion<undefined>> => {
  const { payment_dispute_id: paymentDisputeId, ...contestDocument } = disputeContest;
  return sellerSession.post<undefined>({
    apiHost: 'apiz',
    endpoint: `/sell/fulfillment/v1/payment_dispute/${encodeURIComponent(paymentDisputeId)}/contest`,
    requestDocument: contestDocument,
  });
};

/**
 * Uploads one supported image as eBay's required multipart file part.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param evidenceUpload - Exact dispute path, filename, and base64 file content.
 * @returns Explicit completion containing eBay's unchanged generated file identifier.
 * @example `await uploadEvidenceFile(sellerSession, { payment_dispute_id: '5001234567', fileName: 'delivery.png', fileContentBase64: 'aW1hZ2U=' })`
 * @see https://developer.ebay.com/api-docs/sell/fulfillment/resources/payment_dispute/methods/uploadEvidenceFile
 */
export const uploadEvidenceFile = (
  sellerSession: EbaySellerSession,
  evidenceUpload: UploadEvidenceFileArguments,
): Promise<EbayRequestCompletion<UploadedEvidenceFile>> => {
  const evidenceBytes = Uint8Array.from(Buffer.from(evidenceUpload.fileContentBase64, 'base64'));
  const evidenceImage = new Blob([evidenceBytes], {
    type: evidenceMediaType(evidenceUpload.fileName),
  });
  const multipartDocument = new FormData();
  multipartDocument.append('file', evidenceImage, evidenceUpload.fileName);

  return sellerSession.post<UploadedEvidenceFile>({
    apiHost: 'apiz',
    endpoint: `/sell/fulfillment/v1/payment_dispute/${encodeURIComponent(evidenceUpload.payment_dispute_id)}/upload_evidence_file`,
    requestDocument: multipartDocument,
  });
};

/**
 * Creates one evidence set for a payment dispute.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param evidenceSubmission - Exact eBay path and direct add-evidence document.
 * @returns Explicit completion containing eBay's unchanged evidence-set identifier.
 * @example `await addEvidence(sellerSession, { payment_dispute_id: '5001234567', files: [{ fileId: 'FILE-1' }] })`
 * @see https://developer.ebay.com/api-docs/sell/fulfillment/resources/payment_dispute/methods/addEvidence
 */
export const addEvidence = (
  sellerSession: EbaySellerSession,
  evidenceSubmission: AddEvidenceArguments,
): Promise<EbayRequestCompletion<AddedEvidence>> => {
  const { payment_dispute_id: paymentDisputeId, ...evidenceDocument } = evidenceSubmission;
  return sellerSession.post<AddedEvidence>({
    apiHost: 'apiz',
    endpoint: `/sell/fulfillment/v1/payment_dispute/${encodeURIComponent(paymentDisputeId)}/add_evidence`,
    requestDocument: evidenceDocument,
  });
};

/**
 * Adds uploaded files to one existing evidence set.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param evidenceUpdate - Exact eBay path and direct update-evidence document.
 * @returns Explicit completion for eBay's empty success document.
 * @example `await updateEvidence(sellerSession, { payment_dispute_id: '5001234567', evidenceId: 'EVIDENCE-1', files: [{ fileId: 'FILE-1' }], lineItems: [{ itemId: 'ITEM-1', lineItemId: 'LINE-1' }] })`
 * @see https://developer.ebay.com/api-docs/sell/fulfillment/resources/payment_dispute/methods/updateEvidence
 */
export const updateEvidence = (
  sellerSession: EbaySellerSession,
  evidenceUpdate: UpdateEvidenceArguments,
): Promise<EbayRequestCompletion<undefined>> => {
  const { payment_dispute_id: paymentDisputeId, ...evidenceDocument } = evidenceUpdate;
  return sellerSession.post<undefined>({
    apiHost: 'apiz',
    endpoint: `/sell/fulfillment/v1/payment_dispute/${encodeURIComponent(paymentDisputeId)}/update_evidence`,
    requestDocument: evidenceDocument,
  });
};

export const getPaymentDisputeTool = defineTool({
  name: 'ebay_sell_fulfillment_get_payment_dispute',
  namespace: 'sell.fulfillment',
  description: 'Retrieve one payment dispute by its exact eBay identifier',
  argumentsSchema: paymentDisputeArgumentsSchema,
  operationKind: 'read',
  operation: getPaymentDispute,
  presentation: { archetype: 'card', project: mapDisputeToCard },
});

export const fetchEvidenceContentTool = defineTool({
  name: 'ebay_sell_fulfillment_fetch_evidence_content',
  namespace: 'sell.fulfillment',
  description: 'Download one binary evidence file attached to a payment dispute',
  argumentsSchema: fetchEvidenceContentArgumentsSchema,
  operationKind: 'read',
  operation: fetchEvidenceContent,
});

export const getActivitiesTool = defineTool({
  name: 'ebay_sell_fulfillment_get_activities',
  namespace: 'sell.fulfillment',
  description: 'Retrieve the recorded activity history for one payment dispute',
  argumentsSchema: paymentDisputeArgumentsSchema,
  operationKind: 'read',
  operation: getActivities,
});

export const getPaymentDisputeSummariesTool = defineTool({
  name: 'ebay_sell_fulfillment_get_payment_dispute_summaries',
  namespace: 'sell.fulfillment',
  description: 'Retrieve payment-dispute summaries using exact eBay filters and pagination',
  argumentsSchema: getPaymentDisputeSummariesArgumentsSchema,
  operationKind: 'read',
  operation: getPaymentDisputeSummaries,
  presentation: { archetype: 'table', project: mapDisputeSummariesToTable },
});

export const contestPaymentDisputeTool = defineTool({
  name: 'ebay_sell_fulfillment_contest_payment_dispute',
  namespace: 'sell.fulfillment',
  description: 'Contest one payment dispute using the direct eBay document',
  argumentsSchema: contestPaymentDisputeArgumentsSchema,
  operationKind: 'write',
  operation: contestPaymentDispute,
});

export const acceptPaymentDisputeTool = defineTool({
  name: 'ebay_sell_fulfillment_accept_payment_dispute',
  namespace: 'sell.fulfillment',
  description: 'Accept one payment dispute using the direct eBay document',
  argumentsSchema: acceptPaymentDisputeArgumentsSchema,
  operationKind: 'write',
  operation: acceptPaymentDispute,
});

export const uploadEvidenceFileTool = defineTool({
  name: 'ebay_sell_fulfillment_upload_evidence_file',
  namespace: 'sell.fulfillment',
  description: 'Upload one JPEG or PNG as the payment-dispute multipart file part',
  argumentsSchema: uploadEvidenceFileArgumentsSchema,
  operationKind: 'write',
  operation: uploadEvidenceFile,
});

export const addEvidenceTool = defineTool({
  name: 'ebay_sell_fulfillment_add_evidence',
  namespace: 'sell.fulfillment',
  description: 'Create one payment-dispute evidence set from uploaded files',
  argumentsSchema: addEvidenceArgumentsSchema,
  operationKind: 'write',
  operation: addEvidence,
});

export const updateEvidenceTool = defineTool({
  name: 'ebay_sell_fulfillment_update_evidence',
  namespace: 'sell.fulfillment',
  description: 'Add uploaded files to one existing payment-dispute evidence set',
  argumentsSchema: updateEvidenceArgumentsSchema,
  operationKind: 'write',
  operation: updateEvidence,
});
