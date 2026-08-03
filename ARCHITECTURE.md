# ebay-mcp architecture

This document records the checked-in migration inventory and the approved destination.
Read [CONTEXT.md](CONTEXT.md) first and use [CODE-STYLE.md](CODE-STYLE.md) for code idioms.

## Current migration inventory

The repository currently separates one operation across layers:

```text
src/api/       endpoint classes and transports
src/schemas/   Effect-backed endpoint schemas
src/tools/     category definitions, handlers, registry, and UI metadata
src/types/     generated and handwritten types mixed under one root
src/utils/     unrelated platform primitives and schema adapters
src/scripts/   shipped commands and development automation mixed together
docs/          documentation mixed with upstream specifications
```

These roots remain real until their final callers migrate. They are not patterns for new
code and receive no compatibility exports when removed.

## Approved target layout

```text
specs/ebay/                         # upstream OpenAPI JSON; machine-owned
src/
├── index.ts                        # package/bin entry
├── serverHttp.ts                   # HTTP process entry
├── auth/                           # OAuth and credential lifecycles
├── cli/                            # shipped deterministic commands
├── config/                         # strict process-entry environment contracts
├── ebay/
│   ├── ebayRequestCompletion.ts    # shared discriminated eBay completion
│   ├── ebaySellerSession.ts        # explicit authenticated operation dependency
│   ├── sell/<api>/<resource>.ts
│   ├── commerce/<api>/<resource>.ts
│   ├── developer/<api>/<resource>.ts
│   ├── finding/<resource>.ts
│   └── trading/<resource>.ts
├── generated/ebay/                 # openapi-typescript output only; machine-owned
├── http/                           # focused HTTP transport and security policy
├── logging/                        # four-level structured STDERR logger
├── mcp/
│   ├── defineTool.ts               # strict Zod/session/completion boundary
│   ├── ebayToolCatalogue.ts        # explicit named imports for every tool
│   └── runtime.ts                  # transport-independent MCP composition
└── ui/
    ├── presentation/<api>.ts       # browser-only projections
    └── browser/                    # React MCP Apps surface
scripts/
├── dev/syncEbaySpecs.ts            # thin multi-spec generation glue
└── production/                     # release and production automation
tests/integration/mcp/<namespace>/<api>/<resource>.test.ts
```

Final removed roots are `src/api`, `src/schemas`, `src/tools`, `src/utils`, `src/types`,
and `src/scripts`.

## Resource ownership

A resource module owns only the pieces needed to understand and expose that official eBay
resource:

```text
src/ebay/sell/analytics/trafficReport.ts
  strict Zod arguments schema
  generated TrafficReport aliases
  getTrafficReport seller operation
  ebay_sell_analytics_get_traffic_report named tool definition
```

The module does not export an array for a parent barrel. The explicit catalogue imports
each named definition directly. A resource may contain multiple related operations when
the official resource owns them; files do not split merely to satisfy a line cap.

## Operation pipeline

```text
MCP call
  -> runtime chooses an explicitly catalogued tool
  -> defineTool decodes one strict Zod object
  -> defineTool injects EbaySellerSession
  -> one resource operation calls the focused HTTP or Trading transport
  -> operation returns EbayRequestCompletion<GeneratedEbayDocument>
  -> defineTool translates success or failure once
  -> optional presentation projection produces browser fields
```

Operation functions take two parameters: `sellerSession` and a precisely named eBay query
or document. A one-use options wrapper, API facade, endpoint class, handler map, or response
reshaper adds no architectural value.

## Machine-owned boundaries

| Root | Owner | Rule |
| --- | --- | --- |
| `specs/ebay/` | eBay OpenAPI download | Never hand-edit or mix with prose docs. |
| `src/generated/ebay/` | `openapi-typescript` | Never hand-edit or add authored contracts. |
| Resource module | Repository | Import generated aliases directly and keep wire keys exact. |
| Presentation module | Repository | Project generated documents only for browser display. |

The sync command uses explicit specification folders and exact operation identifiers. It
does not patch generated files, use fuzzy matching, create a persistent status snapshot,
or maintain parallel endpoint reports.

## Tool exposure and naming

eBay tools use `ebay_<namespace>_<api>_<operation>` names, for example
`ebay_sell_analytics_get_traffic_report`. Exposure gates use official paths such as
`sell.analytics`. Valid exposure paths are derived when the process composes the explicit
catalogue, keeping environment parsing free of tool-tree cycles. `search` and `fetch` are
the exact connector exceptions.

## Process composition

Each process entry parses its environment once with strict Zod, creates explicit auth,
logging, transport, and seller-session dependencies, then passes them inward. HTTP fails
closed. STDIO trusts the local process boundary but still decodes every MCP call. Runtime
logs never write to STDOUT.

## CLI architecture

The package entry uses Node's `parseArgs` and the existing `prompts` dependency. A bare TTY
invocation opens the menu; a bare non-TTY invocation starts STDIO. Explicit commands never
prompt. Command modules accept explicit dependencies and return `CommandCompletion`; only
the entry writes streams and assigns `process.exitCode`.

Public commands are `serve`, `setup`, `diagnose [--json]`, `skills install`,
`help [--json]`, and `version [--json]`. Development typecheck, test, build, and sync work
remains in package scripts.

## Test architecture

Every operation has two complete business-contract suites:

- A colocated resource test proves strict validation, exact wire behavior, generated
  document passthrough, and every typed failure branch.
- A central integration test exercises the same validation and failure depth through the
  real MCP runtime and catalogue.

Tests use representative eBay fixtures and narrow fakes. A test factory appears only at
its second genuine reuse.

## Migration order

1. Land the code-style contract, docs, and ADRs.
2. Establish the secure Node/dependency baseline and relocate machine-owned roots.
3. Migrate Sell Analytics `traffic_report` as the golden resource slice.
4. Migrate one official namespace/API/resource slice at a time, tests first.
5. Consolidate auth, HTTP, logging, configuration, and CLI after their resource callers are
   explicit.
6. Move UI projections and browser ownership.
7. Delete final legacy roots, dependencies, reports, scripts, and tests.
8. Clean each mechanical rule, prove it with a planted violation, and make it blocking.

Every slice stays independently green and deletes its old path when the final caller moves.
The governing records are [ADR 0007](docs/adr/current/0007-promise-zod-resource-architecture.md),
[ADR 0008](docs/adr/current/0008-cli-command-surface-v2.md),
[ADR 0009](docs/adr/current/0009-dependency-baseline-2026.md), and
[ADR 0010](docs/adr/current/0010-golden-resource-test-depth.md).
