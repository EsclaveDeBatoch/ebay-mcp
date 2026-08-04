import path from 'node:path';

/**
 * Where each eBay OpenAPI spec lands under `specs/ebay/`.
 *
 * `downloadSpecs` writes specs here and `devSync` reads them back to regenerate
 * `src/generated/ebay/` and report endpoint drift, so the two must agree exactly — they
 * previously kept byte-identical copies of this table and could silently diverge.
 *
 * The table is intentionally wider than what `docs/sell-apps/README.md` currently
 * lists for download: entries such as `sell_feed_v1_oas3.json` and
 * `sell_finances_v1_oas3.json` record where those specs would go if the README
 * starts linking them, and are not evidence that they are covered today.
 */
export const SPEC_FOLDER_MAP: Record<string, string> = {
  // Application settings
  'developer_analytics_v1_beta_oas3.json': 'application-settings',
  'developer_key_management_v1_oas3.json': 'application-settings',
  'developer_client_registration_v1_oas3.json': 'application-settings',

  // Selling apps - listing management
  'sell_inventory_v1_oas3.json': 'sell-apps/listing-management',
  'sell_feed_v1_oas3.json': 'sell-apps/listing-management',
  'commerce_media_v1_beta_oas3.json': 'sell-apps/listing-management',
  'sell_stores_v1_oas3.json': 'sell-apps/listing-management',

  // Selling apps - listing metadata & taxonomy
  'sell_metadata_v1_oas3.json': 'sell-apps/listing-metadata',
  'commerce_taxonomy_v1_oas3.json': 'sell-apps/listing-metadata',
  'commerce_charity_v1_oas3.json': 'sell-apps/listing-metadata',

  // Selling apps - account management
  'sell_account_v1_oas3.json': 'sell-apps/account-management',
  'sell_account_v2_oas3.json': 'sell-apps/account-management',
  'sell_finances_v1_oas3.json': 'sell-apps/account-management',

  // Selling apps - communication & negotiation
  'commerce_message_v1_oas3.json': 'sell-apps/communication',
  'commerce_notification_v1_oas3.json': 'sell-apps/communication',
  'sell_negotiation_v1_oas3.json': 'sell-apps/communication',
  'commerce_feedback_v1_beta_oas3.json': 'sell-apps/communication',

  // Selling apps - order management
  'sell_fulfillment_v1_oas3.json': 'sell-apps/order-management',
  'sell_logistics_v1_oas3.json': 'sell-apps/order-management',

  // Selling apps - marketing & promotions
  'sell_marketing_v1_oas3.json': 'sell-apps/marketing-and-promotions',
  'sell_recommendation_v1_oas3.json': 'sell-apps/marketing-and-promotions',
  'sell_analytics_v1_oas3.json': 'sell-apps/analytics-and-report',

  // Selling apps - other selling APIs
  'commerce_translation_v1_beta_oas3.json': 'sell-apps/other-apis',
  'sell_compliance_v1_oas3.json': 'sell-apps/other-apis',
  'commerce_identity_v1_oas3.json': 'sell-apps/other-apis',
  'sell_edelivery_international_shipping_oas3.json': 'sell-apps/other-apis',
  'commerce_vero_v1_oas3.json': 'sell-apps/other-apis',

  // Buying apps - inventory discovery & refresh
  'buy_browse_v1_oas3.json': 'buy-apps/inventory-discovery',
  'buy_feed_v1_beta_oas3.json': 'buy-apps/inventory-discovery',
  'buy_feed_v1_oas3.json': 'buy-apps/inventory-discovery',

  // Buying apps - marketing & discounts
  'buy_deal_v1_oas3.json': 'buy-apps/marketing-and-discounts',
  'buy_marketing_v1_beta_oas3.json': 'buy-apps/marketing-and-discounts',

  // Buying apps - marketplace metadata
  'commerce_catalog_v1_beta_oas3.json': 'buy-apps/marketplace-metadata',

  // Buying apps - checkout & bidding
  'buy_order_v2_oas3.json': 'buy-apps/checkout-and-bidding',
  'buy_offer_v1_beta_oas3.json': 'buy-apps/checkout-and-bidding',
};

/** Folder used for specs the map does not name. */
const FALLBACK_SPEC_FOLDER = 'other-apis';

/**
 * Finds the `specs/ebay/` subfolder that owns a spec.
 *
 * @param specPathOrUrl - Spec filename, local path, or download URL.
 * @returns The mapped subfolder, or `other-apis` when the spec is unmapped.
 *
 * @example
 * ```ts
 * getSpecFolder('https://.../sell_inventory_v1_oas3.json'); // 'sell-apps/listing-management'
 * ```
 */
export const getSpecFolder = (specPathOrUrl: string): string => {
  const specFileName = path.basename(specPathOrUrl);
  const mappedFolder = SPEC_FOLDER_MAP[specFileName];
  if (mappedFolder === undefined) {
    return FALLBACK_SPEC_FOLDER;
  }

  return mappedFolder;
};
