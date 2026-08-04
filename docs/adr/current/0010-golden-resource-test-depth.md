# 0010 — Golden resource slice and two complete test boundaries

**Status:** Accepted · 2026-08-03

## Context

The repository needs one real example that proves the approved resource architecture before
hundreds of operations move. A shallow unit test plus a happy-path integration test would
leave strict validation, eBay wire behavior, and failure translation unclear for every
later contributor.

Sell Analytics `traffic_report` is a representative resource with generated documents,
query validation, authenticated HTTP behavior, MCP exposure, and browser presentation.

## Decision

- Use `src/ebay/sell/analytics/trafficReport.ts` as the first complete migrated resource and
  eventual code exemplar.
- Practice TDD at both product boundaries before implementation:
  - `src/ebay/sell/analytics/trafficReport.test.ts` proves strict argument validation,
    exact query keys, authenticated request behavior, generated document passthrough, and
    every `EbayRequestCompletion` failure variant.
  - `tests/integration/mcp/sell/analytics/trafficReport.test.ts` proves the same validation
    and failure depth through the real MCP runtime, explicit catalogue, and completion
    translation.
- Use representative eBay fixtures and narrow transport/session fakes. Add a shared test
  factory only at its second real reuse.
- Add `src/ui/presentation/trafficReport.ts` only for fields the browser actually renders, and
  cover its business-facing display behavior without fallback placeholders.
- Explicitly import each traffic-report tool into `src/mcp/ebayToolCatalogue.ts`; the
  resource exports named definitions, never an aggregate array.
- Consider the slice complete only when its old schema, API method, handler, facade path,
  mapper, and stale tests are deleted and the full gate passes.

## Consequences

- Later resource migrations copy a proven vertical behavior shape without copying a
  framework or compatibility layer.
- Integration suites are intentionally deeper than smoke tests because the MCP surface is
  the product contract.
- `CODE-STYLE.md` points at the green production slice as the exemplar for later resources.
- A migrated resource cannot claim completion while either test boundary omits validation
  or failure branches.
