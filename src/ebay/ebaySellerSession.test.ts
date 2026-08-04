import { describe, expect, it, vi } from 'vitest';

import { EbayApiClient } from '@/api/client.js';
import { clientRequestError, type EbayClientRequestErrorKind } from '@/api/clientRequestError.js';

import { createEbaySellerSession } from './ebaySellerSession.js';

const ebayApiClient = () =>
  new EbayApiClient({
    clientId: 'seller-client-id',
    clientSecret: 'seller-client-secret',
    environment: 'sandbox',
    redirectUri: 'https://localhost/callback',
  });

const ebayClientFailure = (kind: EbayClientRequestErrorKind, status?: number) => {
  if (status === undefined) {
    return clientRequestError({
      kind,
      method: 'GET',
      url: 'https://api.sandbox.ebay.com/sell/analytics/v1/traffic_report',
      message: `Representative ${kind} failure`,
    });
  }
  return clientRequestError({
    kind,
    method: 'GET',
    url: 'https://api.sandbox.ebay.com/sell/analytics/v1/traffic_report',
    message: `Representative ${kind} failure`,
    status,
  });
};

describe('authenticated eBay seller session standard-host calls', () => {
  it('passes the endpoint and search parameters to the authenticated client', async () => {
    const authenticatedClient = ebayApiClient();
    const ebayDocument = { records: [] };
    const getCall = vi.spyOn(authenticatedClient, 'get').mockResolvedValue(ebayDocument);
    const sellerSession = createEbaySellerSession(authenticatedClient);

    await expect(
      sellerSession.get({
        endpoint: '/sell/analytics/v1/traffic_report',
        searchParameters: { dimension: 'DAY', metric: 'LISTING_VIEWS_TOTAL' },
      }),
    ).resolves.toEqual({ kind: 'ebayRequestSucceeded', ebayDocument });
    expect(getCall).toHaveBeenCalledWith('/sell/analytics/v1/traffic_report', {
      dimension: 'DAY',
      metric: 'LISTING_VIEWS_TOTAL',
    });
  });

  it('passes GET headers separately from exact wire query fields', async () => {
    const authenticatedClient = ebayApiClient();
    const ebayDocument = { eligibleItems: [] };
    const getCall = vi.spyOn(authenticatedClient, 'get').mockResolvedValue(ebayDocument);
    const sellerSession = createEbaySellerSession(authenticatedClient);

    await expect(
      sellerSession.get({
        endpoint: '/sell/negotiation/v1/find_eligible_items',
        searchParameters: { limit: '10', offset: '0' },
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
      }),
    ).resolves.toEqual({ kind: 'ebayRequestSucceeded', ebayDocument });
    expect(getCall).toHaveBeenCalledWith(
      '/sell/negotiation/v1/find_eligible_items',
      { limit: '10', offset: '0' },
      { headers: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' } },
    );
  });

  it('passes the POST endpoint, document, search parameters, and headers to the client', async () => {
    const authenticatedClient = ebayApiClient();
    const ebayDocument = { listingRecommendations: [] };
    const postCall = vi.spyOn(authenticatedClient, 'post').mockResolvedValue(ebayDocument);
    const sellerSession = createEbaySellerSession(authenticatedClient);

    await expect(
      sellerSession.post({
        endpoint: '/sell/recommendation/v1/find',
        requestDocument: { listingIds: ['110000000000'] },
        searchParameters: { limit: '25' },
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
      }),
    ).resolves.toEqual({ kind: 'ebayRequestSucceeded', ebayDocument });
    expect(postCall).toHaveBeenCalledWith(
      '/sell/recommendation/v1/find',
      { listingIds: ['110000000000'] },
      {
        searchParameters: { limit: '25' },
        headers: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
      },
    );
  });

  it('omits the document and request settings for a bodyless POST', async () => {
    const authenticatedClient = ebayApiClient();
    const postCall = vi.spyOn(authenticatedClient, 'post').mockResolvedValue(undefined);
    const sellerSession = createEbaySellerSession(authenticatedClient);

    await expect(
      sellerSession.post({
        endpoint: '/commerce/notification/v1/subscription/subscription-123/enable',
      }),
    ).resolves.toEqual({ kind: 'ebayRequestSucceeded', ebayDocument: undefined });
    expect(postCall).toHaveBeenCalledWith(
      '/commerce/notification/v1/subscription/subscription-123/enable',
    );
  });

  it('passes the PUT endpoint, document, search parameters, and headers to the client', async () => {
    const authenticatedClient = ebayApiClient();
    const putCall = vi.spyOn(authenticatedClient, 'put').mockResolvedValue(undefined);
    const sellerSession = createEbaySellerSession(authenticatedClient);

    await expect(
      sellerSession.put({
        endpoint: '/commerce/notification/v1/config',
        requestDocument: { alertEmail: 'alerts@example.com' },
        searchParameters: { revision: '2' },
        requestHeaders: { 'Content-Language': 'en-US' },
      }),
    ).resolves.toEqual({ kind: 'ebayRequestSucceeded', ebayDocument: undefined });
    expect(putCall).toHaveBeenCalledWith(
      '/commerce/notification/v1/config',
      { alertEmail: 'alerts@example.com' },
      {
        searchParameters: { revision: '2' },
        headers: { 'Content-Language': 'en-US' },
      },
    );
  });

  it('passes the DELETE endpoint, search parameters, and headers to the client', async () => {
    const authenticatedClient = ebayApiClient();
    const deleteCall = vi.spyOn(authenticatedClient, 'delete').mockResolvedValue(undefined);
    const sellerSession = createEbaySellerSession(authenticatedClient);

    await expect(
      sellerSession.delete({
        endpoint: '/commerce/notification/v1/destination/destination-123',
        searchParameters: { revision: '2' },
        requestHeaders: { 'Content-Language': 'en-US' },
      }),
    ).resolves.toEqual({ kind: 'ebayRequestSucceeded', ebayDocument: undefined });
    expect(deleteCall).toHaveBeenCalledWith(
      '/commerce/notification/v1/destination/destination-123',
      {
        searchParameters: { revision: '2' },
        headers: { 'Content-Language': 'en-US' },
      },
    );
  });
});

describe('authenticated eBay seller session alternate-host calls', () => {
  it('uses the configured apiz host for an alternate-host GET', async () => {
    const authenticatedClient = ebayApiClient();
    const ebayDocument = { userId: '007BUS2xyeBay' };
    const apizGetCall = vi.spyOn(authenticatedClient, 'getFromUrl').mockResolvedValue(ebayDocument);
    const sellerSession = createEbaySellerSession(authenticatedClient);

    await expect(
      sellerSession.get({
        apiHost: 'apiz',
        endpoint: '/commerce/identity/v1/user/',
      }),
    ).resolves.toEqual({ kind: 'ebayRequestSucceeded', ebayDocument });
    expect(apizGetCall).toHaveBeenCalledWith(
      'https://apiz.sandbox.ebay.com/commerce/identity/v1/user/',
      undefined,
    );
  });

  it('passes binary decoding and headers to an alternate-host GET', async () => {
    const authenticatedClient = ebayApiClient();
    const evidenceBytes = Buffer.from('evidence');
    const apizGetCall = vi
      .spyOn(authenticatedClient, 'getFromUrl')
      .mockResolvedValue(evidenceBytes);
    const sellerSession = createEbaySellerSession(authenticatedClient);

    await expect(
      sellerSession.get({
        apiHost: 'apiz',
        endpoint: '/sell/fulfillment/v1/payment_dispute/DISPUTE-1/fetch_evidence_content',
        requestHeaders: { Accept: 'application/octet-stream' },
        responseType: 'arraybuffer',
        searchParameters: { evidence_id: 'EVIDENCE-1', file_id: 'FILE-1' },
      }),
    ).resolves.toEqual({ kind: 'ebayRequestSucceeded', ebayDocument: evidenceBytes });
    expect(apizGetCall).toHaveBeenCalledWith(
      'https://apiz.sandbox.ebay.com/sell/fulfillment/v1/payment_dispute/DISPUTE-1/fetch_evidence_content',
      { evidence_id: 'EVIDENCE-1', file_id: 'FILE-1' },
      {
        headers: { Accept: 'application/octet-stream' },
        responseType: 'arraybuffer',
      },
    );
  });

  it('uses the configured apiz host for an alternate-host POST', async () => {
    const authenticatedClient = ebayApiClient();
    const ebayDocument = { signingKeyId: 'signing-key-123' };
    const apizPostCall = vi.spyOn(authenticatedClient, 'postToUrl').mockResolvedValue(ebayDocument);
    const sellerSession = createEbaySellerSession(authenticatedClient);

    await expect(
      sellerSession.post({
        apiHost: 'apiz',
        endpoint: '/developer/key_management/v1/signing_key',
        requestDocument: { signingKeyCipher: 'ED25519' },
      }),
    ).resolves.toEqual({ kind: 'ebayRequestSucceeded', ebayDocument });
    expect(apizPostCall).toHaveBeenCalledWith(
      'https://apiz.sandbox.ebay.com/developer/key_management/v1/signing_key',
      { signingKeyCipher: 'ED25519' },
    );
  });
});

describe('authenticated eBay seller session failures', () => {
  it.each([
    {
      thrownFailure: ebayClientFailure('missingCredentials'),
      ebayFailure: {
        kind: 'ebayAuthenticationFailed',
        message: 'Representative missingCredentials failure',
      },
    },
    {
      thrownFailure: ebayClientFailure('localRateLimit'),
      ebayFailure: {
        kind: 'ebayRateLimited',
        message: 'Representative localRateLimit failure',
      },
    },
    {
      thrownFailure: ebayClientFailure('httpStatus', 400),
      ebayFailure: {
        kind: 'ebayRequestRejected',
        message: 'Representative httpStatus failure',
        status: 400,
      },
    },
    {
      thrownFailure: ebayClientFailure('httpStatus', 503),
      ebayFailure: {
        kind: 'ebayUnavailable',
        message: 'Representative httpStatus failure',
      },
    },
    {
      thrownFailure: ebayClientFailure('transport'),
      ebayFailure: {
        kind: 'ebayUnavailable',
        message: 'Representative transport failure',
      },
    },
  ])('classifies the client failure as $ebayFailure.kind', async (failureScenario) => {
    const authenticatedClient = ebayApiClient();
    vi.spyOn(authenticatedClient, 'get').mockRejectedValue(failureScenario.thrownFailure);
    const sellerSession = createEbaySellerSession(authenticatedClient);

    await expect(
      sellerSession.get({ endpoint: '/sell/analytics/v1/traffic_report' }),
    ).resolves.toEqual({ kind: 'ebayRequestFailed', ebayFailure: failureScenario.ebayFailure });
  });

  it('classifies an unexpected thrown failure as eBay unavailability', async () => {
    const authenticatedClient = ebayApiClient();
    vi.spyOn(authenticatedClient, 'get').mockRejectedValue(new Error('Connection closed'));
    const sellerSession = createEbaySellerSession(authenticatedClient);

    await expect(
      sellerSession.get({ endpoint: '/sell/analytics/v1/traffic_report' }),
    ).resolves.toEqual({
      kind: 'ebayRequestFailed',
      ebayFailure: { kind: 'ebayUnavailable', message: 'Connection closed' },
    });
  });

  it('classifies a rejected POST through the same completion contract', async () => {
    const authenticatedClient = ebayApiClient();
    vi.spyOn(authenticatedClient, 'post').mockRejectedValue(new Error('Connection closed'));
    const sellerSession = createEbaySellerSession(authenticatedClient);

    await expect(
      sellerSession.post({
        endpoint: '/sell/recommendation/v1/find',
        requestDocument: {},
      }),
    ).resolves.toEqual({
      kind: 'ebayRequestFailed',
      ebayFailure: { kind: 'ebayUnavailable', message: 'Connection closed' },
    });
  });
});
