# AGENTS.md

Guidance for coding agents and humans working **on** this repository. For installing or
operating the server, use [README.md](README.md).

## What this is

A local MCP server exposing 298 tools across eBay's selling APIs. The current TypeScript
tree is migrating from Effect-backed, layer-first API/schema/tool code to direct Zod 4,
native promises, and official eBay resource modules.

- Current entries: `src/index.ts` for STDIO and `src/serverHttp.ts` for HTTP.
- Current runtime declaration: Node 20 or newer. The approved dependency slice raises this
  to Node 22.12 and tests Node 22 and 24.
- Package manager: pnpm (`pnpm@10.14.0`); npm scripts remain supported.

## Read order and authority

1. [CONTEXT.md](CONTEXT.md) — product actors, trust boundaries, and call shape.
2. [LANGUAGE.md](LANGUAGE.md) — exact repository vocabulary.
3. [ARCHITECTURE.md](ARCHITECTURE.md) — current migration inventory and target tree.
4. Relevant records in [docs/adr/current/](docs/adr/current/).
5. [CODE-STYLE.md](CODE-STYLE.md) — complete prescriptive code rules.

`CODE-STYLE.md` is mirrored in `code-style.rules.json`; `npm run style:guide` guarantees
their card order, verification commands, and assertions remain identical. Change both in
the same pull request.

`CLAUDE.md` imports this file. Keep tool-specific agent files limited to behavior that is
genuinely unique to that tool. README is user documentation, not an agent contract.

## Validation commands

Run before opening a pull request:

```bash
npm run typecheck        # src — must pass
npm run typecheck:ui     # ui — must pass
npm run typecheck:tests  # tests — must pass
npm run check:ci         # Biome + CODE-STYLE/rules parity — must pass
npm test                 # unit and colocated product tests — must pass
npm run test:integration # hermetic real-MCP suite — must pass
npm run build            # TypeScript + alias rewrite + UI bundle — must pass
```

CI exposes these behind one **CI Gate** status check; see
[ADR 0004](docs/adr/current/0004-ci-workflow-architecture.md). Nothing handwritten may be
excluded from typechecking to hide a failure.

Useful current scripts:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the STDIO server with `tsx`. |
| `npm run fix` | Apply Biome fixes and formatting. |
| `npm run setup` | Run the current credential/OAuth wizard. |
| `npm run diagnose` | Check current configuration and connectivity. |
| `npm run sync` | Download eBay specifications and regenerate TypeScript. |
| `npm run skills` | Install using/contributing agent skills. |

## Migration rule

The existing `src/api`, `src/schemas`, `src/tools`, `src/types`, `src/utils`, and
`src/scripts` roots are migration inventory. Do not extend their abstractions. When a
change reaches an old eBay operation, migrate the complete official resource slice and
delete its old path when the final caller moves.

Never add a compatibility export, path alias, facade method, handler adapter, dual wire
name, or old tool-name alias. Independently green pull requests provide recoverability;
parallel architectures do not.

## Golden path — add or migrate an eBay operation

The golden slice is Sell Analytics `traffic_report`. It becomes the linked code exemplar
after the approved migration lands; until then, [CODE-STYLE.md](CODE-STYLE.md) is the exact
target example.

1. Run the sync command and locate the official namespace, API, resource, operation ID,
   specification, and generated response type.
2. Write a failing colocated resource test for strict arguments, exact eBay wire behavior,
   document passthrough, and every failure branch.
3. Write a failing integration test with the same validation and failure depth through the
   real MCP runtime.
4. Create or extend `src/ebay/<namespace>/<api>/<resource>.ts`.
5. Define one strict Zod arguments schema using exact eBay wire keys.
6. Add the operation as a named arrow function accepting `sellerSession` plus the precisely
   named eBay query or document.
7. Return `EbayRequestCompletion<GeneratedEbayDocument>` without response reshaping.
8. Define the named hierarchical tool with `defineTool` and pass the operation directly.
9. Import that named definition explicitly in `src/mcp/ebayToolCatalogue.ts`; do not export
   or consume a resource-level tool array.
10. Add a presentation projection only when the browser uses one, run the full gate, and
    delete the final old implementation with no compatibility surface.

## Code-style digest

The complete rule cards and examples live in [CODE-STYLE.md](CODE-STYLE.md). These are the
load-bearing constraints:

