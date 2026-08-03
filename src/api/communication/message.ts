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
/** Request body accepted by sendMessage. */
type SendMessageRequest = components['schemas']['SendMessageRequest'];
/** Response returned by sendMessage. */
type SendMessageResponse = components['schemas']['SendMessageResponse'];
/** Request body accepted by updateConversation. */
type UpdateConversationRequest = components['schemas']['UpdateConversationRequest'];

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

  /**
   * Sends a message to another eBay user.
   *
   * @param messageData - Generated SendMessageRequest body.
   * @returns An Effect that succeeds with eBay's generated SendMessageResponse.
   *
   * @example
   * ```ts
   * const sent = await Effect.runPromise(
   *   messageApi.sendMessage({ messageText: 'Hello', otherPartyUsername: 'buyer_123' }),
   * );
   * ```
   *
   * @see https://developer.ebay.com/api-docs/commerce/message/resources/send_message/methods/sendMessage
   */
  sendMessage = (
    messageData: SendMessageRequest,
  ): Effect.Effect<SendMessageResponse, EbayApiError | EndpointInputError> => {
    const client = this.client;
    const path = `${this.basePath}/send_message`;

    return Effect.gen(function* () {
      const body = yield* requireObjectEffect<SendMessageRequest>(messageData, 'messageData');

      return yield* requestPostEffect<SendMessageResponse>(client, path, body);
    });
  };

  /**
   * Updates a conversation status.
   *
   * @param updateData - Generated UpdateConversationRequest body.
   * @returns An Effect that succeeds when eBay accepts the update.
   *
   * @example
   * ```ts
   * await Effect.runPromise(
   *   messageApi.updateConversation({ conversationId: 'c1', conversationStatus: 'READ' }),
   * );
   * ```
   *
   * @see https://developer.ebay.com/api-docs/commerce/message/resources/update_conversation/methods/updateConversation
   */
  updateConversation = (
    updateData: UpdateConversationRequest,
  ): Effect.Effect<void, EbayApiError | EndpointInputError> => {
    const client = this.client;
    const path = `${this.basePath}/update_conversation`;

    return Effect.gen(function* () {
      const body = yield* requireObjectEffect<UpdateConversationRequest>(updateData, 'updateData');

      return yield* requestPostEffect<void>(client, path, body);
    });
  };
}
