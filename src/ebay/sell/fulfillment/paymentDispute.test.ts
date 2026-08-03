import { describe, expect, it } from 'vitest';

import {
  acceptPaymentDispute,
  acceptPaymentDisputeArgumentsSchema,
  addEvidence,
  addEvidenceArgumentsSchema,
  contestPaymentDispute,
  fetchEvidenceContent,
  getActivities,
  getPaymentDispute,
  getPaymentDisputeSummaries,
  getPaymentDisputeSummariesArgumentsSchema,
  updateEvidence,
  updateEvidenceArgumentsSchema,
  uploadEvidenceFile,
  uploadEvidenceFileArgumentsSchema,
} from '@/ebay/sell/fulfillment/paymentDispute.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

describe('Sell Fulfillment payment-dispute schemas', () => {
  it('accepts exact dispute query names', () => {
    const disputeSearch = {
      buyer_username: 'buyer-one',
      limit: '25',
      offset: '0',
      open_date_from: '2026-07-01T00:00:00.000Z',
      open_date_to: '2026-08-01T00:00:00.000Z',
      order_id: 'ORDER-1',
      payment_dispute_status: 'OPEN',
    };

    expect(getPaymentDisputeSummariesArgumentsSchema.parse(disputeSearch)).toEqual(disputeSearch);
  });

  it.each([
    { orderId: 'ORDER-1' },
    { limit: 25 },
    { limit: '0' },
    { limit: '201' },
    { offset: '-1' },
  ])('rejects aliases and invalid dispute pagination', (invalidDisputeSearch) => {
    expect(() => getPaymentDisputeSummariesArgumentsSchema.parse(invalidDisputeSearch)).toThrow();
  });

  it('requires a revision for dispute decisions', () => {
    expect(() =>
      acceptPaymentDisputeArgumentsSchema.parse({ payment_dispute_id: 'DISPUTE-1' }),
    ).toThrow();
    expect(
      acceptPaymentDisputeArgumentsSchema.parse({
        payment_dispute_id: 'DISPUTE-1',
        revision: 3,
      }),
    ).toEqual({ payment_dispute_id: 'DISPUTE-1', revision: 3 });
  });

  it('requires evidence files and exact update identifiers', () => {
    expect(() =>
      addEvidenceArgumentsSchema.parse({
        evidenceType: 'PROOF_OF_DELIVERY_AS_FILE',
        files: [],
        payment_dispute_id: 'DISPUTE-1',
      }),
    ).toThrow();
    expect(() =>
      updateEvidenceArgumentsSchema.parse({
        files: [{ fileId: 'FILE-1' }],
        payment_dispute_id: 'DISPUTE-1',
      }),
    ).toThrow();
  });

  it('accepts one supported base64 image upload', () => {
    const evidenceUpload = {
      fileContentBase64: Buffer.from('image-bytes').toString('base64'),
      fileName: 'delivery.png',
      payment_dispute_id: 'DISPUTE-1',
    };

    expect(uploadEvidenceFileArgumentsSchema.parse(evidenceUpload)).toEqual(evidenceUpload);
    expect(() =>
      uploadEvidenceFileArgumentsSchema.parse({ ...evidenceUpload, fileName: 'delivery.pdf' }),
    ).toThrow();
  });
});

describe('Sell Fulfillment payment-dispute read operations', () => {
  it('uses the apiz host for dispute detail and activity', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getPaymentDispute(sellerSession, { payment_dispute_id: 'DISPUTE/1' });
    await getActivities(sellerSession, { payment_dispute_id: 'DISPUTE/1' });

    expect(getCalls).toEqual([
      {
        apiHost: 'apiz',
        endpoint: '/sell/fulfillment/v1/payment_dispute/DISPUTE%2F1',
      },
      {
        apiHost: 'apiz',
        endpoint: '/sell/fulfillment/v1/payment_dispute/DISPUTE%2F1/activity',
      },
    ]);
  });

  it('sends exact dispute summary query fields to apiz', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });
    const disputeSearch = { limit: '25', offset: '0', order_id: 'ORDER-1' };

    await getPaymentDisputeSummaries(sellerSession, disputeSearch);

    expect(getCalls).toEqual([
      {
        apiHost: 'apiz',
        endpoint: '/sell/fulfillment/v1/payment_dispute_summary',
        searchParameters: disputeSearch,
      },
    ]);
  });

  it('requests binary evidence content with exact query names', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await fetchEvidenceContent(sellerSession, {
      evidence_id: 'EVIDENCE-1',
      file_id: 'FILE-1',
      payment_dispute_id: 'DISPUTE/1',
    });

    expect(getCalls).toEqual([
      {
        apiHost: 'apiz',
        endpoint: '/sell/fulfillment/v1/payment_dispute/DISPUTE%2F1/fetch_evidence_content',
        requestHeaders: { Accept: 'application/octet-stream' },
        responseType: 'arraybuffer',
        searchParameters: { evidence_id: 'EVIDENCE-1', file_id: 'FILE-1' },
      },
    ]);
  });
});

