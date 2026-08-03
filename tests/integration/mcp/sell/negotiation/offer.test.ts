import { afterEach, describe, expect, it, vi } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EligibleListings, SentSellerOffers } from '@/ebay/sell/negotiation/offer.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';
import {
  eligibleListingsDocument,
  sellerOfferArguments,
  sentSellerOffersDocument,
} from '@tests/fixtures/negotiation.js';

const findEligibleItemsToolName = 'ebay_sell_negotiation_find_eligible_items';
const sendSellerOfferToolName = 'ebay_sell_negotiation_send_offer_to_interested_buyers';
const eligibleListingsArguments = {
  limit: '10',
  offset: '0',
  'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Negotiation MCP exposure', () => {
  it('exposes both operations once under the official namespace gate', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.negotiation');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<EligibleListings>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: eligibleListingsDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([
      findEligibleItemsToolName,
      sendSellerOfferToolName,
    ]);
    await mcpClient.close();
  });

  it('keeps only the read operation when read-only mode is enabled', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.negotiation');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<EligibleListings>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: eligibleListingsDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);

    expect(listedTools.tools.map((ebayTool) => ebayTool.name)).toEqual([findEligibleItemsToolName]);
    await mcpClient.close();
  });
});

describe('Sell Negotiation eligible-listing MCP calls', () => {
  it('finds eligible listings and returns every generated field unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulLookup: EbayRequestCompletion<EligibleListings> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: eligibleListingsDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      findEligibleItemsToolName,
      eligibleListingsArguments,
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/negotiation/v1/find_eligible_items',
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
        searchParameters: { limit: '10', offset: '0' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(eligibleListingsDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('represents the official no-eligible-items response as empty MCP content', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<EligibleListings>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      findEligibleItemsToolName,
      eligibleListingsArguments,
    );

    expect(toolCompletion).toEqual({ content: [] });
    await mcpClient.close();
  });
});

describe('Sell Negotiation seller-offer MCP calls', () => {
  it('sends one seller offer and returns every generated field unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const successfulOffer: EbayRequestCompletion<SentSellerOffers> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: sentSellerOffersDocument,
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulOffer);

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      sendSellerOfferToolName,
      sellerOfferArguments,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/negotiation/v1/send_offer_to_interested_buyers',
        requestDocument: {
          allowCounterOffer: false,
          message: 'A private offer for this camera',
          offerDuration: { unit: 'DAY', value: 2 },
          offeredItems: [
            {
              discountPercentage: '10',
              listingId: '110000000000',
              quantity: 1,
            },
          ],
        },
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(sentSellerOffersDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });
});

describe('Sell Negotiation MCP validation', () => {
  it('rejects renamed fields and numeric wire values before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<EligibleListings>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: eligibleListingsDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      findEligibleItemsToolName,
      { limit: 10, marketplaceId: 'EBAY_US' },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });

  it('rejects an ambiguous discount document before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<SentSellerOffers>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: sentSellerOffersDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      sendSellerOfferToolName,
      {
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
        offeredItems: [
          {
            discountPercentage: '10',
            listingId: '110000000000',
            price: { currency: 'USD', value: '90.00' },
          },
        ],
      },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(postCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Sell Negotiation MCP failures', () => {
  it.each(ebayFailures)('translates a $kind lookup failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<EligibleListings>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      findEligibleItemsToolName,
      eligibleListingsArguments,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });

  it.each(ebayFailures)('translates a $kind offer failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<SentSellerOffers>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      sendSellerOfferToolName,
      sellerOfferArguments,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });
});
