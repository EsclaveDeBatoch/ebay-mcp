# LANGUAGE.md

The human-to-agent vocabulary bridge. Use these terms in code, commits, pull requests, and
architecture discussions. Runtime flow belongs in [CONTEXT.md](CONTEXT.md).

| Term | Exact meaning | Avoid calling it |
| --- | --- | --- |
| **tool** | One MCP-exposed capability: name, strict inbound schema, description, operation, and optional browser metadata. | endpoint, command, function |
| **eBay operation** | One authenticated call to an official eBay method. It accepts `EbaySellerSession` plus one precisely named eBay query or document. | service method, action wrapper |
| **resource module** | `src/ebay/<namespace>/<api>/<resource>.ts`; owns the resource's schemas, generated aliases, operations, and named tools. | area class, category file, helper module |
| **namespace** | The first official eBay API segment, such as `sell`, `commerce`, `developer`, `finding`, or `trading`. | family, category, domain |
| **API** | The official API segment inside a namespace, such as `analytics`, `inventory`, or `fulfillment`. | area, service |
| **resource** | The official eBay resource grouping one or more related operations, such as `traffic_report`. | utility, manager |
| **`defineTool`** | The MCP boundary adapter that accepts a strict Zod schema and one operation, injects the seller session, and translates its completion once. | factory hierarchy, handler wrapper |
| **eBay tool catalogue** | `src/mcp/ebayToolCatalogue.ts`; explicitly imports every named tool definition and is the source for exposure and registration. | registry, barrel, discovered tools |
| **`EbaySellerSession`** | The explicit authenticated dependency used by eBay operations. | global API facade, API client singleton |
| **`EbayRequestCompletion<EbayDocument>`** | The shared discriminated success-or-failure contract returned by fallible eBay work. | Result, Outcome, thrown endpoint error |
| **eBay document** | An official generated OpenAPI response shape passed through unchanged by operation code. | normalized response, DTO copy |
| **tool exposure** | Selecting tools by official namespace/API path, by `all`, or through dynamic discovery. | family filter, compatibility scope |
| **local tool** | A non-eBay capability owned by this server, such as OAuth or connector discovery. | eBay namespace |
| **presentation projection** | A browser-only transformation in `src/ui/presentation/<api>.ts`. | response mapper, operation normalization |
| **`CommandCompletion`** | The discriminated completion returned by a CLI command to the process entry. | process exit, command result |
| **sync** | The development command that downloads specifications, regenerates TypeScript, and compares exact operation identifiers with the catalogue. | fuzzy endpoint scan, status snapshot |
| **marketplace** | An eBay site/locale represented by an official marketplace identifier such as `EBAY_US`. | region, site in authored code |
| **scope** | An OAuth permission string granted to a token. | permission in authored code |
| **archetype** | A finite MCP Apps presentation shape: `table`, `card`, or `chart`. | arbitrary widget mode |

The connector tool names `search` and `fetch` are exact protocol-facing exceptions to the
hierarchical eBay tool naming convention.
