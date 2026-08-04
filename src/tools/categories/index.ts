import type { ToolEntry } from '@/tools/registry.js';
import { connectorEntries } from './connector.js';

/**
 * A named group of registered tool entries, owned by one eBay API area (or the
 * ChatGPT connector). This is the single source of truth for both the registry
 * order and any feature that needs the tool catalogue grouped by family — e.g.
 * the skills generator's live family index. `key` is the stable identifier;
 * `title` is a short human label.
 */
export interface ToolCategory {
  key: string;
  title: string;
  entries: ToolEntry[];
}

/**
 * Registered tool families in registry execution order. Connector tools
 * (`search`/`fetch`) are registered ahead of the eBay API tools, matching the
 * prior registry. {@link registeredEntries} is derived from this list, so adding
 * a family here both registers its tools and surfaces it in the family index.
 *
 * Token-management tools live in the credential catalogue (`src/auth/tokenManagement`
 * via `src/mcp/credentialToolCatalogue.ts`), not the legacy registry.
 */
export const toolCategories: ToolCategory[] = [
  { key: 'connector', title: 'Connector', entries: connectorEntries },
];

/**
 * Registered tool entries in registry execution order, flattened from
 * {@link toolCategories}.
 */
export const registeredEntries: ToolEntry[] = toolCategories.flatMap(
  (category) => category.entries,
);
