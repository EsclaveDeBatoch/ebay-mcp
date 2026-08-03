import type {
  NotificationTopic,
  NotificationTopicPage,
} from '@/ebay/commerce/notification/topic.js';

export const notificationTopicDocument: NotificationTopic = {
  authorizationScopes: ['https://api.ebay.com/oauth/api_scope/commerce.notification.subscription'],
  context: 'MARKETPLACE',
  description: 'An order was created or updated',
  filterable: true,
  scope: 'USER',
  status: 'ENABLED',
  supportedPayloads: [
    {
      deliveryProtocol: 'HTTPS',
      deprecated: false,
      format: ['JSON'],
      schemaVersion: '1.0',
    },
  ],
  topicId: 'MARKETPLACE_ACCOUNT_DELETION',
};

export const notificationTopicPageDocument: NotificationTopicPage = {
  href: '/commerce/notification/v1/topic?limit=20',
  limit: 20,
  next: '/commerce/notification/v1/topic?limit=20&continuation_token=next-topic-page',
  topics: [notificationTopicDocument],
  total: 1,
};
