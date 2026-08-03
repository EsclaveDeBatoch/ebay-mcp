import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageApi } from '@/api/communication/message.js';
import { invalidInput } from '@tests/helpers/invalidInput.js';
import type { EbayApiClient } from '@/api/client.js';
import { Effect } from 'effect';

let client: EbayApiClient;
let api: MessageApi;

beforeEach(() => {
  client = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  } as unknown as EbayApiClient;
  api = new MessageApi(client);
});

describe('updateConversation', () => {
  it('update conversation', async () => {
    const mockResponse = { success: true };
    const updateData = { read: true };
    vi.mocked(client.post).mockResolvedValue(mockResponse);

    await Effect.runPromise(api.updateConversation(updateData));

    expect(client.post).toHaveBeenCalledWith(
      '/commerce/message/v1/update_conversation',
      updateData,
    );
  });

  it('fail when updateData is missing', async () => {
    const error = await Effect.runPromise(
      Effect.flip(api.updateConversation(invalidInput(undefined))),
    );

    expect(error._tag).toBe('EndpointInputError');
    expect(error.message).toContain('updateData is required');
  });
});

describe('bulkUpdateConversation', () => {
  it('bulk update conversations', async () => {
    const mockResponse = { success: true };
    const updateData = {
      conversations: [
        { conversationId: '123', conversationStatus: 'READ', conversationType: 'FROM_MEMBERS' },
        { conversationId: '456', conversationStatus: 'READ', conversationType: 'FROM_MEMBERS' },
      ],
    };
    vi.mocked(client.post).mockResolvedValue(mockResponse);

    await Effect.runPromise(api.bulkUpdateConversation(updateData));

    expect(client.post).toHaveBeenCalledWith(
      '/commerce/message/v1/bulk_update_conversation',
      updateData,
    );
  });

  it('fail when updateData is missing', async () => {
    const error = await Effect.runPromise(
      Effect.flip(api.bulkUpdateConversation(invalidInput(undefined))),
    );

    expect(error._tag).toBe('EndpointInputError');
    expect(error.message).toContain('updateData is required');
  });
});

describe('error handling', () => {
  it('handle API errors in updateConversation', async () => {
    vi.mocked(client.post).mockRejectedValue(new Error('API Error'));

    const error = await Effect.runPromise(Effect.flip(api.updateConversation({ read: true })));

    expect(error._tag).toBe('EbayApiError');
  });

  it('handle API errors in bulkUpdateConversation', async () => {
    vi.mocked(client.post).mockRejectedValue(new Error('API Error'));

    const error = await Effect.runPromise(
      Effect.flip(api.bulkUpdateConversation({ conversations: [] })),
    );

    expect(error._tag).toBe('EbayApiError');
  });
});
