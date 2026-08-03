import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import {
  updateConversation,
  updateConversationArgumentsSchema,
  type ConversationUpdateArguments,
} from './updateConversation.js';

const statusUpdate: ConversationUpdateArguments = {
  conversationId: 'conversation-123',
  conversationStatus: 'ARCHIVE',
  conversationType: 'FROM_MEMBERS',
};

const unreadUpdate: ConversationUpdateArguments = {
  conversationId: 'conversation-456',
  conversationType: 'FROM_EBAY',
  read: false,
};

describe('Commerce Message update-conversation arguments', () => {
  it('accepts one conversation status change', () => {
    expect(updateConversationArgumentsSchema.parse(statusUpdate)).toEqual(statusUpdate);
  });

  it('preserves false when marking a conversation unread', () => {
    expect(updateConversationArgumentsSchema.parse(unreadUpdate)).toEqual(unreadUpdate);
  });

  it.each([
    { conversationStatus: 'ARCHIVE', conversationType: 'FROM_MEMBERS' },
    { conversationId: 'conversation-123', conversationStatus: 'ARCHIVE' },
    {
      conversationId: '',
      conversationStatus: 'ARCHIVE',
      conversationType: 'FROM_MEMBERS',
    },
  ])('requires the conversation identity and existing type', (incompleteUpdate) => {
    expect(updateConversationArgumentsSchema.safeParse(incompleteUpdate).success).toBe(false);
  });

  it('requires exactly one status mutation', () => {
    expect(() =>
      updateConversationArgumentsSchema.parse({
        conversationId: 'conversation-123',
        conversationType: 'FROM_MEMBERS',
      }),
    ).toThrow('Provide exactly one of conversationStatus or read');

    expect(() =>
      updateConversationArgumentsSchema.parse({
        ...statusUpdate,
        read: true,
      }),
    ).toThrow('Provide exactly one of conversationStatus or read');
  });

  it.each([
    { ...statusUpdate, conversationStatus: 'READ' },
    { ...statusUpdate, conversationType: 'MEMBERS' },
    { ...statusUpdate, status: 'ARCHIVE' },
  ])('rejects unsupported enums and fields', (invalidUpdate) => {
    expect(updateConversationArgumentsSchema.safeParse(invalidUpdate).success).toBe(false);
  });
});

describe('Commerce Message update-conversation operation', () => {
  it('posts the unchanged update document to the official endpoint', async () => {
    const successfulUpdate: EbayRequestCompletion<void> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulUpdate);

    const updateCompletion = await updateConversation(sellerSession, unreadUpdate);

    expect(postCalls).toEqual([
      {
        endpoint: '/commerce/message/v1/update_conversation',
        requestDocument: unreadUpdate,
      },
    ]);
    expect(updateCompletion).toBe(successfulUpdate);
  });

  it.each(ebayFailures)('passes a $kind failure through', async (ebayFailure) => {
    const failedUpdate: EbayRequestCompletion<void> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedUpdate);

    await expect(updateConversation(sellerSession, statusUpdate)).resolves.toBe(failedUpdate);
  });
});
