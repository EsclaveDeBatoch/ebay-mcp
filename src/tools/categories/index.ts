import type { ToolEntry } from '@/tools/registry.js';
import { tokenManagementEntries } from './tokenManagement.js';

/**
 * A named group of registered tool entries, owned by one eBay API area (or
 * remaining local tooling). This is the single source of truth for both the
 * registry order and any feature that needs the tool catalogue grouped by
 * family — e.g. the skills generator's live family index. `key` is the stable
 * identifier; `title` is a short human label.
 */
export interface ToolCategory {
  key: string;
  title: string;
  entries: ToolEntry[];
}

/**
 * Remaining legacy tool families in registry execution order. ChatGPT connector
 * tools (`search`/`fetch`) live in the migrated MCP catalogue under namespace
 * `connector`. {@link registeredEntries} is derived from this list.
 */
export const toolCategories: ToolCategory[] = [
  { key: 'token-management', title: 'Token Management', entries: tokenManagementEntries },
];

/**
 * Registered tool entries in registry execution order, flattened from
 * {@link toolCategories}.
 */
export const registeredEntries: ToolEntry[] = toolCategories.flatMap(
  (category) => category.entries,
);
