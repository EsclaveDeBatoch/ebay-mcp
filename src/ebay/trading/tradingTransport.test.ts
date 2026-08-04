import { Effect } from 'effect';
import nock from 'nock';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EbayApiClient } from '@/api/client.js';
import { EbayClientRequestError } from '@/api/clientRequestError.js';
import { createTradingTransport } from './tradingTransport.js';

function authenticatedApiClient(environment = 'production'): EbayApiClient {
  return {
    getConfig: vi.fn().mockReturnValue({ environment }),
    getOAuthClient: vi.fn().mockReturnValue({
      getAccessToken: vi.fn().mockReturnValue(Effect.succeed('seller-token')),
    }),
  } as unknown as EbayApiClient;
}

function proxyApiClient(): EbayApiClient {
  return {
    getConfig: vi.fn().mockReturnValue({
      environment: 'production',
      apiBaseUrl: 'http://localhost:8099',
      disableAuthHeader: true,
    }),
    getOAuthClient: vi.fn(),
  } as unknown as EbayApiClient;
}

afterEach(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

describe('Trading XML transport', () => {
  it('sends the required headers and exact XML document', async () => {
    nock.disableNetConnect();
    const ebayApiClient = authenticatedApiClient();
    const tradingTransport = createTradingTransport(ebayApiClient);
    const ebayScope = nock('https://api.ebay.com')
      .post('/ws/api.dll', (requestDocument: string) =>
        requestDocument.includes('<ItemID>12345</ItemID>'),
      )
      .matchHeader('X-EBAY-API-CALL-NAME', 'GetItem')
      .matchHeader('X-EBAY-API-SITEID', '0')
      .matchHeader('X-EBAY-API-COMPATIBILITY-LEVEL', '1451')
      .matchHeader('X-EBAY-API-IAF-TOKEN', 'seller-token')
      .matchHeader('Content-Type', 'text/xml')
      .reply(
        200,
        `<?xml version="1.0" encoding="utf-8"?>
        <GetItemResponse xmlns="urn:ebay:apis:eBLBaseComponents">
          <Ack>Success</Ack>
          <Item><ItemID>12345</ItemID></Item>
        </GetItemResponse>`,
      );

    const tradingDocument = await tradingTransport.execute({
      callName: 'GetItem',
      requestDocument: { ItemID: '12345' },
    });

    expect(tradingDocument).toEqual({ Ack: 'Success', Item: [{ ItemID: 12_345 }] });
    ebayScope.done();
  });
});

describe('Trading XML failures and proxy mode', () => {
  it('turns a Trading Ack failure into a rejected eBay request', async () => {
    nock.disableNetConnect();
    const tradingTransport = createTradingTransport(authenticatedApiClient());
    nock('https://api.ebay.com')
      .post('/ws/api.dll')
      .reply(
        200,
        `<GetItemResponse xmlns="urn:ebay:apis:eBLBaseComponents">
          <Ack>Failure</Ack>
          <Errors><ShortMessage>Invalid item ID</ShortMessage></Errors>
        </GetItemResponse>`,
      );

    const rejectedCall = tradingTransport.execute({
      callName: 'GetItem',
      requestDocument: { ItemID: '99999' },
    });

    await expect(rejectedCall).rejects.toMatchObject({
      kind: 'httpStatus',
      status: 400,
      message: 'Invalid item ID',
    });
    await expect(rejectedCall).rejects.toBeInstanceOf(EbayClientRequestError);
  });

  it('uses the configured proxy without acquiring or sending a token', async () => {
    nock.disableNetConnect();
    const ebayApiClient = proxyApiClient();
    const tradingTransport = createTradingTransport(ebayApiClient);
    const ebayScope = nock('http://localhost:8099', {
      badheaders: ['x-ebay-api-iaf-token'],
    })
      .post('/ws/api.dll')
      .reply(
        200,
        `<GetItemResponse xmlns="urn:ebay:apis:eBLBaseComponents"><Ack>Success</Ack></GetItemResponse>`,
      );

    await expect(
      tradingTransport.execute({
        callName: 'GetItem',
        requestDocument: { ItemID: '12345' },
      }),
    ).resolves.toEqual({ Ack: 'Success' });
    expect(ebayApiClient.getOAuthClient).not.toHaveBeenCalled();
    ebayScope.done();
  });
});
