import type {
  ConversationMessages,
  ConversationPage,
} from '@/ebay/commerce/message/conversation.js';

export const conversationPageDocument: ConversationPage = {
  conversations: [
    {
      conversationId: 'conversation-123',
      conversationStatus: 'ACTIVE',
      conversationTitle: 'Question about the vintage camera',
      conversationType: 'FROM_MEMBERS',
      createdDate: '2026-07-20T10:00:00.000Z',
      latestMessage: {
        createdDate: '2026-07-20T10:30:00.000Z',
        messageBody: 'Does the camera include its original case?',
        messageId: 'message-123',
        readStatus: false,
        recipientUsername: 'seller-123',
        senderUsername: 'buyer-123',
        subject: 'Vintage camera',
      },
      referenceId: '110000000000',
      referenceType: 'LISTING',
      unreadCount: 1,
    },
  ],
  href: '/commerce/message/v1/conversation?limit=25&offset=0',
  limit: 25,
  offset: 0,
  total: 1,
};

export const conversationMessagesDocument: ConversationMessages = {
  conversationStatus: 'ACTIVE',
  conversationTitle: 'Question about the vintage camera',
  conversationType: 'FROM_MEMBERS',
  href: '/commerce/message/v1/conversation/conversation-123?limit=25&offset=0',
  limit: 25,
  messages: [
    {
      createdDate: '2026-07-20T10:30:00.000Z',
      messageBody: 'Does the camera include its original case?',
      messageId: 'message-123',
      readStatus: false,
      recipientUsername: 'seller-123',
      senderUsername: 'buyer-123',
      subject: 'Vintage camera',
    },
  ],
  offset: 0,
  total: 1,
};
