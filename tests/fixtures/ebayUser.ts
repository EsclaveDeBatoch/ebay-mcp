import type { EbayUser } from '@/ebay/commerce/identity/user.js';

export const ebayUserDocument: EbayUser = {
  accountType: 'BUSINESS',
  registrationMarketplaceId: 'EBAY_US',
  status: 'CONFIRMED',
  userId: '007BUS2xyeBay',
  username: 'camera-seller',
  businessAccount: {
    name: 'Vintage Camera Shop',
    email: 'seller@example.com',
  },
};
