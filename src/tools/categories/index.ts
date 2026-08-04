import type { ToolEntry } from '@/tools/registry.js';

/**
 * A named group of registered tool entries. Migrated eBay resource tools and
 * credential tools live in the MCP catalogues; this list remains only while any
 * legacy registry families still exist. `key` is the stable identifier; `title`
 * is a short human label.
 */
export interface ToolCategory {
  key: string;
  title: string;
  entries: ToolEntry[];
}

/**
 * Remaining legacy tool families in registry execution order. Connector tools
 * (`search`/`fetch`) live in the MCP catalogue under namespace `connector`.
 * Token-management tools live in the credential catalogue under namespace
 * `token-management`. {@link registeredEntries} is derived from this list.
 */
export const toolCategories: ToolCategory[] = [];

/**
 * Registered tool entries in registry execution order, flattened from
 * {@link toolCategories}.
 */
export const registeredEntries: ToolEntry[] = toolCategories.flatMap(
  (category) => category.entries,
);
