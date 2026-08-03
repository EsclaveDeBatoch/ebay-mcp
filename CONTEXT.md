# CONTEXT.md

Orientation for humans and agents landing in this repository. Vocabulary lives in
[LANGUAGE.md](LANGUAGE.md), the file map lives in [ARCHITECTURE.md](ARCHITECTURE.md), and
authored-code decisions live in [CODE-STYLE.md](CODE-STYLE.md).

## What it is

`ebay-mcp` is a local [Model Context Protocol](https://modelcontextprotocol.io) server that
exposes eBay selling operations to AI assistants. It runs on the operator's machine or in a
user-controlled container, owns OAuth credentials, and speaks MCP over STDIO or HTTP.

```text
MCP host  ── MCP call ──>  ebay-mcp  ── authenticated HTTPS/XML ──>  eBay
          <─ completion ─             <──── eBay document/failure ─
                                           │
                                      OAuth token store
```

The server is not hosted and is not a general eBay storefront application. The MCP tool
surface and its authentication/transport behavior are the product.

## Actors and trust boundaries

- **MCP host:** discovers and calls tools on behalf of an agent.
- **ebay-mcp:** validates each external document once, authorizes the caller, invokes one
  eBay operation, and translates the operation completion at the MCP boundary.
- **eBay:** owns official wire names and generated response documents across Sell REST,
  Finding, and Trading XML APIs.
- **OAuth:** obtains, stores, refreshes, and verifies the tokens used by an
  `EbaySellerSession`.
- **HTTP transport:** treats callers as untrusted and fails closed when authentication or
  validation is incomplete.
- **STDIO transport:** assumes the local process boundary is trusted but still validates
  every MCP call.

## Current shape

The checked-in implementation is still layer-first:

```text
host call
  -> src/tools registry and category handler
  -> Effect-backed schema adapter
  -> EbaySellerApi facade and area API class
  -> REST or Trading transport
  -> optional UI mapping
  -> host
```

This is migration inventory, not the destination. Existing paths do not justify new
facades, adapters, barrels, compatibility exports, or response schemas.

## Approved operation shape

Each migrated operation follows one visible path:

```text
host calls ebay_sell_analytics_get_traffic_report
  -> src/mcp/ebayToolCatalogue.ts selects the named tool
  -> defineTool validates one strict Zod arguments object and injects EbaySellerSession
  -> src/ebay/sell/analytics/trafficReport.ts calls the eBay resource operation
  -> focused HTTP transport returns EbayRequestCompletion<TrafficReport>
  -> defineTool translates the completion once for MCP
  -> src/ui/presentation/analytics.ts projects only when a browser view needs it
```

The resource module owns its strict inbound schema, generated eBay aliases, operation
functions, and named MCP tool definitions. Generated response documents pass through
unchanged.

## Cross-cutting behavior

- **Tool exposure:** the target vocabulary is eBay's official namespace and API path, such
  as `sell.analytics`. Connector and local-auth tools remain explicit local exceptions.
- **Transports:** STDIO and HTTP compose the same catalogue and operation behavior; only
  their trust and framing concerns differ.
- **Failures:** fallible eBay work returns an explicit discriminated completion. Endpoint
  code does not throw into MCP handlers or hide failures behind generic wrappers.
- **Logging:** one structured logger writes four severity levels to STDERR under one
  `LOG_LEVEL` policy. Runtime file logging and Winston are migration removals.
- **Configuration:** each process entry decodes environment variables once and passes typed
  dependencies inward.

## Migration invariant

Move one official resource slice at a time, write both test layers first, directly import
its named tools into the catalogue, then delete the final old callers and files. Never add
a compatibility path to bridge the old and new structures.

## Where to look first

- Install and operate the server: [README.md](README.md)
- Change code: [AGENTS.md](AGENTS.md) and [CODE-STYLE.md](CODE-STYLE.md)
- Understand the target tree: [ARCHITECTURE.md](ARCHITECTURE.md)
- Use the shared vocabulary: [LANGUAGE.md](LANGUAGE.md)
- Understand architectural decisions: [docs/adr/current/](docs/adr/current/)
