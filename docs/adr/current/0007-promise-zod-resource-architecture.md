# 0007 — Native promises, direct Zod, and official resource ownership

**Status:** Accepted · 2026-08-03

## Context

The checked-in implementation spreads one eBay operation across an Effect schema tree,
schema adapters, API classes, a global facade, tool categories, handler maps, registries,
response schemas, and UI mappers. The scan behind this decision found hundreds of Effect
programs and boundary runners, nearly 600 authored schemas, six schema-adapter files, and
298 tools whose public behavior is difficult to understand from one place.

The MCP SDK accepts Zod schemas directly. The generated OpenAPI documents already describe
eBay responses. eBay's own namespace/API/resource hierarchy is a more stable navigation
model than the repository's parallel area, family, schema, and tool taxonomies.

## Decision

- Use native promises and direct Zod 4. Do not add new Effect programs, Effect schemas,
  repository schema adapters, or JSON-schema conversion wrappers.
- Decode one strict Zod object at each external boundary and trust typed code downstream.
- Place authored eBay code under
  `src/ebay/<namespace>/<api>/<resource>.ts`. One resource module owns its arguments
  schemas, generated aliases, operations, and named MCP tool definitions.
- Give an operation two parameters: `EbaySellerSession` and one precisely named eBay query
  or document. Do not add one-use options wrappers.
- Return `EbayRequestCompletion<EbayDocument>` from fallible eBay work. The MCP boundary
  translates the discriminated completion once.
- Keep official inbound wire keys exactly as eBay publishes them, including underscores.
  Pass generated response documents through unchanged.
- Move downloaded specifications to `specs/ebay/` and generated TypeScript to
  `src/generated/ebay/`. Neither root accepts handwritten code.
- Explicitly import every named tool definition in `src/mcp/ebayToolCatalogue.ts`. Do not
  discover files or export resource-level tool arrays.
- Name tools hierarchically, for example
  `ebay_sell_analytics_get_traffic_report`, and expose them by official namespace/API path,
  for example `sell.analytics`. Connector `search` and `fetch` are exact local exceptions.
- Add no compatibility exports, old-name aliases, facade methods, or alternate wire keys.
  Delete an old implementation when its final caller moves.

## Migration

The change proceeds through independently green slices:

1. Establish the style contract and architecture records.
2. Establish the secure dependency and machine-owned generation roots.
3. Migrate Sell Analytics `traffic_report` as the golden slice.
4. Migrate one official resource at a time with both tests written first.
5. Consolidate auth, HTTP, logging, configuration, CLI, and UI after resource dependencies
   are explicit.
6. Delete final legacy roots and dependencies, then make cleaned mechanical rules blocking.

The current `src/api`, `src/schemas`, `src/tools`, `src/types`, `src/utils`, and
`src/scripts` paths remain factual migration inventory until their last callers move. They
must not be expanded into a second permanent architecture.

## Consequences

- A contributor can understand a resource's public contract, wire call, and MCP exposure
  from one owner module.
- Removing response schema trees avoids maintaining copies of generated eBay documents.
- Removing the facade and endpoint classes makes authentication and transport dependencies
  explicit.
- The explicit catalogue is deliberately repetitive. Its repeated imports make the public
  298-tool surface searchable and prevent silent discovery behavior.
- The migration is intentionally breaking at internal import and tool-name boundaries;
  recoverability comes from green pull requests, not compatibility layers.

This record supersedes the Effect and Zod 3 direction in
[0003](0003-dependency-decisions.md) and the “no code moves” destination in
[0005](0005-codify-real-layout.md). Those records remain historical evidence of the earlier
state.
