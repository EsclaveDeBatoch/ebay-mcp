import { describe, expect, it } from 'vitest';

import {
  bulkCreateKeyword,
  bulkCreateKeywordArgumentsSchema,
  bulkUpdateKeyword,
  bulkUpdateKeywordArgumentsSchema,
  createKeyword,
  createKeywordArgumentsSchema,
  getKeyword,
  getKeywordArgumentsSchema,
  getKeywords,
  getKeywordsArgumentsSchema,
  updateKeyword,
  updateKeywordArgumentsSchema,
} from '@/ebay/sell/marketing/keyword.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

const keywordCreation = {
  campaign_id: 'CAMPAIGN-1',
  adGroupId: 'ADGROUP-1',
  keywordText: 'camera lens',
  matchType: 'EXACT' as const,
  bid: { currency: 'USD', value: '0.50' },
};

describe('Sell Marketing keyword schemas', () => {
  it('accepts exact path, query wire keys, and direct keyword documents', () => {
    expect(
      getKeywordsArgumentsSchema.parse({
        campaign_id: 'CAMPAIGN-1',
        ad_group_ids: 'ADGROUP-1,ADGROUP-2',
        keyword_status: 'ACTIVE',
        limit: '25',
        offset: '0',
      }),
    ).toEqual({
      campaign_id: 'CAMPAIGN-1',
      ad_group_ids: 'ADGROUP-1,ADGROUP-2',
      keyword_status: 'ACTIVE',
      limit: '25',
      offset: '0',
    });
    expect(
      getKeywordArgumentsSchema.parse({ campaign_id: 'CAMPAIGN-1', keyword_id: 'KEYWORD-1' }),
    ).toEqual({ campaign_id: 'CAMPAIGN-1', keyword_id: 'KEYWORD-1' });
    expect(createKeywordArgumentsSchema.parse(keywordCreation)).toEqual(keywordCreation);
    expect(
      updateKeywordArgumentsSchema.parse({
        campaign_id: 'CAMPAIGN-1',
        keyword_id: 'KEYWORD-1',
        keywordStatus: 'PAUSED',
        bid: { currency: 'USD', value: '0.75' },
      }),
    ).toEqual({
      campaign_id: 'CAMPAIGN-1',
      keyword_id: 'KEYWORD-1',
      keywordStatus: 'PAUSED',
      bid: { currency: 'USD', value: '0.75' },
    });
    expect(
      bulkCreateKeywordArgumentsSchema.parse({
        campaign_id: 'CAMPAIGN-1',
        requests: [
          {
            adGroupId: 'ADGROUP-1',
            keywordText: 'camera',
            matchType: 'BROAD',
          },
        ],
      }),
    ).toEqual({
      campaign_id: 'CAMPAIGN-1',
      requests: [
        {
          adGroupId: 'ADGROUP-1',
          keywordText: 'camera',
          matchType: 'BROAD',
        },
      ],
    });
    expect(
      bulkUpdateKeywordArgumentsSchema.parse({
        campaign_id: 'CAMPAIGN-1',
        requests: [{ keywordId: 'KEYWORD-1', keywordStatus: 'ARCHIVED' }],
      }),
    ).toEqual({
      campaign_id: 'CAMPAIGN-1',
      requests: [{ keywordId: 'KEYWORD-1', keywordStatus: 'ARCHIVED' }],
    });
  });

  it.each([
    { campaignId: 'CAMPAIGN-1' },
    { campaign_id: 'CAMPAIGN-1', limit: 25 },
    { campaign_id: 'CAMPAIGN-1', limit: '0' },
    { campaign_id: 'CAMPAIGN-1', keywordStatus: 'ACTIVE' },
    { campaign_id: 'CAMPAIGN-1', adGroupIds: 'ADGROUP-1' },
    {
      campaign_id: 'CAMPAIGN-1',
      request: {
        adGroupId: 'ADGROUP-1',
        keywordText: 'camera',
        matchType: 'EXACT',
      },
    },
    {
      campaign_id: 'CAMPAIGN-1',
      adGroupId: 'ADGROUP-1',
      keywordText: 'camera',
      matchType: 'EXACT',
      'Content-Type': 'application/json',
    },
    {
      campaign_id: 'CAMPAIGN-1',
      requests: [],
    },
  ])('rejects aliases, wrappers, transport headers, and invalid fields', (invalidArguments) => {
    expect(() => createKeywordArgumentsSchema.parse(invalidArguments)).toThrow();
    expect(() => bulkCreateKeywordArgumentsSchema.parse(invalidArguments)).toThrow();
  });
});

describe('Sell Marketing keyword operations', () => {
  it('uses exact query wire keys and encoded campaign keyword paths', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getKeywords(sellerSession, {
      campaign_id: 'CAMPAIGN/1',
      ad_group_ids: 'ADGROUP-1',
      keyword_status: 'ACTIVE',
      limit: '25',
      offset: '0',
    });
    await getKeyword(sellerSession, {
      campaign_id: 'CAMPAIGN/1',
      keyword_id: 'KEYWORD/1',
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN%2F1/keyword',
        searchParameters: {
          ad_group_ids: 'ADGROUP-1',
          keyword_status: 'ACTIVE',
          limit: '25',
          offset: '0',
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN%2F1/keyword/KEYWORD%2F1',
      },
    ]);
  });

  it('posts and puts direct keyword documents without Content-Type', async () => {
    const { sellerSession, postCalls, putCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await createKeyword(sellerSession, {
      campaign_id: 'CAMPAIGN/1',
      adGroupId: 'ADGROUP-1',
      keywordText: 'camera lens',
      matchType: 'EXACT',
      bid: { currency: 'USD', value: '0.50' },
    });
    await bulkCreateKeyword(sellerSession, {
      campaign_id: 'CAMPAIGN/1',
      requests: [
        {
          adGroupId: 'ADGROUP-1',
          keywordText: 'camera',
          matchType: 'PHRASE',
        },
      ],
    });
    await bulkUpdateKeyword(sellerSession, {
      campaign_id: 'CAMPAIGN/1',
      requests: [{ keywordId: 'KEYWORD-1', keywordStatus: 'PAUSED' }],
    });
    await updateKeyword(sellerSession, {
      campaign_id: 'CAMPAIGN/1',
      keyword_id: 'KEYWORD/1',
      keywordStatus: 'PAUSED',
    });

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN%2F1/keyword',
        requestDocument: {
          adGroupId: 'ADGROUP-1',
          keywordText: 'camera lens',
          matchType: 'EXACT',
          bid: { currency: 'USD', value: '0.50' },
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN%2F1/bulk_create_keyword',
        requestDocument: {
          requests: [
            {
              adGroupId: 'ADGROUP-1',
              keywordText: 'camera',
              matchType: 'PHRASE',
            },
          ],
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN%2F1/bulk_update_keyword',
        requestDocument: {
          requests: [{ keywordId: 'KEYWORD-1', keywordStatus: 'PAUSED' }],
        },
      },
    ]);
    expect(putCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_campaign/CAMPAIGN%2F1/keyword/KEYWORD%2F1',
        requestDocument: { keywordStatus: 'PAUSED' },
      },
    ]);
  });
});
