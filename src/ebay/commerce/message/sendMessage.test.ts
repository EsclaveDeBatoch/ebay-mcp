import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { sentMessageDocument } from '@tests/fixtures/sentMessage.js';

import {
  sendMessage,
  sendMessageArgumentsSchema,
  type SendMessageArguments,
  type SentMessage,
} from './sendMessage.js';

const existingConversationMessage: SendMessageArguments = {
  conversationId: 'conversation-123',
  emailCopyToSender: true,
  messageText: 'The camera includes its original case.',
};

const newConversationMessage: SendMessageArguments = {
  messageMedia: [
    {
      mediaName: 'camera-case.jpg',
      mediaType: 'IMAGE',
      mediaUrl: 'https://media.example.com/camera-case.jpg',
    },
  ],
  otherPartyUsername: 'buyer-123',
  reference: {
    referenceId: '110000000000',
    referenceType: 'LISTING',
  },
};

describe('Commerce Message send-message arguments', () => {
  it('accepts text for an existing conversation', () => {
    expect(sendMessageArgumentsSchema.parse(existingConversationMessage)).toEqual(
      existingConversationMessage,
    );
  });

  it('accepts complete attachments for a new listing conversation', () => {
    expect(sendMessageArgumentsSchema.parse(newConversationMessage)).toEqual(
      newConversationMessage,
    );
  });

  it('requires exactly one destination selector', () => {
    expect(() =>
      sendMessageArgumentsSchema.parse({ messageText: 'Where should this go?' }),
    ).toThrow('Provide exactly one of conversationId or otherPartyUsername');

    expect(() =>
      sendMessageArgumentsSchema.parse({
        conversationId: 'conversation-123',
        messageText: 'This has two destinations.',
        otherPartyUsername: 'buyer-123',
      }),
    ).toThrow('Provide exactly one of conversationId or otherPartyUsername');
  });

  it('requires message text or at least one attachment', () => {
    expect(() => sendMessageArgumentsSchema.parse({ conversationId: 'conversation-123' })).toThrow(
      'Provide messageText or at least one messageMedia attachment',
    );
  });

  it('rejects blank and overlong message text', () => {
    expect(() =>
      sendMessageArgumentsSchema.parse({
        conversationId: 'conversation-123',
        messageText: '',
      }),
    ).toThrow();

    expect(() =>
      sendMessageArgumentsSchema.parse({
        conversationId: 'conversation-123',
        messageText: 'x'.repeat(2001),
      }),
    ).toThrow();
  });

  it('accepts no more than five attachments', () => {
    expect(() =>
      sendMessageArgumentsSchema.parse({
        conversationId: 'conversation-123',
        messageMedia: Array.from({ length: 6 }, (_, attachmentIndex) => ({
          mediaName: `attachment-${attachmentIndex}.txt`,
          mediaType: 'TXT',
          mediaUrl: `https://media.example.com/attachment-${attachmentIndex}.txt`,
        })),
      }),
    ).toThrow();
  });

  it.each([
    { mediaType: 'IMAGE', mediaUrl: 'https://media.example.com/camera.jpg' },
    { mediaName: 'camera.jpg', mediaUrl: 'https://media.example.com/camera.jpg' },
    { mediaName: 'camera.jpg', mediaType: 'IMAGE' },
    {
      mediaName: 'camera.jpg',
      mediaType: 'VIDEO',
      mediaUrl: 'https://media.example.com/camera.jpg',
    },
    {
      mediaName: 'camera.jpg',
      mediaType: 'IMAGE',
      mediaUrl: 'http://media.example.com/camera.jpg',
    },
  ])('rejects an incomplete or unsupported attachment', (invalidAttachment) => {
    expect(() =>
      sendMessageArgumentsSchema.parse({
        conversationId: 'conversation-123',
        messageMedia: [invalidAttachment],
      }),
    ).toThrow();
  });

  it.each([
    { referenceId: '110000000000' },
    { referenceType: 'LISTING' },
    { referenceId: '0', referenceType: 'LISTING' },
    { referenceId: '110000000000', referenceType: 'ORDER' },
  ])('rejects an incomplete or unsupported listing reference', (invalidReference) => {
    expect(() =>
      sendMessageArgumentsSchema.parse({
        ...existingConversationMessage,
        reference: invalidReference,
      }),
    ).toThrow();
  });

  it('rejects fields not accepted by the eBay endpoint', () => {
    expect(() =>
      sendMessageArgumentsSchema.parse({
        ...existingConversationMessage,
        recipient: 'buyer-123',
      }),
    ).toThrow();
  });
});

describe('Commerce Message send-message operation', () => {
  it('posts the unchanged message document to the official endpoint', async () => {
    const successfulMessage: EbayRequestCompletion<SentMessage> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: sentMessageDocument,
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulMessage);

    const messageCompletion = await sendMessage(sellerSession, newConversationMessage);

    expect(postCalls).toEqual([
      {
        endpoint: '/commerce/message/v1/send_message',
        requestDocument: newConversationMessage,
      },
    ]);
    expect(messageCompletion).toBe(successfulMessage);
  });

  it.each(ebayFailures)('passes a $kind failure through', async (ebayFailure) => {
    const failedMessage: EbayRequestCompletion<SentMessage> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedMessage);

    await expect(sendMessage(sellerSession, existingConversationMessage)).resolves.toBe(
      failedMessage,
    );
  });
});
