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
  account: 'Return policies, privileges, program opt-in, and sales tax',
  inventory:
    'Inventory items, offers, locations, inventory groups, bulk publish — the REST listing model',
  marketing: 'Promoted Listings campaigns, ads, promotions, and marketing reports',
  'commerce.feedback':
    'Pending tasks, feedback history, submissions, replies, and rating metrics from Commerce Feedback',
  'commerce.identity': 'Authenticated eBay account profile information',
  'commerce.message': 'Buyer-seller conversation lookup and messaging from Commerce Message',
  'commerce.notification':
    'Alert configuration, delivery destinations, topics, subscriptions, filters, and validation keys from Commerce Notification',
  'commerce.taxonomy': 'Category trees, category suggestions, and required listing aspects',
  'commerce.translation': 'Listing-title and description translation between supported languages',
  'commerce.vero': 'Intellectual-property infringement reports and reason codes from Commerce VeRO',
  'developer.analytics': 'Application and user API quota utilization from Developer Analytics',
  'developer.key-management':
    'Application signing-key creation and public-key retrieval from Developer Key Management',
  'developer.status': 'Current incidents from the public eBay developer status feed',
  'sell.account':
    'Seller payment, fulfillment, product-compliance, and take-back policies from Sell Account',
  'sell.analytics':
    'Traffic reports, seller standards, and customer-service metrics from Sell Analytics',
  'sell.edelivery':
    'International package creation, consolidation, shipping documents, and tracking for Greater-China sellers',
  'sell.fulfillment': 'Orders, shipping fulfillments, refunds, and payment disputes',
  'sell.negotiation': 'Listings eligible for seller offers and seller-initiated discounted offers',
  'sell.recommendation':
    'Promoted Listings recommendations for active listings from Sell Recommendation',
  'sell.metadata':
    'Marketplace policies, item conditions, listing constraints, automotive compatibility, and sales-tax jurisdictions',
  trading:
    'Legacy Trading API (XML) — retrieve, create, revise, relist, and end fixed-price listings',
};

const MIGRATED_NAMESPACE_TITLES = [
  { namespace: 'commerce.feedback', title: 'Commerce Feedback' },
  { namespace: 'commerce.identity', title: 'Commerce Identity' },
  { namespace: 'commerce.message', title: 'Commerce Message' },
  { namespace: 'commerce.notification', title: 'Commerce Notification' },
  { namespace: 'commerce.taxonomy', title: 'Commerce Taxonomy' },
  { namespace: 'commerce.translation', title: 'Commerce Translation' },
  { namespace: 'commerce.vero', title: 'Commerce VeRO' },
  { namespace: 'developer.analytics', title: 'Developer Analytics' },
  { namespace: 'developer.key-management', title: 'Developer Key Management' },
  { namespace: 'developer.status', title: 'Developer Status' },
  { namespace: 'sell.account', title: 'Sell Account' },
  { namespace: 'sell.analytics', title: 'Sell Analytics' },
  { namespace: 'sell.edelivery', title: 'Sell eDelivery' },
  { namespace: 'sell.fulfillment', title: 'Sell Fulfillment' },
  { namespace: 'sell.metadata', title: 'Sell Metadata' },
  { namespace: 'sell.negotiation', title: 'Sell Negotiation' },
  { namespace: 'sell.recommendation', title: 'Sell Recommendation' },
  { namespace: 'trading', title: 'Trading' },
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
