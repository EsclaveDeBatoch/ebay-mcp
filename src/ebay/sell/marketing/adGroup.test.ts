import { describe, expect, it } from 'vitest';

import {
  adGroupPathArgumentsSchema,
  createAdGroup,
  createAdGroupArgumentsSchema,
  getAdGroup,
  getAdGroups,
  getAdGroupsArgumentsSchema,
  suggestBids,
  suggestBidsArgumentsSchema,
  suggestKeywords,
  suggestKeywordsArgumentsSchema,
  updateAdGroup,
  updateAdGroupArgumentsSchema,
} from '@/ebay/sell/marketing/adGroup.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

describe('Sell Marketing ad group schemas', () => {
  it('accepts exact path, query wire keys, and direct documents', () => {
    expect(
      getAdGroupsArgumentsSchema.parse({
        campaign_id: 'C1',
        ad_group_status: 'RUNNING',
        limit: '25',
        offset: '0',
      }),
    ).toEqual({
      campaign_id: 'C1',
      ad_group_status: 'RUNNING',
      limit: '25',
      offset: '0',
    });
    expect(adGroupPathArgumentsSchema.parse({ campaign_id: 'C1', ad_group_id: 'G1' })).toEqual({
      campaign_id: 'C1',
      ad_group_id: 'G1',
    });
    expect(
      createAdGroupArgumentsSchema.parse({
        campaign_id: 'C1',
        name: 'Cameras',
        defaultBid: { currency: 'USD', value: '0.50' },
      }),
    ).toEqual({
      campaign_id: 'C1',
      name: 'Cameras',
      defaultBid: { currency: 'USD', value: '0.50' },
    });
    expect(
      updateAdGroupArgumentsSchema.parse({
        campaign_id: 'C1',
        ad_group_id: 'G1',
        name: 'Lenses',
        adGroupStatus: 'RUNNING',
        defaultBid: { currency: 'USD', value: '0.75' },
      }),
    ).toEqual({
      campaign_id: 'C1',
      ad_group_id: 'G1',
      name: 'Lenses',
      adGroupStatus: 'RUNNING',
      defaultBid: { currency: 'USD', value: '0.75' },
    });
    expect(
      suggestBidsArgumentsSchema.parse({
        campaign_id: 'C1',
        ad_group_id: 'G1',
        keywords: [{ keywordText: 'camera', matchType: 'EXACT' }],
      }),
    ).toEqual({
      campaign_id: 'C1',
      ad_group_id: 'G1',
      keywords: [{ keywordText: 'camera', matchType: 'EXACT' }],
    });
    expect(
      suggestKeywordsArgumentsSchema.parse({
        campaign_id: 'C1',
        ad_group_id: 'G1',
        listingIds: ['1'],
        matchType: 'BROAD',
        additionalInfo: ['KEYWORD_INSIGHTS'],
        exclusions: ['ADOPTED_KEYWORDS'],
      }),
    ).toEqual({
      campaign_id: 'C1',
      ad_group_id: 'G1',
      listingIds: ['1'],
      matchType: 'BROAD',
      additionalInfo: ['KEYWORD_INSIGHTS'],
      exclusions: ['ADOPTED_KEYWORDS'],
    });
  });

  it.each([
    { campaignId: 'C1' },
    { campaign_id: 'C1', limit: 25 },
    { campaign_id: 'C1', limit: '0' },
    { campaign_id: 'C1', adGroupStatus: 'RUNNING' },
    {
      campaign_id: 'C1',
      request: { name: 'Cameras' },
    },
    {
      campaign_id: 'C1',
      body: { name: 'Cameras' },
    },
    {
      campaign_id: 'C1',
      'Content-Type': 'application/json',
      name: 'Cameras',
    },
    { ad_group_id: 'G1' },
    { campaign_id: '', ad_group_id: 'G1' },
    {
      campaign_id: 'C1',
      ad_group_id: 'G1',
      defaultBid: { currency: 'usd', value: '0.50' },
    },
  ])('rejects aliases, wrappers, transport headers, and invalid fields', (invalidArguments) => {
    expect(() => createAdGroupArgumentsSchema.parse(invalidArguments)).toThrow();
    expect(() => getAdGroupsArgumentsSchema.parse(invalidArguments)).toThrow();
    expect(() => adGroupPathArgumentsSchema.parse(invalidArguments)).toThrow();
    expect(() => updateAdGroupArgumentsSchema.parse(invalidArguments)).toThrow();
  });

  it.each([
    {
      campaign_id: 'C1',
      ad_group_id: 'G1',
      keywords: [],
    },
    {
      campaign_id: 'C1',
      ad_group_id: 'G1',
      keywords: [{ keywordText: 'camera', matchType: 'FUZZY' }],
    },
    {
      campaign_id: 'C1',
      ad_group_id: 'G1',
      request: { keywords: [{ keywordText: 'camera', matchType: 'EXACT' }] },
    },
    {
      campaign_id: 'C1',
      ad_group_id: 'G1',
      matchType: 'FUZZY',
    },
    {
      campaign_id: 'C1',
      ad_group_id: 'G1',
      listingIds: [],
    },
  ])('rejects invalid suggest documents', (invalidArguments) => {
    expect(() => suggestBidsArgumentsSchema.parse(invalidArguments)).toThrow();
    expect(() => suggestKeywordsArgumentsSchema.parse(invalidArguments)).toThrow();
  });
});

