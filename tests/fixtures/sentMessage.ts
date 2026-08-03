import type { SentMessage } from '@/ebay/commerce/message/sendMessage.js';

export const sentMessageDocument: SentMessage = {
  createdDate: '2026-08-03T09:30:00.000Z',
  messageBody: 'The camera includes its original case.',
  messageId: 'message-456',
  messageMedia: [
    {
      mediaName: 'camera-case.jpg',
      mediaType: 'IMAGE',
      mediaUrl: 'https://media.example.com/camera-case.jpg',
    },
  ],
  readStatus: false,
  recipientUserName: 'buyer-123',
  senderUserName: 'seller-123',
  subject: 'Vintage camera',
};
