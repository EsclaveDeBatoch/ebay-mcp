import type { EbayApiClient } from '@/api/client.js';
import {
  type EbayApiError,
  type EndpointInputError,
  requestPostEffect,
  requireObjectEffect,
} from '@/api/shared/request.js';
import type { components } from '@/generated/ebay/sell-apps/communication/commerceFeedbackV1BetaOas3.js';
import { Effect } from 'effect';

/** Request body accepted by respondToFeedback. */
type RespondToFeedbackRequest = components['schemas']['RespondToFeedbackRequest'];
/** Response returned by respondToFeedback. */
type RespondToFeedbackResponse = Record<string, never>;

/**
 * Feedback API - Manage buyer and seller feedback
 * Based on: specs/ebay/sell-apps/communication/commerce_feedback_v1_beta_oas3.json
 */
export class FeedbackApi {
  private readonly basePath = '/commerce/feedback/v1';

  constructor(private readonly client: EbayApiClient) {}

  /**
   * Responds to feedback received from another eBay user.
   *
   * @param response - Generated RespondToFeedbackRequest body.
   * @returns An Effect that succeeds with eBay's generated empty response.
   *
   * @example
   * ```ts
   * await Effect.runPromise(
   *   feedbackApi.respondToFeedback({ feedbackId: 'feedback-1', responseText: 'Thank you' }),
   * );
   * ```
   *
   * @see https://developer.ebay.com/api-docs/commerce/feedback/resources/respond_to_feedback/methods/respondToFeedback
   */
  respondToFeedback = (
    response: RespondToFeedbackRequest,
  ): Effect.Effect<RespondToFeedbackResponse, EbayApiError | EndpointInputError> => {
    const client = this.client;
    const path = `${this.basePath}/respond_to_feedback`;

    return Effect.gen(function* () {
      const body = yield* requireObjectEffect<RespondToFeedbackRequest>(response, 'response');

      return yield* requestPostEffect<RespondToFeedbackResponse>(client, path, body);
    });
  };
}
