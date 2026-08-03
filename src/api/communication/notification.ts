import type { EbayApiClient } from '@/api/client.js';
import {
  buildEndpointParams,
  type EbayApiError,
  type EndpointInputError,
  optionalPositiveNumberEffect,
  optionalStringEffect,
  requestDeleteEffect,
  requestGetEffect,
  requestPostEffect,
  requireObjectEffect,
  requireStringEffect,
} from '@/api/shared/request.js';
import type { components } from '@/generated/ebay/sell-apps/communication/commerceNotificationV1Oas3.js';
import type {
  createSubscriptionFilterSchema,
  deleteSubscriptionFilterSchema,
  getSubscriptionFilterSchema,
  getTopicSchema,
  getTopicsSchema,
} from '@/utils/communication/notification.js';
import { Effect } from 'effect';
import type { InferEffectSchema } from '@/utils/effectSchemaTypes.js';

type GetTopicInput = InferEffectSchema<typeof getTopicSchema>;
type GetTopicsInput = InferEffectSchema<typeof getTopicsSchema>;
type CreateSubscriptionFilterInput = InferEffectSchema<typeof createSubscriptionFilterSchema>;
type GetSubscriptionFilterInput = InferEffectSchema<typeof getSubscriptionFilterSchema>;
type DeleteSubscriptionFilterInput = InferEffectSchema<typeof deleteSubscriptionFilterSchema>;
/** Subscription filter body accepted by createSubscriptionFilter. */
type CreateSubscriptionFilterRequest = Pick<CreateSubscriptionFilterInput, 'filterSchema'>;

/**
 * Subscription filter response returned by eBay getSubscriptionFilter.
 *
 * @see https://developer.ebay.com/api-docs/commerce/notification/resources/subscription/methods/getSubscriptionFilter
 */
export type GetNotificationSubscriptionFilterResponse = components['schemas']['SubscriptionFilter'];
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

  /**
   * Creates a filter for a notification subscription.
   *
   * @param input - Subscription identifier plus JSON Schema filter body accepted by eBay.
   * @returns An Effect that succeeds with eBay's generated empty response body.
   *
   * @example
   * ```ts
   * await Effect.runPromise(
   *   notificationApi.createSubscriptionFilter({
   *     subscriptionId: 'sub-1',
   *     filterSchema: { type: 'object' },
   *   }),
   * );
   * ```
   *
   * @see https://developer.ebay.com/api-docs/commerce/notification/resources/subscription/methods/createSubscriptionFilter
   */
  createSubscriptionFilter = (
    input: CreateSubscriptionFilterInput,
  ): Effect.Effect<void, EbayApiError | EndpointInputError> => {
    const apiClient = this.client;
    const apiBasePath = this.basePath;

    return Effect.gen(function* () {
      const request = yield* requireObjectEffect<CreateSubscriptionFilterInput>(input, 'input');
      const { subscriptionId, ...filter } = request;
      const validatedSubscriptionId = yield* requireStringEffect(subscriptionId, 'subscriptionId');
      const body = yield* requireObjectEffect<CreateSubscriptionFilterRequest>(filter, 'filter');

      return yield* requestPostEffect<void>(
        apiClient,
        `${apiBasePath}/subscription/${validatedSubscriptionId}/filter`,
        body,
      );
    });
  };

  /**
   * Retrieves one subscription filter.
   *
   * @param input - Subscription identifier and subscription filter identifier.
   * @returns An Effect that succeeds with eBay's generated SubscriptionFilter response.
   *
   * @example
   * ```ts
   * const filter = await Effect.runPromise(
   *   notificationApi.getSubscriptionFilter({ subscriptionId: 'sub-1', filterId: 'filter-1' }),
   * );
   * ```
   *
   * @see https://developer.ebay.com/api-docs/commerce/notification/resources/subscription/methods/getSubscriptionFilter
   */
  getSubscriptionFilter = (
    input: GetSubscriptionFilterInput,
  ): Effect.Effect<
    GetNotificationSubscriptionFilterResponse,
    EbayApiError | EndpointInputError
  > => {
    const apiClient = this.client;
    const apiBasePath = this.basePath;

    return Effect.gen(function* () {
      const request = yield* requireObjectEffect<GetSubscriptionFilterInput>(input, 'input');
      const validatedSubscriptionId = yield* requireStringEffect(
        request.subscriptionId,
        'subscriptionId',
      );
      const validatedFilterId = yield* requireStringEffect(request.filterId, 'filterId');

      return yield* requestGetEffect<GetNotificationSubscriptionFilterResponse>(
        apiClient,
        `${apiBasePath}/subscription/${validatedSubscriptionId}/filter/${validatedFilterId}`,
      );
    });
  };

  /**
   * Deletes a subscription filter.
   *
   * @param input - Subscription identifier and subscription filter identifier.
   * @returns An Effect that succeeds when eBay deletes the filter.
   *
   * @example
   * ```ts
   * await Effect.runPromise(
   *   notificationApi.deleteSubscriptionFilter({
   *     subscriptionId: 'sub-1',
   *     filterId: 'filter-1',
   *   }),
   * );
   * ```
   *
   * @see https://developer.ebay.com/api-docs/commerce/notification/resources/subscription/methods/deleteSubscriptionFilter
   */
  deleteSubscriptionFilter = (
    input: DeleteSubscriptionFilterInput,
  ): Effect.Effect<void, EbayApiError | EndpointInputError> => {
    const apiClient = this.client;
    const apiBasePath = this.basePath;

    return Effect.gen(function* () {
      const request = yield* requireObjectEffect<DeleteSubscriptionFilterInput>(input, 'input');
      const validatedSubscriptionId = yield* requireStringEffect(
        request.subscriptionId,
        'subscriptionId',
      );
      const validatedFilterId = yield* requireStringEffect(request.filterId, 'filterId');

      return yield* requestDeleteEffect<void>(
        apiClient,
        `${apiBasePath}/subscription/${validatedSubscriptionId}/filter/${validatedFilterId}`,
      );
    });
  };
}
