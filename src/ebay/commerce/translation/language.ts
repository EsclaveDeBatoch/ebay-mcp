import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/other-apis/commerceTranslationV1BetaOas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const translationLanguageSchema = z.enum([
  'de',
  'en',
  'es',
  'fr',
  'it',
  'ja',
  'pl',
  'pt',
  'ru',
  'zh',
]);

/** @see https://developer.ebay.com/develop/guides-v2/other-apis-guide#supported-languages */
const supportedTranslationDirections = new Set([
  'en:de',
  'en:zh',
  'en:ja',
  'en:fr',
  'en:it',
  'en:pt',
  'en:es',
  'en:ru',
  'de:en',
  'de:fr',
  'de:it',
  'de:es',
  'de:pl',
  'fr:en',
  'fr:de',
  'fr:it',
  'fr:es',
  'it:en',
  'it:de',
  'it:fr',
  'it:es',
  'es:en',
  'es:de',
  'es:fr',
  'es:it',
  'pl:de',
  'zh:en',
  'ja:en',
]);

/**
 * Exact eBay document fields accepted by Commerce Translation translate.
 *
 * @see https://developer.ebay.com/api-docs/commerce/translation/types/api:TranslateRequest
 */
export const translateListingTextArgumentsSchema = z
  .object({
    from: translationLanguageSchema,
    to: translationLanguageSchema,
    text: z.tuple([z.string().min(1)]),
    translationContext: z.enum(['ITEM_TITLE', 'ITEM_DESCRIPTION']),
  })
  .strict()
  .refine(
    (translationArguments) =>
      supportedTranslationDirections.has(`${translationArguments.from}:${translationArguments.to}`),
    {
      message: 'eBay does not support this source and target language direction',
      path: ['to'],
    },
  );

/** Validated eBay document fields for listing-text translation. */
export type TranslateListingTextArguments = z.infer<typeof translateListingTextArgumentsSchema>;

/**
 * Listing translation generated from eBay's official Commerce Translation specification.
 *
 * @see https://developer.ebay.com/api-docs/commerce/translation/types/api:TranslateResponse
 */
export type ListingTranslation = components['schemas']['TranslateResponse'];

/**
 * Translates one listing title or description through Commerce Translation.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param translationArguments - Exact generated eBay request document fields.
 * @returns Explicit completion containing the unchanged generated eBay document or failure.
 *
 * @example
 * ```ts
 * const completion = await translateListingText(sellerSession, {
 *   from: 'en',
 *   to: 'es',
 *   text: ['Vintage camera with leather case'],
 *   translationContext: 'ITEM_TITLE',
 * });
 * ```
 *
 * @see https://developer.ebay.com/api-docs/commerce/translation/resources/language/methods/translate
 */
export const translateListingText = async (
  sellerSession: EbaySellerSession,
  translationArguments: TranslateListingTextArguments,
): Promise<EbayRequestCompletion<ListingTranslation>> =>
  sellerSession.post<ListingTranslation>({
    endpoint: '/commerce/translation/v1_beta/translate',
    requestDocument: translationArguments,
  });

/** MCP definition for the Commerce Translation translate operation. */
export const translateListingTextTool = defineTool({
  name: 'ebay_commerce_translation_translate',
  namespace: 'commerce.translation',
  description: 'Translate one eBay listing title or description between supported languages',
  argumentsSchema: translateListingTextArgumentsSchema,
  operation: translateListingText,
});
