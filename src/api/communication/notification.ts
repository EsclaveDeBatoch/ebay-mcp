import type { EbayApiClient } from '@/api/client.js';
import {
  buildEndpointParams,
  type EbayApiError,
  type EndpointInputError,
  optionalPositiveNumberEffect,
  optionalStringEffect,
  requestGetEffect,
  requireObjectEffect,
  requireStringEffect,
} from '@/api/shared/request.js';
import type { components } from '@/generated/ebay/sell-apps/communication/commerceNotificationV1Oas3.js';
import type { getTopicSchema, getTopicsSchema } from '@/utils/communication/notification.js';
import { Effect } from 'effect';
import type { InferEffectSchema } from '@/utils/effectSchemaTypes.js';

type GetTopicInput = InferEffectSchema<typeof getTopicSchema>;
type GetTopicsInput = InferEffectSchema<typeof getTopicsSchema>;
/**
 * Topic response returned by eBay getTopic.
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/topic/methods/getTopic
 */
export type GetNotificationTopicResponse = components['schemas']['Topic'];
/**
 * Topic search response returned by eBay getTopics.
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/topic/methods/getTopics
 */
export type GetNotificationTopicsResponse = components['schemas']['TopicSearchResponse'];

/**
 * Notification API - Event notifications and subscriptions
 * Based on: specs/ebay/sell-apps/communication/commerce_notification_v1_oas3.json
 */
export class NotificationApi {
  private readonly basePath = '/commerce/notification/v1';
  private readonly client: EbayApiClient;

  constructor(client: EbayApiClient) {
    this.client = client;
  }

  /**
   * Retrieves one notification topic.
   *
   * @param input - Topic identifier.
   * @returns An Effect that succeeds with eBay's generated Topic response.
   *
   * @example
   * ```ts
   * const topic = await Effect.runPromise(notificationApi.getTopic({ topicId: 'topic-1' }));
   * ```
   *
   * @see https://developer.ebay.com/api-docs/commerce/notification/resources/topic/methods/getTopic
   */
  getTopic = (
    input: GetTopicInput,
  ): Effect.Effect<GetNotificationTopicResponse, EbayApiError | EndpointInputError> => {
    const apiClient = this.client;
    const apiBasePath = this.basePath;

    return Effect.gen(function* () {
      const request = yield* requireObjectEffect<GetTopicInput>(input, 'input');
      const validatedTopicId = yield* requireStringEffect(request.topicId, 'topicId');

      return yield* requestGetEffect<GetNotificationTopicResponse>(
        apiClient,
        `${apiBasePath}/topic/${validatedTopicId}`,
      );
    });
  };

  /**
   * Retrieves available notification topics.
   *
   * @param input - Optional page size and continuation token.
   * @returns An Effect that succeeds with eBay's generated TopicSearchResponse.
   *
   * @example
   * ```ts
   * const topics = await Effect.runPromise(notificationApi.getTopics({ limit: 20 }));
   * ```
   *
   * @see https://developer.ebay.com/api-docs/commerce/notification/resources/topic/methods/getTopics
   */
  getTopics = (
    input: GetTopicsInput = {},
  ): Effect.Effect<GetNotificationTopicsResponse, EbayApiError | EndpointInputError> => {
    const apiClient = this.client;
    const path = `${this.basePath}/topic`;

    return Effect.gen(function* () {
      const request = yield* requireObjectEffect<GetTopicsInput>(input, 'input');
      const limit = yield* optionalPositiveNumberEffect(request.limit, 'limit');
      const continuationToken = yield* optionalStringEffect(
        request.continuationToken,
        'continuationToken',
      );
      const params = buildEndpointParams({
        limit: { wireName: 'limit', value: limit },
        continuationToken: { wireName: 'continuation_token', value: continuationToken },
      });

      return yield* requestGetEffect<GetNotificationTopicsResponse>(apiClient, path, params);
    });
  };
}
