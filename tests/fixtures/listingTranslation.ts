import type {
  ListingTranslation,
  TranslateListingTextArguments,
} from '@/ebay/commerce/translation/language.js';

export const translateListingTitleArguments: TranslateListingTextArguments = {
  from: 'en',
  to: 'es',
  text: ['Vintage camera with leather case'],
  translationContext: 'ITEM_TITLE',
};

export const listingTranslationDocument: ListingTranslation = {
  from: 'en',
  to: 'es',
  translations: [
    {
      originalText: 'Vintage camera with leather case',
      translatedText: 'Cámara vintage con estuche de cuero',
    },
  ],
};
