import type { ConversationUpdateBatch } from '@/ebay/commerce/message/bulkUpdateConversation.js';

export const conversationUpdateBatchDocument: ConversationUpdateBatch = {
  conversationsMetadata: {
    totalConversationsCount: 2,
    updateFailureCount: 0,
    updateSuccessCount: 2,
  },
  conversationsResponse: [
    { conversationId: 'conversation-123', updateStatus: 'SUCCESSFUL' },
    { conversationId: 'conversation-456', updateStatus: 'SUCCESSFUL' },
  ],
};