- **Functions and exports:** exported functions and React components are named arrow
  constants; private top-level helpers may be declarations. Named exports only. Classes
  require a genuine stateful lifecycle.
- **Names:** handwritten basenames are camelCase. Authored function names never begin with
  `build`, `to`, or `resolve`. The forbidden standalone identifier list is `args`, `body`,
  `client`, `config`, `context`, `data`, `entry`, `error`, `final`, `info`, `input`, `item`,
  `key`, `manager`, `options`, `outcome`, `output`, `params`, `payload`, `query`, `raw`,
  `record`, `ref`, `request`, `res`, `response`, `result`, `row`, `schema`, `state`, `temp`,
  and `value`. Precise composite domain names and upstream property names are exempt.
- **Control flow:** authored code contains no nullish coalescing, logical-OR fallback,
  ternary, `let`, non-null assertion, deep optional chain, `reduce`, or `forEach`. Prefer
  early guards, exhaustive switches, direct collection operations, and `for...of` for
  multi-step or asynchronous work.
- **Validation and failures:** parse every external boundary once through a strict Zod
  object. Use native promises and explicit discriminated completions. Do not introduce new
  Effect code, schema adapters, repeated object guards, or endpoint `try/catch` wrappers.
- **eBay contracts:** inbound tool keys exactly match official wire names, including
  underscores. Generated eBay documents pass through unchanged. Never copy generated DTOs
  into authored response schemas.
- **Imports and structure:** use `./sibling.js` within one folder and `@/owner/file.js`
  across modules. Never use parent traversal or handwritten barrels. Split by purpose, not
  a hard line cap; introduce an abstraction only for a second caller or a genuine domain
  concept.
- **MCP:** resource modules own schemas, aliases, operations, and named tool definitions.
  The explicit catalogue imports every tool individually. Tool handlers perform one eBay
  operation; multi-operation behavior receives a named workflow.
- **UI:** projection happens only in `src/ui/presentation`. Props remain the source of
  truth; do not initialize state from a prop or synchronize props with effects. Use
  `className` only for visual styling, finite typed variants, semantic controls, accessible
  focus/labels, and stable domain keys.
- **Tests:** TDD follows product and business behavior. Every operation gets both a complete
  local resource suite and equivalent depth through the real MCP boundary. Use real eBay
  fixtures and narrow fakes; create a factory at its second actual reuse.
- **CLI and logs:** bare TTY may prompt; explicit flags and non-TTY commands never prompt.
  JSON mode writes exactly one STDOUT document. Runtime logs are structured STDERR. Only a
  process entry writes streams or assigns `process.exitCode`.
- **Dependencies and tools:** Biome is the only formatter/linter. Direct dependency versions
  are exact in the target baseline and every dependency must own named behavior. Call
  installed CLIs directly from package scripts.

## Target module owners

| Path | Owns |
| --- | --- |
| `specs/ebay/` | Downloaded eBay OpenAPI specifications. |
| `src/generated/ebay/` | Generated TypeScript only. |
| `src/ebay/` | Seller session, typed completion, and official resource modules. |
| `src/auth/` | OAuth and credential lifecycles. |
| `src/cli/` | Shipped deterministic commands. |
| `src/config/` | Strict process-entry environment contracts. |
| `src/http/` | Focused transports and HTTP security. |
| `src/logging/` | Four-level structured STDERR logging. |
| `src/mcp/` | Tool boundary, explicit catalogue, runtime, and exposure. |
| `src/ui/` | Browser surface and presentation projections. |
| `scripts/dev/` | Thin repository-development glue. |
| `scripts/production/` | Production and release glue. |

## Delivery

Use focused conventional commits on purpose branches. Each migration pull request must be
independently green and delete the old implementation it replaces. Protected `main` is
merged through review; releases remain tag-driven and use the pull request's `major` or
`minor` label to select the bump.

## Agent skills

### Issue tracker

Issues and PRDs are tracked in GitHub Issues for `YosefHayim/ebay-mcp`. See
[docs/agents/issue-tracker.md](docs/agents/issue-tracker.md).

### Triage labels

The repository uses the default five-label triage vocabulary. See
[docs/agents/triage-labels.md](docs/agents/triage-labels.md).

### Domain docs

This is a single-context repository: use root `CONTEXT.md` and `docs/adr/`. See
[docs/agents/domain.md](docs/agents/domain.md).
