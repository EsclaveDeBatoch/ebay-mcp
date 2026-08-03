import type { NotificationPublicKey } from '@/ebay/commerce/notification/publicKey.js';

export const notificationPublicKeyDocument: NotificationPublicKey = {
  algorithm: 'ECDSA',
  digest: 'SHA1',
  key: '-----BEGIN PUBLIC KEY-----\nnotification-key\n-----END PUBLIC KEY-----',
};
