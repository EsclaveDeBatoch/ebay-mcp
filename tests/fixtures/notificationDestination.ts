import type {
  DestinationPage,
  NotificationDestination,
} from '@/ebay/commerce/notification/destination.js';

export const destinationDocument: NotificationDestination = {
  deliveryConfig: {
    endpoint: 'https://notifications.example.com/ebay',
    verificationToken: 'notification_token_1234567890abcdef',
  },
  destinationId: 'destination-123',
  name: 'Order events',
  status: 'ENABLED',
};

export const destinationPageDocument: DestinationPage = {
  destinations: [destinationDocument],
  href: '/commerce/notification/v1/destination?limit=20',
  limit: 20,
  total: 1,
};
