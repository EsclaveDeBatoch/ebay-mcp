import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeedbackApi } from '@/api/communication/feedback.js';
import { invalidInput } from '@tests/helpers/invalidInput.js';
import type { EbayApiClient } from '@/api/client.js';
import { Effect } from 'effect';

let client: EbayApiClient;
let api: FeedbackApi;

beforeEach(() => {
  client = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  } as unknown as EbayApiClient;
  api = new FeedbackApi(client);
});

describe('respondToFeedback', () => {
  it('respond to feedback', async () => {
    const mockResponse = { success: true };
    vi.mocked(client.post).mockResolvedValue(mockResponse);

    await Effect.runPromise(
      api.respondToFeedback({
        feedbackId: 'feedback123',
        responseText: 'Thank you for the feedback!',
      }),
    );

    expect(client.post).toHaveBeenCalledWith('/commerce/feedback/v1/respond_to_feedback', {
      feedbackId: 'feedback123',
      responseText: 'Thank you for the feedback!',
    });
  });

  it('fail when response body is missing', async () => {
    const error = await Effect.runPromise(
      Effect.flip(api.respondToFeedback(invalidInput(undefined))),
    );

    expect(error._tag).toBe('EndpointInputError');
    expect(error.message).toContain('response is required');
  });
});
