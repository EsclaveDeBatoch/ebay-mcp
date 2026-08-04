# CODE-STYLE.md

This file is the prescriptive source of truth for how code is written in `ebay-mcp`.
The current tree is migrating toward this contract; existing code is evidence, not an
exception or a compatibility requirement. The byte-identical machine index lives in
[`code-style.rules.json`](code-style.rules.json).

The migration must stay green. A target rule uses `judgment` until its existing violations
are removed and a real detector is proven with a planted violation; it then moves to a
blocking command in both this guide and the machine mirror.

## Stack & framework practices

- MCP server registration follows the official
  [`@modelcontextprotocol/sdk`](https://github.com/modelcontextprotocol/typescript-sdk)
  documentation.
- Runtime validation follows the official [Zod 4 documentation](https://zod.dev/).
- Browser components follow React's official rules; this guide owns only repository-specific
  decisions on top of them.
- Biome owns formatting and lint; no Prettier or ESLint layer exists.

## How to read a rule

| Slot | Meaning |
| --- | --- |
| `[rule:...]` | Stable identifier shared with `code-style.rules.json` |
| `verify` | Cheapest command that honestly proves the rule, or `judgment` |
| `// ✓` | Target form for new and migrated code |
| `// ✗` | Concrete off-path form |

## Rules

### Public function form
[rule:function.public-arrow] · verify: judgment

New and migrated exported functions use named arrow constants, while private top-level helpers may use declarations when hoisting improves reading.

```ts
// ✓ src/ebay/sell/analytics/trafficReport.ts
export const getTrafficReport = async (
  sellerSession: EbaySellerSession,
  trafficReportQuery: TrafficReportQuery,
) => sellerSession.get('/sell/analytics/v1/traffic_report', trafficReportQuery);

// ✗ mixed public forms
export function getTrafficReport(trafficReportQuery: TrafficReportQuery) {}
export default getTrafficReport;
```

Why: Public symbols have one searchable identity without forcing arrows onto private helpers.

### Domain action names
[rule:function.domain-name] · verify: judgment

Repository-authored function names state the domain action and never begin with `build`, `to`, or `resolve`.

```ts
// ✓ src/ebay/sell/inventory/offer.ts
export const publishOffer = async (sellerSession: EbaySellerSession, offerId: string) => {};

// ✗ generic AI-style verbs
const buildOfferRequest = () => {};
const toOfferDocument = () => {};
const resolveOfferPath = () => {};
```

Why: A caller should know the product action without opening the function.

### React component contracts
[rule:react.component-contract] · verify: judgment

React components are named arrow constants with named readonly prop type aliases and never use `React.FC`.

```tsx
// ✓ src/ui/browser/TrafficChart.tsx
type TrafficChartProps = {
  readonly trafficSeries: ReadonlyArray<TrafficSeries>;
};

export const TrafficChart = ({ trafficSeries }: TrafficChartProps) => <section />;

// ✗ hidden or inline contracts
export const TrafficChart: React.FC<{ trafficSeries: TrafficSeries[] }> = () => <section />;
```

Why: Component ownership and writable inputs stay explicit.

### Stateful classes only
[rule:class.stateful-lifecycle] · verify: judgment

A class exists only when it owns a genuine stateful lifecycle with identity across calls.

```ts
// ✓ src/auth/oauthSession.ts
export class OAuthSession {
  readonly #tokenStore: TokenStore;
}

// ✗ stateless endpoint service
export class AnalyticsApi {
  getTrafficReport = async () => {};
}
```

Why: Pure behavior remains local while real lifecycle state has an owner.

### Domain-specific identifiers
[rule:name.domain-specific] · verify: judgment

Authored identifiers name their domain job and never use a forbidden generic token as a standalone local, parameter, or generic type name.

```ts
// ✓ src/ebay/sell/fulfillment/order.ts
const refundedOrderIds = new Set<string>();
const orderCompletion = await refundOrder(sellerSession, refundDocument);

// ✗ forbidden standalone names
const result = await run(input);
const payload = data;
const raw = response;
```

Why: Precise names carry context through the call chain.

Forbidden standalone tokens: `args`, `body`, `client`, `config`, `context`, `data`,
`entry`, `error`, `final`, `info`, `input`, `item`, `key`, `manager`, `options`,
`outcome`, `output`, `params`, `payload`, `query`, `raw`, `record`, `ref`, `request`,
`res`, `response`, `result`, `row`, `schema`, `state`, `temp`, and `value`.
Composite domain names such as `trafficReportQuery`, external wire fields, generated code,
and library-owned property names are exempt.

### Handwritten file names
[rule:path.camelcase-files] · verify: `npm run check:ci`

Handwritten TypeScript and TSX basenames use camelCase while generated and upstream filenames remain unchanged.

```ts
// ✓ src/ebay/sell/account/customPolicy.ts
// ✓ src/generated/ebay/sell-apps/account-management/sellAccountV1Oas3.ts

// ✗ handwritten source
// src/ebay/sell/account/custom-policy.ts
// src/ebay/sell/account/custom_policy.ts
```

Why: Authored paths follow one convention without rewriting vendor artifacts.

### Direct owner imports
[rule:import.direct-owner] · verify: judgment

Imports use `./` for same-folder siblings, `@/` across modules, `node:` for built-ins, and never traverse through `../` or a handwritten barrel.

```ts
// ✓ src/ebay/sell/analytics/trafficReport.ts
import { defineTool } from '@/mcp/defineTool.js';
import { trafficReportChart } from '@/ui/presentation/trafficReport.js';
import type { TrafficReportQuery } from './trafficReportQuery.js';

// ✗ path ladders and facades
import { defineTool } from '../../../mcp/index.js';
```

Why: Every import points at the real owner and survives unrelated folder moves.

### Named exports without compatibility
[rule:module.named-exports] · verify: `npm run check:ci`

Authored modules use named exports and never preserve an old path through an alias or compatibility re-export.

```ts
// ✓ src/mcp/defineTool.ts
export const defineTool = <EbayDocument>(toolContract: ToolContract<EbayDocument>) => {};

// ✗ default and compatibility surfaces
export default defineTool;
export { defineTool as createTool };
export * from './legacyTools.js';
```

Why: Removing or moving code also removes its obsolete public surface.

### Explicit branching
[rule:control.explicit-branches] · verify: judgment

Authored control flow uses explicit guards and contains no `??`, `||`, ternary expression, non-null assertion, or deep optional chain.

```ts
// ✓ src/ui/presentation/trafficReport.ts
if (trafficReport.records === undefined) {
  return emptyTrafficChart;
}

const trafficRecords = trafficReport.records;

// ✗ hidden fallback and branch
const trafficRecords = trafficReport.records ?? [];
const title = trafficRecords.length ? 'Traffic' : 'No traffic';
```

Why: Missing states and product decisions stay visible.

### Stable bindings
[rule:mutation.const-bindings] · verify: judgment

Authored bindings use `const`, with mutation limited to a clearly named accumulator held by a constant reference.

```ts
// ✓ src/ui/presentation/trafficReport.ts
const chartPoints: ChartPoint[] = [];
for (const trafficRecord of trafficRecords) {
  chartPoints.push(trafficPoint);
}

// ✗ reassignment-driven flow
let chartPoints: ChartPoint[] = [];
chartPoints = appendTrafficPoint(chartPoints);
```

Why: Bindings stay stable without contorting straightforward loops.

### Guards and closed variants
[rule:control.guards-switches] · verify: judgment

Failed prerequisites return early and genuine closed variants use an exhaustive switch.

```ts
// ✓ src/cli/commandCompletion.ts
if (commandName === undefined) {
  return missingCommandCompletion;
}

switch (commandCompletion.kind) {
  case 'commandSucceeded':
    return 0;
  case 'commandFailed':
    return 1;
  case 'invalidUsage':
    return 2;
  case 'interrupted':
    return 130;
}

// ✗ nested decision tree
if (commandName !== undefined) {
  if (commandName === 'serve') {}
}
```

Why: The happy path stays linear and variants remain exhaustive.

### Collection intent
[rule:collection.intent] · verify: judgment

Collections use one direct transformation or an explicit `for...of` loop and never use `reduce` or `forEach`.

```ts
// ✓ src/mcp/ebayToolCatalogue.ts
const toolNames = ebayTools.map((ebayTool) => ebayTool.name);
for (const ebayTool of ebayTools) {
  mcpServer.registerTool(ebayTool);
}

// ✗ phase-hiding callbacks
ebayTools.forEach(registerTool);
const toolMap = ebayTools.reduce(indexTool, {});
```

Why: Multi-step and early-exit work reads in execution order.

### Promise and Zod foundation
[rule:async.promise-zod] · verify: judgment

Fallible asynchronous work uses native promises and direct Zod 4 schemas without Effect or a repository-owned schema adapter.

```ts
// ✓ src/ebay/sell/analytics/trafficReport.ts
export const trafficReportQuerySchema = z.object({ metric: z.string().min(1) }).strict();
export const getTrafficReport = async () => sellerSession.get<TrafficReport>(trafficReportCall);

// ✗ extra runtime and conversion layers
const trafficReportEffect = Effect.gen(function* () {});
const jsonSchema = zodToJsonSchema(trafficReportQuerySchema);
```

Why: The MCP SDK already accepts Zod and the language already owns promises.

### Decode once
[rule:validation.decode-once] · verify: judgment

Each external boundary decodes through one strict Zod schema and downstream typed code does not validate the same fields again.

```ts
// ✓ src/mcp/defineTool.ts
mcpServer.registerTool(toolName, { inputSchema: argumentsSchema }, decodedArgumentsHandler);

// ✗ repeated internal checking
requireObject(argumentsFromMcp);
requireString(argumentsFromMcp.metric);
```

Why: Boundary trust is explicit and internal code stays focused on behavior.

### Typed completions
[rule:failure.ebay-completion] · verify: judgment

Fallible eBay operations return `EbayRequestCompletion<EbayDocument>` and the MCP boundary translates its failure branch once.

```ts
// ✓ src/ebay/ebayRequestCompletion.ts
export type EbayRequestCompletion<EbayDocument> =
  | { readonly kind: 'ebayRequestSucceeded'; readonly ebayDocument: EbayDocument }
  | { readonly kind: 'ebayRequestFailed'; readonly ebayFailure: EbayFailure };

// ✗ thrown endpoint failure
throw new Error('eBay request failed');
```

Why: Success and failure remain explicit without repeating an operation-specific union.

### Authored type aliases
[rule:type.alias-contracts] · verify: judgment

Repository-authored contracts use type aliases while interfaces are reserved for third-party module augmentation.

```ts
// ✓ src/ebay/ebaySellerSession.ts
export type EbaySellerSession = {
  readonly get: <EbayDocument>(ebayCall: EbayGetCall) => Promise<EbayRequestCompletion<EbayDocument>>;
};

// ✗ interchangeable authored interface
export interface EbaySellerSession {}
```

Why: Object and union contracts follow one composable form.

### Exact eBay wire keys
[rule:ebay.exact-wire-keys] · verify: judgment

Inbound MCP arguments use the exact field names documented by eBay and are never renamed for local taste.

```ts
// ✓ src/ebay/sell/analytics/customerServiceMetric.ts
const customerServiceMetricQuerySchema = z.object({
  evaluation_marketplace_id: z.string().min(1),
});

// ✗ translation layer
const customerServiceMetricQuerySchema = z.object({ evaluationMarketplaceId: z.string() });
```

Why: Tool callers can follow eBay documentation without learning a second request shape.

### Generated eBay documents
[rule:ebay.generated-documents] · verify: judgment

Resource operations return generated eBay documents unchanged and create presentation shapes only inside the UI boundary.

```ts
// ✓ src/ebay/sell/analytics/trafficReport.ts
export type TrafficReport = components['schemas']['Report'];
return sellerSession.get<TrafficReport>(trafficReportCall);

// ✗ copied response object
return { records: ebayDocument.records, warnings: ebayDocument.warnings };
```

Why: The OpenAPI document remains the single response contract.

### Official resource layout
[rule:path.ebay-resource-layout] · verify: judgment

An eBay resource module lives at `src/ebay/<namespace>/<api>/<resource>.ts` and owns its argument schemas, generated aliases, operations, and MCP definitions.

```ts
// ✓ official resource owner
// src/ebay/sell/analytics/trafficReport.ts

// ✗ one behavior spread across layers
// src/api/analytics.ts
// src/schemas/analytics.ts
// src/tools/categories/analytics.ts
```

Why: The filesystem answers where an official eBay operation belongs.

### Machine-owned roots
[rule:path.machine-owned-roots] · verify: judgment

OpenAPI inputs live under `specs/ebay` and generated TypeScript lives under `src/generated/ebay` with upstream names preserved.

```ts
// ✓ machine inputs and products
// specs/ebay/sell-apps/analytics-and-report/sell_analytics_v1_oas3.json
// src/generated/ebay/sell-apps/analytics-and-report/sellAnalyticsV1Oas3.ts

// ✗ mixed human and generated ownership
// specs/ebay/sell-apps/analytics-and-report/sell_analytics_v1_oas3.json
// src/types/ebay.ts
```

Why: Human documentation and authored contracts cannot be mistaken for generated artifacts.

### Purpose-named folders
[rule:architecture.purpose-folders] · verify: judgment

Authored folders name a concrete responsibility and never use `utils`, `helpers`, `common`, `shared`, or `misc` as a destination.

```ts
// ✓ target owners
// src/auth/  src/cli/  src/http/  src/logging/  src/mcp/  src/ebay/  src/ui/

// ✗ catch-all destination
// src/utils/http.ts
// src/shared/helpers.ts
```

Why: A folder should predict why its contents change together.

### Earned abstractions
[rule:architecture.earned-abstraction] · verify: judgment

An abstraction exists only when it names a domain concept, owns a side-effect boundary, or serves a second real caller.

```ts
// ✓ shared by every eBay resource
export type EbayRequestCompletion<EbayDocument> = Success<EbayDocument> | Failure;

// ✗ one-use wrapper
const getSelectDefaultIndex = () => selectDefaultIndex;
```

Why: Reuse is evidence, not a forecast.

### No pass-through layers
[rule:architecture.no-indirection] · verify: judgment

Repository-owned wrappers and facades remain only when they enforce policy that callers would otherwise repeat.

```ts
// ✓ one protocol boundary
export const defineTool = (toolContract: ToolContract) => registerTypedTool(toolContract);

// ✗ compatibility and pass-through layers
export const rawTool = (toolContract: ToolContract) => defineTool(toolContract);
export class EbaySellerApiFacade {}
```

Why: Navigation should reveal policy rather than ceremony.

### Process-entry configuration
[rule:config.entry-ownership] · verify: judgment

Each process entry parses `process.env` once with Zod and passes the typed configuration to every downstream owner.

```ts
// ✓ src/index.ts
const stdioConfiguration = stdioConfigurationSchema.parse(process.env);
await runStdioServer(stdioConfiguration);

// ✗ hidden global read
const logLevel = process.env.EBAY_LOG_LEVEL;
```

Why: Configuration precedence and failure happen once at startup.

### Explicit seller session
[rule:http.seller-session] · verify: judgment

Resource operations receive `EbaySellerSession` explicitly while the session alone owns authentication, omission, and wire serialization.

```ts
// ✓ src/ebay/sell/inventory/offer.ts
export const getOffer = async (sellerSession: EbaySellerSession, offerId: string) =>
  sellerSession.get<Offer>({ endpoint: `/sell/inventory/v1/offer/${offerId}` });

// ✗ global facade and endpoint transport logic
return ebaySellerApi.inventory.getOffer(offerId);
```

Why: eBay operations declare their capability without owning transport mechanics.

### Thin MCP operations
[rule:mcp.thin-tool] · verify: judgment

An endpoint-backed MCP tool validates once, invokes one resource operation, and returns its generated eBay document without reshaping.

```ts
// ✓ src/ebay/sell/analytics/trafficReport.ts
export const getTrafficReportTool = defineTool({
  argumentsSchema: trafficReportQuerySchema,
  operationKind: 'read',
  operation: getTrafficReport,
});

// ✗ endpoint workflow hidden in a handler
handler: async () => combine(await firstCall(), await secondCall()),
```

Why: Real multi-operation work deserves an explicit workflow name.

Every migrated definition states `operationKind: 'read' | 'write'`. The MCP annotations and
`EBAY_READ_ONLY` behavior derive from that explicit business effect; a write is never inferred
from its name.

### Explicit tool catalogue
[rule:mcp.explicit-catalogue] · verify: judgment

The explicit `src/mcp/ebayToolCatalogue.ts` catalogue imports every named tool definition directly and never discovers files or consumes resource-level tool arrays.

```ts
// ✓ src/mcp/ebayToolCatalogue.ts
import { getTrafficReportTool } from '@/ebay/sell/analytics/trafficReport.js';
export const ebayTools = [getTrafficReportTool];

// ✗ implicit or aggregated wiring
const ebayTools = await discoverTools(import.meta.dirname);
import { trafficReportTools } from '@/ebay/sell/analytics/trafficReport.js';
```

Why: Registration is deterministic and every public tool is grep-visible.

### Hierarchical tool namespace
[rule:mcp.hierarchical-names] · verify: judgment

eBay tools and exposure gates mirror official namespaces while protocol-required connector tools keep the exact names `search` and `fetch`.

```ts
// ✓ public names
name: 'ebay_sell_analytics_get_traffic_report';
namespace: 'sell.analytics';

// ✗ ambiguous global names
name: 'ebay_get_traffic_report';
namespace: 'other';
```

Why: Global MCP names remain unambiguous across eBay APIs.

### Structured stderr logging
[rule:logging.structured-stderr] · verify: judgment

Runtime code emits redacted structured logs to stderr through one logger controlled only by `LOG_LEVEL`.

```ts
// ✓ src/logging/runtimeLogger.ts
runtimeLogger.info('mcpServerStarted', { transport: 'stdio' });

// ✗ protocol corruption and secret exposure
console.log('server started');
runtimeLogger.info('eBay response', fullEbayDocument);
```

Why: stdout belongs to MCP and operational logs must not leak credentials or documents.

### Presentation-only mapping
[rule:ui.presentation-boundary] · verify: judgment

Browser-facing view models are created only in `src/ui/presentation` and browser network work calls the server through `callServerTool`.

```ts
// ✓ src/ui/presentation/trafficReport.ts
export const trafficReportChart = (trafficReport: TrafficReport): ChartViewModel => {};

// ✗ transport-layer presentation and direct eBay access
export const getTrafficReport = async () => ({ chart: await fetch(ebayUrl) });
```

Why: The eBay contract and its visual projection have separate reasons to change.

### React state ownership
[rule:ui.state-ownership] · verify: judgment

Props remain the source of truth, local state records user actions only, and effects synchronize only real external systems.

```tsx
// ✓ src/ui/browser/TrafficChart.tsx
export const TrafficChart = ({ trafficSeries }: TrafficChartProps) => (
  <Chart trafficSeries={trafficSeries} />
);

// ✗ prop mirror and synchronization effect
const [trafficSeries, setTrafficSeries] = useState(props.trafficSeries);
useEffect(() => setTrafficSeries(props.trafficSeries), [props.trafficSeries]);
```

Why: Each piece of writable state has one owner.

### Accessible class-based UI
[rule:ui.accessible-classnames] · verify: judgment

Visual styling uses `className` with finite typed variants and interactive behavior uses semantic keyboard-accessible elements with stable domain keys.

```tsx
// ✓ src/ui/browser/OfferList.tsx
<button className={offerButtonClasses[offerTone]} key={offer.offerId} type="button">
  View offer
</button>

// ✗ unbounded styling and inaccessible interaction
<tr key={offerIndex} onClick={openOffer} style={{ color: offerColor }} />
```

Why: Visual variants stay inspectable and interaction works beyond pointer input.

### Full two-layer TDD
[rule:test.both-boundaries] · verify: judgment

Every eBay operation is written red-first with complete resource-contract coverage and the same validation and failure depth through the real MCP server.

```ts
// ✓ colocated plus integration proof
// src/ebay/sell/analytics/trafficReport.test.ts
// tests/integration/mcp/sell/analytics/trafficReport.test.ts

// ✗ framework-only confidence
it('registers all tools', () => expect(toolCount).toBe(292));
```

Why: Both public boundaries are independently proven as requested.

### Test ownership and fixtures
[rule:test.ownership-fixtures] · verify: judgment

Product tests are colocated, integration tests mirror the official API tree, and shared fixtures appear only after a second use with real eBay examples.

```ts
// ✓ tests/fixtures/ebaySellerSession.ts after repeated use
const trafficReportDocument = { records: [] } satisfies TrafficReport;

// ✗ giant facade mock and generic factory
const mockApi = createMockApiEverything();
```

Why: Tests name product behavior instead of implementation machinery.

### Intent-only documentation
[rule:docs.intent-and-sync] · verify: judgment

Documentation explains public eBay contracts, official references, vendor quirks, and non-obvious decisions while changing in the same pull request as the behavior.

```ts
// ✓ src/ebay/sell/analytics/trafficReport.ts
/** @see https://developer.ebay.com/api-docs/sell/analytics/resources/traffic_report/methods/getTrafficReport */

// ✗ narration
/** Gets the traffic report by calling getTrafficReport. */
```

Why: Documentation should carry information unavailable from names and types.

### Rule-card parity
[rule:docs.rule-card-parity] · verify: `npm run style:guide`

Every rule card matches one machine-mirror rule in the same order with byte-identical assertion and verification text.

```ts
// ✓ CODE-STYLE.md + code-style.rules.json
[rule:docs.rule-card-parity] · verify: `npm run style:guide`

// ✗ prose-only or drifting rule
// CODE-STYLE.md says one thing while the JSON index says another.
```

Why: Humans and automated reviews consume one guaranteed-accurate contract.

### Biome formatting
[rule:tooling.biome] · verify: `npm run check:ci`

Biome alone formats authored files with two spaces, width 100, single quotes, semicolons, trailing commas, and LF endings.

```ts
// ✓ biome.json
const marketplaceIds = ['EBAY_US', 'EBAY_GB'];

// ✗ competing or drifting formatter output
const marketplaceIds=["EBAY_US","EBAY_GB"]
```

Why: One mechanical authority prevents formatter disagreement.

### Organized imports
[rule:tooling.organized-imports] · verify: judgment

Biome organizes imports after the existing import-order drift is cleaned and a planted violation proves the blocking rule.

```jsonc
// ✓ target biome.json
{ "assist": { "actions": { "source": { "organizeImports": "on" } } } }

// ✗ migration state mistaken for the final contract
{ "assist": { "actions": { "source": { "organizeImports": "off" } } } }
```

Why: The approved rule remains visible without pretending the current backlog is already enforced.

### Deterministic CLI
[rule:cli.deterministic-surface] · verify: judgment

The shipped CLI uses `parseArgs`, opens a menu only for a bare TTY invocation, never prompts for explicit or non-TTY commands, and returns `CommandCompletion` to the entry boundary.

```ts
// ✓ src/cli/main.ts
// serve | setup | diagnose [--json] | skills install | help [--json] | version [--json]

// ✗ command-owned process and prompt behavior
process.exit(1);
await prompts(promptQuestions);
```

Why: Human discovery and agent automation share one non-hanging command surface.

### Machine-readable CLI output
[rule:cli.json-output] · verify: judgment

JSON mode writes exactly one document to stdout, sends logs to stderr, and uses exit codes 0, 1, 2, and 130 for success, operation failure, usage failure, and interruption.

```ts
// ✓ src/cli/main.ts
process.stdout.write(`${JSON.stringify(commandDocument)}\n`);
process.exitCode = commandExitCode;

// ✗ mixed automation output
console.log(chalk.green('Success'));
console.log(JSON.stringify(commandDocument));
```

Why: Agents receive a stable parseable contract.

### Tool-first scripts
[rule:tooling.tool-first-scripts] · verify: judgment

Shipped commands live in `src/cli`, repository development glue lives in `scripts/dev`, production glue lives in `scripts/production`, and installed CLIs are called directly.

```ts
// ✓ scripts/dev/syncEbaySpecs.ts
// eBay multi-spec download plus direct openapi-typescript invocation

// ✗ duplicate or dormant tooling
// src/scripts/downloadSpecs.ts
// src/scripts/generateTypes.sh
```

Why: The repository owns only lifecycle work an installed tool cannot perform.

### Exact justified dependencies
[rule:tooling.exact-dependencies] · verify: judgment

Every direct dependency uses an exact reviewed version and remains only while it owns a named runtime, UI, generation, or test responsibility.

```json
// ✓ package.json
{ "zod": "4.4.3", "typescript": "6.0.3" }

// ✗ unreviewed drift or dead architecture
{ "zod": "^3.25.76", "effect": "^3.21.4" }
```

Why: Fresh installs and the dependency surface change deliberately.

### Cohesive size signals
[rule:file.cohesive-size] · verify: judgment

Files and functions split when they mix responsibilities, with 300 file lines and 60 function lines acting as review signals rather than hard caps.

```ts
// ✓ one declarative catalogue may exceed 300 lines
// src/mcp/ebayToolCatalogue.ts

// ✗ setup, validation, OAuth, rendering, and filesystem work in one function
export const runSetupEverything = async () => {};
```

Why: Size prompts a cohesion review without creating microfiles.

### Green delivery slices
[rule:delivery.green-slices] · verify: judgment

Repository-wide migration ships as conventional focused purpose-branch pull requests that remain independently green and add no backward-compatibility surface.

```text
// ✓ delivery sequence
foundation -> golden slice -> namespace slices -> CLI/auth/logging -> UI -> deletion -> enforcement

// ✗ delivery shape
one giant cleanup commit with aliases keeping every old path alive
```

Why: Each stage is reviewable, recoverable, and useful on its own.

## Canonical example

The first production exemplar is the Sell Analytics `traffic_report` resource.

```ts
// src/ebay/sell/analytics/trafficReport.ts
import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/analytics-and-report/sellAnalyticsV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';
import { trafficReportChart } from '@/ui/presentation/trafficReport.js';

export const trafficReportQuerySchema = z
  .object({
    dimension: z.enum(['DAY', 'LISTING']),
    filter: z.string().min(1),
    metric: z.string().min(1),
    sort: z.string().min(1).optional(),
  })
  .strict();

export type TrafficReportQuery = z.infer<typeof trafficReportQuerySchema>;
export type TrafficReport = components['schemas']['Report'];

export const getTrafficReport = async (
  sellerSession: EbaySellerSession,
  trafficReportQuery: TrafficReportQuery,
): Promise<EbayRequestCompletion<TrafficReport>> =>
  sellerSession.get<TrafficReport>({
    endpoint: '/sell/analytics/v1/traffic_report',
    searchParameters: trafficReportQuery,
  });

export const getTrafficReportTool = defineTool({
  name: 'ebay_sell_analytics_get_traffic_report',
  namespace: 'sell.analytics',
  description: 'Retrieve traffic metrics for the seller\'s listings',
  argumentsSchema: trafficReportQuerySchema,
  operationKind: 'read',
  operation: getTrafficReport,
  presentation: {
    archetype: 'chart',
    project: trafficReportChart,
  },
});
```

The colocated suite proves strict arguments, exact method/path/wire fields, generated-document
pass-through, and typed failures; the mirrored MCP integration suite repeats that full depth
through the real server.

## Golden path — adding an eBay operation

1. Read the official specification under `specs/ebay` and the matching generated contract
   under `src/generated/ebay`.
2. Open the official resource owner at
   `src/ebay/<namespace>/<api>/<resource>.ts`; create it only for a genuinely new resource.
3. Write the failing colocated resource-contract scenarios and the mirrored failing MCP
   integration scenarios under `tests/integration/mcp/<namespace>/<api>/`.
4. Add one strict Zod argument schema with the exact eBay wire fields.
5. Add the exported arrow operation with `sellerSession` and the named eBay query or document.
6. Return `EbayRequestCompletion<GeneratedEbayDocument>` without response reshaping.
7. Define the hierarchical tool beside the operation and pass the operation directly to
   `defineTool`.
8. Import the named definition directly in `src/mcp/ebayToolCatalogue.ts` without an array,
   barrel, alias, or compatibility export.
9. Add a presenter under `src/ui/presentation` only when the visual shape genuinely differs.
10. Run focused tests, then the complete validation gate, and update terminology or decision
    docs in the same pull request.

### Definition of done

- [ ] Both full-depth suites were red before implementation and are green afterward.
- [ ] The MCP arguments are strict and match official eBay wire fields.
- [ ] The resource returns the generated eBay document unchanged.
- [ ] The tool name and gate use the official hierarchical namespace.
- [ ] No generic identifier, fallback operator, ternary, `let`, barrel, facade, or compatibility
      export was introduced.
- [ ] `npm run verify` and `npm run test:integration` pass.
- [ ] Relevant `CONTEXT.md`, `LANGUAGE.md`, `ARCHITECTURE.md`, ADR, and user docs changed with
      the behavior.

See the [canonical example](#canonical-example) for the composed target form.

## Exemplars

Production evidence:

- `src/ebay/sell/analytics/trafficReport.ts` — strict arguments, generated document alias,
  promise operation, and named hierarchical MCP definition.
- `src/ebay/sell/analytics/trafficReport.test.ts` — complete local resource contract.
- `tests/integration/mcp/sell/analytics/trafficReport.test.ts` — the same product depth through
  the real MCP SDK transport and runtime catalogue.
- `src/ui/presentation/trafficReport.ts` — the only traffic-report projection boundary.

## Never

- Generic standalone identifiers from [rule:name.domain-specific].
- Repository function names beginning `build`, `to`, or `resolve` from
  [rule:function.domain-name].
- `??`, `||`, ternaries, non-null assertions, deep optional chains, `let`, `reduce`, or
  `forEach` from [rule:control.explicit-branches], [rule:mutation.const-bindings], and
  [rule:collection.intent].
- `isRecord`-style micro-guards, repeated Zod decoding, swallowed catches, and speculative
  fallback branches from [rule:validation.decode-once].
- Effect, custom Effect/Zod adapters, manual response schemas, and repository JSON-schema
  conversion from [rule:async.promise-zod] and [rule:ebay.generated-documents].
- `rawTool`, global API facades, single-use wrappers, passive barrels, compatibility exports,
  and single-implementation interfaces from [rule:architecture.no-indirection].
- Field-copy remaps and one-use `toXRow` helpers outside `src/ui/presentation` from
  [rule:ui.presentation-boundary].
- Prop-derived state, prop-sync effects, clickable rows, index keys, style props, CSS-in-JS,
  CSS variables, and arbitrary visual strings from [rule:ui.state-ownership] and
  [rule:ui.accessible-classnames].
- Giant facade mocks, snapshots of generated documents, private-helper tests, and assertions on
  incidental call order from [rule:test.ownership-fixtures].
- Dormant alternate scripts, wrappers around installed CLIs, generated status snapshots, and
  regex/fuzzy source discovery from [rule:tooling.tool-first-scripts].

## Recipes

### Add or change a CLI command

1. Add the command under `src/cli` with explicit dependencies and a
   `Promise<CommandCompletion>` return.
2. Register the command with `parseArgs`; never branch on TTY inside an explicit command.
3. Add human output through the CLI renderer and one-document `--json` output through the entry.
4. Test success, operation failure, usage failure, interruption, JSON purity, and non-TTY behavior.

### Add or change a UI projection

1. Keep the generated eBay document unchanged through the resource and MCP operation.
2. Add the smallest genuine projection under `src/ui/presentation/<api>.ts`.
3. Use class-name variants only and semantic interactive elements in the browser component.
4. Test the presentation behavior, keyboard path, labels, focus behavior, and stable domain keys.

## Verification

```bash
npm run style:guide
npm run check:ci
npm run typecheck
npm run typecheck:ui
npm run typecheck:tests
npm test
npm run test:integration
npm run build
```
