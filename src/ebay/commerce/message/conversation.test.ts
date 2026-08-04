import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import {
  conversationMessagesDocument,
  conversationPageDocument,
} from '@tests/fixtures/conversation.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import {
  getConversation,
  getConversationArgumentsSchema,
  getConversations,
  getConversationsArgumentsSchema,
  type ConversationLookupArguments,
  type ConversationMessages,
  type ConversationPage,
  type ConversationSearchArguments,
} from './conversation.js';

const conversationSearchArguments: ConversationSearchArguments = {
  conversation_status: 'ACTIVE',
  conversation_type: 'FROM_MEMBERS',
  end_time: '2026-07-31T23:59:59.000Z',
  limit: '25',
  offset: '0',
  other_party_username: 'buyer-123',
  reference_id: '110000000000',
  reference_type: 'LISTING',
  start_time: '2026-07-01T00:00:00.000Z',
};

const conversationLookupArguments: ConversationLookupArguments = {
  conversation_id: 'conversation-123',
  conversation_type: 'FROM_MEMBERS',
  limit: '25',
  offset: '0',
};

describe('Commerce Message conversation arguments', () => {
  it('accepts the exact eBay conversation-search query', () => {
    expect(getConversationsArgumentsSchema.parse(conversationSearchArguments)).toEqual(
      conversationSearchArguments,
    );
  });

  it.each([
    { conversationType: 'FROM_MEMBERS' },
    { conversation_type: 'MEMBERS' },
    { conversation_type: 'FROM_MEMBERS', limit: 25 },
    { conversation_type: 'FROM_MEMBERS', limit: '51' },
    { conversation_type: 'FROM_MEMBERS', offset: '-1' },
    { conversation_status: 'DELETED', conversation_type: 'FROM_MEMBERS' },
  ])('rejects renamed fields, invalid enums, and invalid pagination', (invalidArguments) => {
    expect(getConversationsArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
  });

  it('requires a listing reference type when filtering by reference ID', () => {
    expect(() =>
      getConversationsArgumentsSchema.parse({
        conversation_type: 'FROM_MEMBERS',
        reference_id: '110000000000',
      }),
    ).toThrow('reference_type is required when reference_id is provided');
  });

  it('rejects member-only time filters for eBay conversations', () => {
    expect(() =>
      getConversationsArgumentsSchema.parse({
        conversation_type: 'FROM_EBAY',
        start_time: '2026-07-01T00:00:00.000Z',
      }),
    ).toThrow('time filters are supported only for FROM_MEMBERS conversations');
  });

  it('rejects a start time that is not earlier than the end time', () => {
    expect(() =>
      getConversationsArgumentsSchema.parse({
        conversation_type: 'FROM_MEMBERS',
        end_time: '2026-07-01T00:00:00.000Z',
        start_time: '2026-07-31T23:59:59.000Z',
      }),
    ).toThrow('start_time must be earlier than end_time');
  });

  it('accepts the exact eBay conversation path and query fields', () => {
    expect(getConversationArgumentsSchema.parse(conversationLookupArguments)).toEqual(
      conversationLookupArguments,
    );
  });

  it.each([
    { conversation_id: '', conversation_type: 'FROM_MEMBERS' },
    { conversation_id: 'conversation-123', conversation_type: 'BUYER' },
    { conversationId: 'conversation-123', conversationType: 'FROM_MEMBERS' },
    { conversation_id: 'conversation-123', conversation_type: 'FROM_MEMBERS', limit: '0' },
  ])('rejects invalid or renamed conversation lookup fields', (invalidArguments) => {
    expect(getConversationArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
  });
});

describe('Commerce Message conversation operations', () => {
  it('retrieves the unchanged conversation page from the official endpoint', async () => {
    const successfulSearch: EbayRequestCompletion<ConversationPage> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: conversationPageDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulSearch);

    const searchCompletion = await getConversations(sellerSession, conversationSearchArguments);

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/message/v1/conversation',
        searchParameters: conversationSearchArguments,
      },
    ]);
    expect(searchCompletion).toBe(successfulSearch);
  });

  it('encodes the conversation ID and keeps it out of the query', async () => {
    const successfulLookup: EbayRequestCompletion<ConversationMessages> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: conversationMessagesDocument,
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);
    const encodedConversationLookup: ConversationLookupArguments = {
      ...conversationLookupArguments,
      conversation_id: 'conversation/123',
    };

    const lookupCompletion = await getConversation(sellerSession, encodedConversationLookup);

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/message/v1/conversation/conversation%2F123',
        searchParameters: {
          conversation_type: 'FROM_MEMBERS',
          limit: '25',
          offset: '0',
        },
      },
    ]);
    expect(lookupCompletion).toBe(successfulLookup);
  });

  it.each(ebayFailures)(
    'passes a $kind conversation-search failure through',
    async (ebayFailure) => {
      const failedSearch: EbayRequestCompletion<ConversationPage> = {
        kind: 'ebayRequestFailed',
        ebayFailure,
      };
      const { sellerSession } = sellerSessionReturning(failedSearch);

      await expect(getConversations(sellerSession, conversationSearchArguments)).resolves.toBe(
        failedSearch,
      );
    },
  );

  it.each(ebayFailures)(
    'passes a $kind conversation lookup failure through',
    async (ebayFailure) => {
      const failedLookup: EbayRequestCompletion<ConversationMessages> = {
        kind: 'ebayRequestFailed',
        ebayFailure,
      };
      const { sellerSession } = sellerSessionReturning(failedLookup);

      await expect(getConversation(sellerSession, conversationLookupArguments)).resolves.toBe(
        failedLookup,
      );
    },
  );
});
