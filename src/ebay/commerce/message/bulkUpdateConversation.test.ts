import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { conversationUpdateBatchDocument } from '@tests/fixtures/conversationUpdateBatch.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import {
  bulkUpdateConversation,
  bulkUpdateConversationArgumentsSchema,
  type BulkConversationUpdateArguments,
  type ConversationUpdateBatch,
} from './bulkUpdateConversation.js';

const conversationUpdates: BulkConversationUpdateArguments = {
  conversations: [
    {
      conversationId: 'conversation-123',
      conversationStatus: 'ARCHIVE',
      conversationType: 'FROM_MEMBERS',
    },
    {
      conversationId: 'conversation-456',
      conversationStatus: 'READ',
      conversationType: 'FROM_EBAY',
    },
  ],
};

describe('Commerce Message bulk-update-conversation arguments', () => {
  it('accepts complete updates using exact eBay fields', () => {
    expect(bulkUpdateConversationArgumentsSchema.parse(conversationUpdates)).toEqual(
      conversationUpdates,
    );
  });

  it('accepts each documented conversation status', () => {
    const documentedStatuses = ['ACTIVE', 'ARCHIVE', 'DELETE', 'READ', 'UNREAD'] as const;

    for (const conversationStatus of documentedStatuses) {
      expect(
        bulkUpdateConversationArgumentsSchema.parse({
          conversations: [
            {
              conversationId: 'conversation-123',
              conversationStatus,
              conversationType: 'FROM_MEMBERS',
            },
          ],
        }),
      ).toMatchObject({ conversations: [{ conversationStatus }] });
    }
  });

  it.each([
    {},
    { conversations: [] },
    {
      conversations: Array.from({ length: 11 }, () => ({
        conversationId: 'conversation-123',
        conversationStatus: 'ARCHIVE',
        conversationType: 'FROM_MEMBERS',
      })),
    },
  ])('requires between one and ten conversations', (invalidBatch) => {
    expect(bulkUpdateConversationArgumentsSchema.safeParse(invalidBatch).success).toBe(false);
  });

  it.each([
    { conversationStatus: 'ARCHIVE', conversationType: 'FROM_MEMBERS' },
    { conversationId: 'conversation-123', conversationType: 'FROM_MEMBERS' },
    { conversationId: 'conversation-123', conversationStatus: 'ARCHIVE' },
    {
      conversationId: '',
      conversationStatus: 'ARCHIVE',
      conversationType: 'FROM_MEMBERS',
    },
    {
      conversationId: 'conversation-123',
      conversationStatus: 'DONE',
      conversationType: 'FROM_MEMBERS',
    },
    {
      conversationId: 'conversation-123',
      conversationStatus: 'ARCHIVE',
      conversationType: 'MEMBERS',
    },
  ])('rejects incomplete or unsupported conversation updates', (invalidConversationUpdate) => {
    expect(
      bulkUpdateConversationArgumentsSchema.safeParse({
        conversations: [invalidConversationUpdate],
      }).success,
    ).toBe(false);
  });

  it('rejects fields outside the eBay batch document', () => {
    expect(() =>
      bulkUpdateConversationArgumentsSchema.parse({
        ...conversationUpdates,
        continueOnFailure: true,
      }),
    ).toThrow();
  });
});

describe('Commerce Message bulk-update-conversation operation', () => {
  it('posts the unchanged batch and returns the generated report', async () => {
    const successfulBatch: EbayRequestCompletion<ConversationUpdateBatch> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: conversationUpdateBatchDocument,
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulBatch);

    const batchCompletion = await bulkUpdateConversation(sellerSession, conversationUpdates);

    expect(postCalls).toEqual([
      {
        endpoint: '/commerce/message/v1/bulk_update_conversation',
        requestDocument: conversationUpdates,
      },
    ]);
    expect(batchCompletion).toBe(successfulBatch);
  });

  it.each(ebayFailures)('passes a $kind failure through', async (ebayFailure) => {
    const failedBatch: EbayRequestCompletion<ConversationUpdateBatch> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedBatch);

    await expect(bulkUpdateConversation(sellerSession, conversationUpdates)).resolves.toBe(
      failedBatch,
    );
  });
});
