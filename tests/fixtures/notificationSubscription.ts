import type {
  NotificationSubscription,
  SubscriptionPage,
} from '@/ebay/commerce/notification/subscription.js';

export const notificationSubscriptionDocument: NotificationSubscription = {
  creationDate: '2026-08-03T10:00:00.000Z',
  destinationId: 'destination-123',
  filterId: 'filter-123',
  payload: {
    deliveryProtocol: 'HTTPS',
    format: 'JSON',
    schemaVersion: '1.0',
  },
  status: 'ENABLED',
  subscriptionId: 'subscription-123',
  topicId: 'MARKETPLACE_ACCOUNT_DELETION',
};

export const notificationSubscriptionPageDocument: SubscriptionPage = {
  href: '/commerce/notification/v1/subscription?limit=20',
  limit: 20,
  next: '/commerce/notification/v1/subscription?limit=20&continuation_token=next-page',
  subscriptions: [notificationSubscriptionDocument],
  total: 1,
};
