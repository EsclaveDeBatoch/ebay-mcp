import type {
  EligibleListings,
  SentSellerOffers,
  SellerOfferArguments,
} from '@/ebay/sell/negotiation/offer.js';

export const eligibleListingsDocument: EligibleListings = {
  eligibleItems: [{ listingId: '110000000000' }],
  href: '/sell/negotiation/v1/find_eligible_items?limit=10&offset=0',
  limit: 10,
  offset: 0,
  total: 1,
};

export const sellerOfferArguments: SellerOfferArguments = {
  'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
  allowCounterOffer: false,
  message: 'A private offer for this camera',
  offerDuration: { unit: 'DAY', value: 2 },
  offeredItems: [
    {
      discountPercentage: '10',
      listingId: '110000000000',
      quantity: 1,
    },
  ],
};

export const sentSellerOffersDocument: SentSellerOffers = {
  offers: [
    {
      allowCounterOffer: false,
      buyer: { maskedUsername: 'c***r' },
      message: 'A private offer for this camera',
      offerId: 'offer-001',
      offeredItems: [
        {
          discountPercentage: '10',
          listingId: '110000000000',
          quantity: 1,
        },
      ],
      offerStatus: 'PENDING',
      offerType: 'SELLER_INITIATED',
    },
  ],
};