describe('Sell Fulfillment payment-dispute write operations', () => {
  it('posts direct accept and contest documents to apiz', async () => {
    const { sellerSession, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await acceptPaymentDispute(sellerSession, {
      payment_dispute_id: 'DISPUTE/1',
      revision: 3,
    });
    await contestPaymentDispute(sellerSession, {
      note: 'Delivery confirmation attached',
      payment_dispute_id: 'DISPUTE/1',
      revision: 4,
    });

    expect(postCalls).toEqual([
      {
        apiHost: 'apiz',
        endpoint: '/sell/fulfillment/v1/payment_dispute/DISPUTE%2F1/accept',
        requestDocument: { revision: 3 },
      },
      {
        apiHost: 'apiz',
        endpoint: '/sell/fulfillment/v1/payment_dispute/DISPUTE%2F1/contest',
        requestDocument: { note: 'Delivery confirmation attached', revision: 4 },
      },
    ]);
  });

  it('posts direct add and update evidence documents to apiz', async () => {
    const { sellerSession, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await addEvidence(sellerSession, {
      evidenceType: 'PROOF_OF_DELIVERY_AS_FILE',
      files: [{ fileId: 'FILE-1' }],
      lineItems: [{ itemId: 'ITEM-1', lineItemId: 'LINE-1' }],
      payment_dispute_id: 'DISPUTE/1',
    });
    await updateEvidence(sellerSession, {
      evidenceId: 'EVIDENCE-1',
      files: [{ fileId: 'FILE-2' }],
      lineItems: [{ itemId: 'ITEM-1', lineItemId: 'LINE-1' }],
      payment_dispute_id: 'DISPUTE/1',
    });

    expect(postCalls).toEqual([
      {
        apiHost: 'apiz',
        endpoint: '/sell/fulfillment/v1/payment_dispute/DISPUTE%2F1/add_evidence',
        requestDocument: {
          evidenceType: 'PROOF_OF_DELIVERY_AS_FILE',
          files: [{ fileId: 'FILE-1' }],
          lineItems: [{ itemId: 'ITEM-1', lineItemId: 'LINE-1' }],
        },
      },
      {
        apiHost: 'apiz',
        endpoint: '/sell/fulfillment/v1/payment_dispute/DISPUTE%2F1/update_evidence',
        requestDocument: {
          evidenceId: 'EVIDENCE-1',
          files: [{ fileId: 'FILE-2' }],
          lineItems: [{ itemId: 'ITEM-1', lineItemId: 'LINE-1' }],
        },
      },
    ]);
  });

  it('converts one base64 image into the API file part', async () => {
    const { sellerSession, postCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await uploadEvidenceFile(sellerSession, {
      fileContentBase64: Buffer.from('image-bytes').toString('base64'),
      fileName: 'delivery.png',
      payment_dispute_id: 'DISPUTE/1',
    });

    const [evidenceUploadCall] = postCalls;
    expect(evidenceUploadCall).toMatchObject({
      apiHost: 'apiz',
      endpoint: '/sell/fulfillment/v1/payment_dispute/DISPUTE%2F1/upload_evidence_file',
    });
    if (evidenceUploadCall === undefined) {
      throw new Error('Expected one evidence upload call');
    }
    if (!(evidenceUploadCall.requestDocument instanceof FormData)) {
      throw new Error('Expected a multipart evidence document');
    }
    const evidenceImage = evidenceUploadCall.requestDocument.get('file');
    if (!(evidenceImage instanceof Blob)) {
      throw new Error('Expected the multipart file part');
    }
    expect(evidenceImage).toMatchObject({ name: 'delivery.png' });
    expect(evidenceImage.size).toBe(Buffer.byteLength('image-bytes'));
    expect(evidenceImage.type).toBe('image/png');
  });
});
