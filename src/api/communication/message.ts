import type { EbayApiClient } from '@/api/client.js';
import {
  type EbayApiError,
  type EndpointInputError,
  requestPostEffect,
  requireObjectEffect,
} from '@/api/shared/request.js';
import type { components } from '@/generated/ebay/sell-apps/communication/commerceMessageV1Oas3.js';
import { Effect } from 'effect';

/** Request body accepted by bulkUpdateConversation. */
type BulkUpdateConversationsRequest = components['schemas']['BulkUpdateConversationsRequest'];
/** Response returned by bulkUpdateConversation. */
type BulkUpdateConversationsResponse = components['schemas']['BulkUpdateConversationsResponse'];

/**
 * Message API - Buyer-seller messaging
 * Based on: specs/ebay/sell-apps/communication/commerce_message_v1_oas3.json
 */
export class MessageApi {
  private readonly basePath = '/commerce/message/v1';

  constructor(private readonly client: EbayApiClient) {}

  /**
   * Updates multiple conversations in one request.
   *
   * @param updateData - Generated BulkUpdateConversationsRequest body.
   * @returns An Effect that succeeds with eBay's generated bulk update response.
   *
   * @example
   * ```ts
   * const result = await Effect.runPromise(
   *   messageApi.bulkUpdateConversation({ conversations: [{ conversationId: 'c1' }] }),
   * );
   * ```
   *
   * @see https://developer.ebay.com/api-docs/commerce/message/resources/bulk_update_conversation/methods/bulkUpdateConversation
   */
  bulkUpdateConversation = (
    updateData: BulkUpdateConversationsRequest,
  ): Effect.Effect<BulkUpdateConversationsResponse, EbayApiError | EndpointInputError> => {
    const client = this.client;
    const path = `${this.basePath}/bulk_update_conversation`;

    return Effect.gen(function* () {
      const body = yield* requireObjectEffect<BulkUpdateConversationsRequest>(
        updateData,
        'updateData',
      );

      return yield* requestPostEffect<BulkUpdateConversationsResponse>(client, path, body);
    });
  };
}
