/**
 * Tool-exposure contract for the `EBAY_MCP_TOOLS` environment variable.
 *
 * This module is deliberately free of any import from the tool tree
 * (`@/tools/*`). `config/environment.ts` validates `EBAY_MCP_TOOLS` and is itself
 * imported by tool handlers (e.g. `tools/categories/tokenManagement.ts`), so
 * pulling the registry in here would create an import cycle. The heavier pieces
 * that genuinely need the registry — the discovery catalogue and the meta-tools —
 * live in `@/mcp/toolGating.ts`, which imports these primitives.
 *
 * Legacy family keys remain while their tools migrate. New resources use official
 * namespace/API paths such as `sell.analytics` in the same exposure list.
 */

import process from 'node:process';

/**
 * Accepted official paths and temporary legacy category keys for a static
 * `EBAY_MCP_TOOLS` list.
 */
export const EBAY_TOOL_EXPOSURE_PATHS = [
  'connector',
  'token-management',
  'account',
  'inventory',
  'fulfillment',
  'marketing',
  'metadata',
  'taxonomy',
  'communication',
  'browse',
  'other',
  'developer',
  'trading',
  'commerce.feedback',
  'commerce.identity',
  'commerce.message',
  'commerce.translation',
  'sell.analytics',
  'sell.negotiation',
  'sell.recommendation',
] as const;

/** A valid eBay tool exposure path. */
export type EbayToolExposurePath = (typeof EBAY_TOOL_EXPOSURE_PATHS)[number];

const EXPOSURE_PATH_SET: ReadonlySet<string> = new Set(EBAY_TOOL_EXPOSURE_PATHS);

/**
 * How the server gates which tools it advertises, resolved from `EBAY_MCP_TOOLS`:
 *
 * - `all` — every tool advertised at boot (the default; unset behaves as `all`).
 * - `dynamic` — only the discovery meta-tools are advertised; the agent enables
 *   eBay tools on demand (requires a host that honours `tools/listChanged`).
 * - `static` — only the named exposure paths are registered, frozen for the session;
 *   works on every host, including those that ignore `listChanged`.
 *
 * The `static` variant's `exposurePaths` is intentionally `string[]`, not
 * `EbayToolExposurePath[]`: parsing is lenient and may carry unknown tokens until
 * {@link getToolGatingConfigError} validates them. Typing it as the narrowed key
 * would advertise a guarantee the value does not yet hold.
 */
export type ToolGatingMode =
  | { kind: 'all' }
  | { kind: 'dynamic' }
  | { kind: 'static'; exposurePaths: string[] };

/** Splits the configured `EBAY_MCP_TOOLS` list into normalized non-empty paths. */
const parseExposurePaths = (exposureSetting: string): string[] =>
  exposureSetting
    .split(',')
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);

/**
 * Resolves `EBAY_MCP_TOOLS` into a {@link ToolGatingMode}.
 *
 * Parsing is lenient by design — unknown exposure paths are kept in the returned
 * `static` mode so the dedicated validator ({@link getToolGatingConfigError}) can
 * report them precisely. Callers that act on the mode should treat only
 * {@link EBAY_TOOL_EXPOSURE_PATHS} members as registerable.
 *
 * @param environmentVariables - Environment values containing optional `EBAY_MCP_TOOLS`.
 * @returns Tool gating mode parsed from the environment.
 *
 * @example
 * ```ts
 * const mode = parseToolGatingMode({ EBAY_MCP_TOOLS: 'inventory,fulfillment' });
 * ```
 */
export const parseToolGatingMode = (
  environmentVariables: NodeJS.ProcessEnv = process.env,
): ToolGatingMode => {
  const configuredExposure = environmentVariables.EBAY_MCP_TOOLS;
  if (configuredExposure === undefined) {
    return { kind: 'all' };
  }
  const exposureSetting = configuredExposure.trim();
  if (exposureSetting.length === 0) {
    return { kind: 'all' };
  }
  if (exposureSetting.toLowerCase() === 'all') {
    return { kind: 'all' };
  }
  if (exposureSetting.toLowerCase() === 'dynamic') {
    return { kind: 'dynamic' };
  }
  return { kind: 'static', exposurePaths: parseExposurePaths(exposureSetting) };
};

/**
 * Validates `EBAY_MCP_TOOLS` and returns a human-readable error string, or
 * `undefined` when the value is valid. Surfaced through
 * `validateEnvironmentConfig` so a typo fails loudly at startup (server exits)
 * rather than silently leaving the agent with fewer tools than intended.
 *
 * @param environmentVariables - Environment values containing optional `EBAY_MCP_TOOLS`.
 * @returns Human-readable validation error, or undefined when valid.
 *
 * @example
 * ```ts
 * const exposureFailure = getToolGatingConfigError({ EBAY_MCP_TOOLS: 'inventory' });
 * ```
 */
export const getToolGatingConfigError = (
  environmentVariables: NodeJS.ProcessEnv = process.env,
): string | undefined => {
  const gatingMode = parseToolGatingMode(environmentVariables);
  if (gatingMode.kind !== 'static') {
    return;
  }

  if (gatingMode.exposurePaths.length === 0) {
    return `EBAY_MCP_TOOLS is set but lists no exposure paths. Use "all", "dynamic", or a comma-separated list of: ${EBAY_TOOL_EXPOSURE_PATHS.join(', ')}.`;
  }

  const unknownPaths = gatingMode.exposurePaths.filter(
    (exposurePath) => !EXPOSURE_PATH_SET.has(exposurePath),
  );
  if (unknownPaths.length === 0) {
    return;
  }

  if (unknownPaths.length === 1) {
    return `EBAY_MCP_TOOLS contains unknown exposure path: ${unknownPaths.join(', ')}. Valid paths: ${EBAY_TOOL_EXPOSURE_PATHS.join(', ')}.`;
  }
  return `EBAY_MCP_TOOLS contains unknown exposure paths: ${unknownPaths.join(', ')}. Valid paths: ${EBAY_TOOL_EXPOSURE_PATHS.join(', ')}.`;
};
