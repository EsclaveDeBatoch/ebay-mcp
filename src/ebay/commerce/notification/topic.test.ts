import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import {
  notificationTopicDocument,
  notificationTopicPageDocument,
} from '@tests/fixtures/notificationTopic.js';

import {
  getTopic,
  getTopicArgumentsSchema,
  getTopics,
  getTopicsArgumentsSchema,
  type NotificationTopic,
  type NotificationTopicPage,
  type TopicLookupArguments,
  type TopicSearchArguments,
} from './topic.js';

const topicLookup: TopicLookupArguments = {
  topic_id: 'MARKETPLACE_ACCOUNT_DELETION',
};
const topicSearch: TopicSearchArguments = {
  continuation_token: 'next-topic-page',
  limit: '20',
};

describe('Commerce Notification topic arguments', () => {
  it('accepts the exact eBay topic path field', () => {
    expect(getTopicArgumentsSchema.parse(topicLookup)).toEqual(topicLookup);
  });

  it.each([
    {},
    { topic_id: '' },
    { topicId: 'MARKETPLACE_ACCOUNT_DELETION' },
    { topic_id: 'MARKETPLACE_ACCOUNT_DELETION', cache: true },
  ])('rejects a missing, renamed, empty, or unknown topic path field', (invalidTopicLookup) => {
    expect(getTopicArgumentsSchema.safeParse(invalidTopicLookup).success).toBe(false);
  });

  it.each([{}, { limit: '10' }, { limit: '100' }, topicSearch])(
    'accepts exact optional topic search fields',
    (acceptedTopicSearch) => {
      expect(getTopicsArgumentsSchema.parse(acceptedTopicSearch)).toEqual(acceptedTopicSearch);
    },
  );

  it.each([
    { limit: 20 },
    { limit: '9' },
    { limit: '101' },
    { limit: '020' },
    { continuation_token: '' },
    { continuationToken: 'next-topic-page' },
    { category: 'ORDER' },
  ])('rejects non-wire or out-of-range topic search fields', (invalidTopicSearch) => {
    expect(getTopicsArgumentsSchema.safeParse(invalidTopicSearch).success).toBe(false);
  });
});

describe('Commerce Notification topic operations', () => {
  it('encodes the topic ID and returns the generated topic unchanged', async () => {
    const successfulLookup: EbayRequestCompletion<NotificationTopic> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationTopicDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const lookupCompletion = await getTopic(sellerSession, {
      topic_id: 'ORDER/CREATED',
    });

    expect(getCalls).toEqual([{ endpoint: '/commerce/notification/v1/topic/ORDER%2FCREATED' }]);
    expect(lookupCompletion).toBe(successfulLookup);
  });

  it('passes exact eBay pagination fields and returns the generated page unchanged', async () => {
    const successfulSearch: EbayRequestCompletion<NotificationTopicPage> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationTopicPageDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulSearch);

    const searchCompletion = await getTopics(sellerSession, topicSearch);

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/topic',
        searchParameters: topicSearch,
      },
    ]);
    expect(searchCompletion).toBe(successfulSearch);
  });

  it('uses an empty search document when pagination is omitted', async () => {
    const successfulSearch: EbayRequestCompletion<NotificationTopicPage> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: notificationTopicPageDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulSearch);

    await getTopics(sellerSession);

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/topic',
        searchParameters: {},
      },
    ]);
  });

  it.each(ebayFailures)('passes a $kind topic lookup failure through', async (ebayFailure) => {
    const failedLookup: EbayRequestCompletion<NotificationTopic> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedLookup);

    await expect(getTopic(sellerSession, topicLookup)).resolves.toBe(failedLookup);
  });

  it.each(ebayFailures)('passes a $kind topic search failure through', async (ebayFailure) => {
    const failedSearch: EbayRequestCompletion<NotificationTopicPage> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedSearch);

    await expect(getTopics(sellerSession, topicSearch)).resolves.toBe(failedSearch);
  });
});
