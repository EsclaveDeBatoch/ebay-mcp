import { describe, expect, it } from 'vitest';

import {
  bulkCreateNegativeKeyword,
  bulkCreateNegativeKeywordArgumentsSchema,
  bulkUpdateNegativeKeyword,
  bulkUpdateNegativeKeywordArgumentsSchema,
  createNegativeKeyword,
  createNegativeKeywordArgumentsSchema,
  getNegativeKeyword,
  getNegativeKeywordArgumentsSchema,
  getNegativeKeywords,
  getNegativeKeywordsArgumentsSchema,
  updateNegativeKeyword,
  updateNegativeKeywordArgumentsSchema,
} from '@/ebay/sell/marketing/negativeKeyword.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

const negativeKeywordCreation = {
  campaignId: 'CAMPAIGN-1',
  adGroupId: 'ADGROUP-1',
  negativeKeywordMatchType: 'EXACT' as const,
  negativeKeywordText: 'cheap',
};

describe('Sell Marketing negative keyword schemas', () => {
  it('accepts exact query wire keys and direct negative keyword documents', () => {
    expect(
      getNegativeKeywordsArgumentsSchema.parse({
        ad_group_ids: 'ADGROUP-1',
        campaign_ids: 'CAMPAIGN-1,CAMPAIGN-2',
        limit: '25',
        negative_keyword_status: 'ACTIVE',
        offset: '0',
      }),
    ).toEqual({
      ad_group_ids: 'ADGROUP-1',
      campaign_ids: 'CAMPAIGN-1,CAMPAIGN-2',
      limit: '25',
      negative_keyword_status: 'ACTIVE',
      offset: '0',
    });
    expect(getNegativeKeywordArgumentsSchema.parse({ negative_keyword_id: 'NEG-1' })).toEqual({
      negative_keyword_id: 'NEG-1',
    });
    expect(createNegativeKeywordArgumentsSchema.parse(negativeKeywordCreation)).toEqual(
      negativeKeywordCreation,
    );
    expect(
      updateNegativeKeywordArgumentsSchema.parse({
        negative_keyword_id: 'NEG-1',
        negativeKeywordStatus: 'ARCHIVED',
      }),
    ).toEqual({
      negative_keyword_id: 'NEG-1',
      negativeKeywordStatus: 'ARCHIVED',
    });
    expect(
      bulkCreateNegativeKeywordArgumentsSchema.parse({
        requests: [negativeKeywordCreation],
      }),
    ).toEqual({ requests: [negativeKeywordCreation] });
    expect(
      bulkUpdateNegativeKeywordArgumentsSchema.parse({
        requests: [{ negativeKeywordId: 'NEG-1', negativeKeywordStatus: 'ARCHIVED' }],
      }),
    ).toEqual({
      requests: [{ negativeKeywordId: 'NEG-1', negativeKeywordStatus: 'ARCHIVED' }],
    });
  });

  it.each([
    { campaignIds: 'CAMPAIGN-1' },
    { limit: 25 },
    { limit: '0' },
    { negativeKeywordStatus: 'ACTIVE' },
    { adGroupIds: 'ADGROUP-1' },
    {
      request: negativeKeywordCreation,
    },
    {
      ...negativeKeywordCreation,
      'Content-Type': 'application/json',
    },
    {
      requests: [],
    },
    {
      negativeKeywordId: 'NEG-1',
    },
  ])('rejects aliases, wrappers, transport headers, and invalid fields', (invalidArguments) => {
    expect(() => getNegativeKeywordsArgumentsSchema.parse(invalidArguments)).toThrow();
    expect(() => createNegativeKeywordArgumentsSchema.parse(invalidArguments)).toThrow();
    expect(() => bulkCreateNegativeKeywordArgumentsSchema.parse(invalidArguments)).toThrow();
    expect(() => getNegativeKeywordArgumentsSchema.parse(invalidArguments)).toThrow();
  });
});

describe('Sell Marketing negative keyword operations', () => {
  it('uses exact query wire keys and encoded negative keyword paths', async () => {
    const { sellerSession, getCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await getNegativeKeywords(sellerSession, {
      ad_group_ids: 'ADGROUP-1',
      campaign_ids: 'CAMPAIGN-1',
      limit: '25',
      negative_keyword_status: 'ACTIVE',
      offset: '0',
    });
    await getNegativeKeyword(sellerSession, { negative_keyword_id: 'NEG/1' });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/negative_keyword',
        searchParameters: {
          ad_group_ids: 'ADGROUP-1',
          campaign_ids: 'CAMPAIGN-1',
          limit: '25',
          negative_keyword_status: 'ACTIVE',
          offset: '0',
        },
      },
      {
        endpoint: '/sell/marketing/v1/negative_keyword/NEG%2F1',
      },
    ]);
  });

  it('posts and puts direct negative keyword documents without Content-Type', async () => {
    const { sellerSession, postCalls, putCalls } = sellerSessionReturning<unknown>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    await createNegativeKeyword(sellerSession, negativeKeywordCreation);
    await bulkCreateNegativeKeyword(sellerSession, {
      requests: [negativeKeywordCreation],
    });
    await bulkUpdateNegativeKeyword(sellerSession, {
      requests: [{ negativeKeywordId: 'NEG-1', negativeKeywordStatus: 'ARCHIVED' }],
    });
    await updateNegativeKeyword(sellerSession, {
      negative_keyword_id: 'NEG/1',
      negativeKeywordStatus: 'ARCHIVED',
    });

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/negative_keyword',
        requestDocument: negativeKeywordCreation,
      },
      {
        endpoint: '/sell/marketing/v1/bulk_create_negative_keyword',
        requestDocument: { requests: [negativeKeywordCreation] },
      },
      {
        endpoint: '/sell/marketing/v1/bulk_update_negative_keyword',
        requestDocument: {
          requests: [{ negativeKeywordId: 'NEG-1', negativeKeywordStatus: 'ARCHIVED' }],
        },
      },
    ]);
    expect(putCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/negative_keyword/NEG%2F1',
        requestDocument: { negativeKeywordStatus: 'ARCHIVED' },
      },
    ]);
  });
});
