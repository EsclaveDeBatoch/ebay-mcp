import { toolCategories } from '@/tools/categories/index.js';
import { ebayToolCatalogue } from '@/mcp/ebayToolCatalogue.js';
import type { RegistrySnapshot, ToolFamily } from '@/skills/types.js';

/**
 * Human descriptions for each tool family, keyed by the category `key` exported
 * from the registry. Kept here (next to the snapshot) so copy lives in one place
 * while counts stay live; an unknown key falls back to its registry title.
 */
const FAMILY_BLURBS: Record<string, string> = {
  connector:
    'ChatGPT connector protocol tools (`search`/`fetch`) — not used when driving the API directly',
  'token-management': 'OAuth URL, token status, refresh, and credential diagnostics',
  account:
    'Business policies (payment, return, fulfillment), privileges, program opt-in, sales tax',
  inventory:
    'Inventory items, offers, locations, inventory groups, bulk publish — the REST listing model',
  fulfillment: 'Orders, shipping fulfillments, refunds, and payment disputes',
  marketing: 'Promoted Listings campaigns, ads, promotions, and marketing reports',
  'commerce.feedback':
    'Pending tasks, feedback history, submissions, replies, and rating metrics from Commerce Feedback',
  'commerce.identity': 'Authenticated eBay account profile information',
  'commerce.message': 'Buyer-seller conversation lookup and messaging from Commerce Message',
  'commerce.notification':
    'Alert configuration, delivery destinations, topics, subscriptions, filters, and validation keys from Commerce Notification',
  'commerce.taxonomy': 'Category trees, category suggestions, and required listing aspects',
  'commerce.translation': 'Listing-title and description translation between supported languages',
  'sell.analytics':
    'Traffic reports, seller standards, and customer-service metrics from Sell Analytics',
  'sell.negotiation': 'Listings eligible for seller offers and seller-initiated discounted offers',
  'sell.recommendation':
    'Promoted Listings recommendations for active listings from Sell Recommendation',
  metadata: 'Marketplace policies, item conditions, listing constraints, automotive compatibility',
  browse: 'Sold/completed listing search (Finding API) for pricing comps',
  other: 'Feedback and assorted Sell-API helpers',
  developer: 'API status, rate limits, client registration, and signing keys',
  trading: 'Legacy Trading API (XML) — create / revise / relist / end fixed-price listings',
};

const MIGRATED_NAMESPACE_TITLES = [
  { namespace: 'commerce.feedback', title: 'Commerce Feedback' },
  { namespace: 'commerce.identity', title: 'Commerce Identity' },
  { namespace: 'commerce.message', title: 'Commerce Message' },
  { namespace: 'commerce.notification', title: 'Commerce Notification' },
  { namespace: 'commerce.taxonomy', title: 'Commerce Taxonomy' },
  { namespace: 'commerce.translation', title: 'Commerce Translation' },
  { namespace: 'sell.analytics', title: 'Sell Analytics' },
  { namespace: 'sell.negotiation', title: 'Sell Negotiation' },
  { namespace: 'sell.recommendation', title: 'Sell Recommendation' },
] as const;

function familyBlurbFor(familyPath: string, familyTitle: string): string {
  const familyBlurb = FAMILY_BLURBS[familyPath];
  if (familyBlurb === undefined) {
    return familyTitle;
  }
  return familyBlurb;
}

/**
 * Builds a {@link RegistrySnapshot} from the live tool registry so a rendered
 * skill always reflects the real catalogue. Counts come from {@link toolCategories}
 * (the single source of truth for registry families); blurbs are static copy.
 *
 * @returns The current tool count and per-family index, in registry order.
 *
 * @example
 * ```ts
 * const snapshot = captureRegistrySnapshot();
 * ```
 */
export const captureRegistrySnapshot = (): RegistrySnapshot => {
  const families: ToolFamily[] = toolCategories.map((category) => ({
    key: category.key,
    title: category.title,
    count: category.entries.length,
    blurb: familyBlurbFor(category.key, category.title),
  }));
  for (const migratedNamespace of MIGRATED_NAMESPACE_TITLES) {
    const namespaceToolCount = ebayToolCatalogue.filter(
      (ebayTool) => ebayTool.namespace === migratedNamespace.namespace,
    ).length;
    if (namespaceToolCount > 0) {
      families.push({
        key: migratedNamespace.namespace,
        title: migratedNamespace.title,
        count: namespaceToolCount,
        blurb: FAMILY_BLURBS[migratedNamespace.namespace],
      });
    }
  }

  const countAccumulator = { toolCount: 0 };
  for (const family of families) {
    countAccumulator.toolCount += family.count;
  }

  return { toolCount: countAccumulator.toolCount, families };
};