describe('Sell Marketing ad group operations', () => {
  it('uses exact query wire keys and encoded campaign and ad-group paths', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getAdGroups(sellerSession, {
      campaign_id: 'C/1',
      ad_group_status: 'RUNNING',
      limit: '25',
      offset: '0',
    });
    await getAdGroup(sellerSession, { campaign_id: 'C/1', ad_group_id: 'G/1' });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/ad_group',
        searchParameters: {
          ad_group_status: 'RUNNING',
          limit: '25',
          offset: '0',
        },
      },
      { endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/ad_group/G%2F1' },
    ]);
  });

  it('posts and puts direct ad-group documents without path or transport wrappers', async () => {
    const { sellerSession, postCalls, putCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await createAdGroup(sellerSession, {
      campaign_id: 'C/1',
      name: 'Cameras',
      defaultBid: { currency: 'USD', value: '0.50' },
    });
    await updateAdGroup(sellerSession, {
      campaign_id: 'C/1',
      ad_group_id: 'G/1',
      name: 'Lenses',
      adGroupStatus: 'RUNNING',
    });
    await suggestBids(sellerSession, {
      campaign_id: 'C/1',
      ad_group_id: 'G/1',
      keywords: [{ keywordText: 'camera', matchType: 'EXACT' }],
    });
    await suggestKeywords(sellerSession, {
      campaign_id: 'C/1',
      ad_group_id: 'G/1',
      listingIds: ['1'],
      matchType: 'BROAD',
      additionalInfo: ['KEYWORD_INSIGHTS'],
      exclusions: ['ADOPTED_KEYWORDS'],
    });

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/ad_group',
        requestDocument: {
          name: 'Cameras',
          defaultBid: { currency: 'USD', value: '0.50' },
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/ad_group/G%2F1/suggest_bids',
        requestDocument: {
          keywords: [{ keywordText: 'camera', matchType: 'EXACT' }],
        },
      },
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/ad_group/G%2F1/suggest_keywords',
        requestDocument: {
          listingIds: ['1'],
          matchType: 'BROAD',
          additionalInfo: ['KEYWORD_INSIGHTS'],
          exclusions: ['ADOPTED_KEYWORDS'],
        },
      },
    ]);
    expect(putCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/ad_campaign/C%2F1/ad_group/G%2F1',
        requestDocument: {
          name: 'Lenses',
          adGroupStatus: 'RUNNING',
        },
      },
    ]);
  });
});
