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

describe('authenticated eBay seller session', () => {
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
});
