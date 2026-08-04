import type {
  FindListingRecommendationsArguments,
  ListingRecommendations,
} from '@/ebay/sell/recommendation/listingRecommendation.js';

export const findListingRecommendationsArguments: FindListingRecommendationsArguments = {
  filter: 'recommendationTypes:{AD}',
  limit: '25',
  offset: '0',
  'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
  listingIds: ['110000000000'],
};

export const findAllActiveListingRecommendationsArguments: FindListingRecommendationsArguments = {
  'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
};

export const listingRecommendationsDocument: ListingRecommendations = {
  href: '/sell/recommendation/v1/find?limit=25&offset=0',
  limit: 25,
  offset: 0,
  total: 1,
  listingRecommendations: [
    {
      listingId: '110000000000',
      marketing: {
        ad: {
          promoteWithAd: 'RECOMMENDED',
          bidPercentages: [{ basis: 'TRENDING', value: '7.5' }],
        },
      },
    },
  ],
};
