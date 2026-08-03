import { McpServer, type RegisteredTool } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { Implementation } from '@modelcontextprotocol/sdk/types.js';
import { EbaySellerApi } from '@/api/index.js';
import { getEbayConfig, mcpConfig } from '@/config/environment.js';
import { parseToolGatingMode } from '@/config/toolExposure.js';
import {
  createEbaySellerSession,
  type EbayGetCall,
  type EbayPostCall,
  type EbaySellerSession,
} from '@/ebay/ebaySellerSession.js';
import type { EbayTool } from '@/mcp/defineTool.js';
import { ebayToolCatalogue } from '@/mcp/ebayToolCatalogue.js';
import { isReadOnlyModeEnabled, isReadOnlyTool } from '@/mcp/readOnlyFilter.js';
import {
  createToolGatingController,
  DYNAMIC_MODE_INSTRUCTIONS,
  registerMetaTools,
  toolNamesInExposurePaths,
} from '@/mcp/toolGating.js';
import { createUiBridge, type UiBridge, uiToolCompletion } from '@/mcp/uiBridge.js';
import { getToolEntries, type ToolEntry } from '@/tools/registry.js';
import { getErrorMessage } from '@/utils/errors.js';
import { serverLogger, toolLogger } from '@/utils/logger.js';
import { Effect } from 'effect';

type LegacyToolArguments = Record<string, unknown>;

type LegacyToolRegistration = {
  readonly server: McpServer;
  readonly ebaySellerApi: EbaySellerApi;
  readonly legacyTool: ToolEntry;
  readonly logToolExecution: boolean;
  readonly uiBridge: UiBridge;
};

type EbayResourceToolRegistration = {
  readonly server: McpServer;
  readonly sellerSession: EbaySellerSession;
  readonly ebayTool: EbayTool;
  readonly logToolExecution: boolean;
  readonly uiBridge: UiBridge;
};

/**
 * Optional dependencies and metadata for constructing the eBay MCP runtime.
 */
export type EbayMcpRuntimeDependencies = {
  /** Optional prebuilt API facade, mainly for tests. */
  readonly ebaySellerApi?: EbaySellerApi;
  /** Optional authenticated seller boundary for migrated resource tools. */
  readonly sellerSession?: EbaySellerSession;
  /** Optional MCP implementation metadata advertised during initialize. */
  readonly serverConfig?: Implementation;
  /** Enables debug/error logs for each tool call when true. */
  readonly logToolExecution?: boolean;
};

/**
 * Initialized MCP server runtime and eBay API facade.
 */
export type EbayMcpRuntime = {
  /** eBay API facade shared by every registered tool handler. */
  readonly ebaySellerApi: EbaySellerApi;
  /** MCP server instance with eBay tools registered. */
  readonly server: McpServer;
  /** Initializes credentials/token state before the server accepts real calls. */
  readonly initializeEbaySellerApi: () => Promise<void>;
};

function formatLegacyToolSuccess(operationDocument: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(operationDocument, null, 2),
      },
    ],
  };
}

function formatLegacyToolFailure(thrownFailure: unknown) {
  const failureMessage = getErrorMessage(thrownFailure);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ ebayFailure: failureMessage }, null, 2),
      },
    ],
    isError: true,
  };
}

function registerLegacyTool(legacyRegistration: LegacyToolRegistration): RegisteredTool {
  const { server, ebaySellerApi, legacyTool, logToolExecution, uiBridge } = legacyRegistration;
  const { definition, handler } = legacyTool;

  // Registered plainly (no UI `_meta`) so every host gets a working text tool by
  // default; the capability gate later flips `_meta.ui` on for UI-capable clients.
  const registeredTool = server.registerTool(
    definition.name,
    {
      description: definition.description,
      inputSchema: definition.inputSchema,
    },
    async (legacyArguments: LegacyToolArguments) => {
      if (logToolExecution) {
        toolLogger.debug(`Executing tool: ${definition.name}`, { legacyArguments });
      }

      return await Effect.runPromise(
        Effect.tryPromise({
          try: () => Promise.resolve(handler(ebaySellerApi, legacyArguments)),
          catch: (thrownFailure) => thrownFailure,
        }).pipe(
          Effect.map((operationDocument) => {
            if (logToolExecution) {
              toolLogger.debug(`Tool ${definition.name} completed successfully`);
            }

            if (uiBridge.shouldRender(legacyTool.ui) && legacyTool.ui !== undefined) {
              return uiToolCompletion(legacyTool.ui, operationDocument);
            }
            return formatLegacyToolSuccess(operationDocument);
          }),
          Effect.catchAll((thrownFailure) => {
            const failureMessage = getErrorMessage(thrownFailure);

            if (logToolExecution) {
              toolLogger.error(`Tool ${definition.name} failed`, { failureMessage });
            }

            return Effect.succeed(formatLegacyToolFailure(thrownFailure));
          }),
        ),
      );
    },
  );

  uiBridge.register(legacyTool.ui, registeredTool);
  return registeredTool;
}

function sellerSessionFor(
  runtimeDependencies: EbayMcpRuntimeDependencies,
  ebaySellerApi: EbaySellerApi,
): EbaySellerSession {
  if (runtimeDependencies.sellerSession !== undefined) {
    return runtimeDependencies.sellerSession;
  }
  return {
    get: <EbayDocument>(ebayGetCall: EbayGetCall) =>
      createEbaySellerSession(ebaySellerApi.getAuthClient()).get<EbayDocument>(ebayGetCall),
    post: <EbayDocument>(ebayPostCall: EbayPostCall) =>
      createEbaySellerSession(ebaySellerApi.getAuthClient()).post<EbayDocument>(ebayPostCall),
  };
}

function registerEbayResourceTool(
  resourceRegistration: EbayResourceToolRegistration,
): RegisteredTool {
  const { server, sellerSession, ebayTool, logToolExecution, uiBridge } = resourceRegistration;
  const registeredTool = server.registerTool(
    ebayTool.name,
    {
      description: ebayTool.description,
      inputSchema: ebayTool.argumentsSchema,
      annotations: ebayTool.annotations,
    },
    async (validatedArguments) => {
      if (logToolExecution) {
        toolLogger.debug(`Executing tool: ${ebayTool.name}`, { validatedArguments });
      }
      const toolCompletion = await ebayTool.completeMcpCall(
        sellerSession,
        validatedArguments,
        uiBridge.shouldRender(ebayTool.ui),
      );
      if (logToolExecution) {
        toolLogger.debug(`Tool ${ebayTool.name} completed`);
      }
      return toolCompletion;
    },
  );

  uiBridge.register(ebayTool.ui, registeredTool);
  return registeredTool;
}

function ebaySellerApiFor(runtimeDependencies: EbayMcpRuntimeDependencies): EbaySellerApi {
  if (runtimeDependencies.ebaySellerApi !== undefined) {
    return runtimeDependencies.ebaySellerApi;
  }
  return new EbaySellerApi(getEbayConfig());
}

function serverImplementationFor(runtimeDependencies: EbayMcpRuntimeDependencies): Implementation {
  if (runtimeDependencies.serverConfig !== undefined) {
    return runtimeDependencies.serverConfig;
  }
  return mcpConfig;
}

function mcpServerFor(
  serverImplementation: Implementation,
  toolGatingMode: ReturnType<typeof parseToolGatingMode>,
): McpServer {
  if (toolGatingMode.kind === 'dynamic') {
    return new McpServer(serverImplementation, { instructions: DYNAMIC_MODE_INSTRUCTIONS });
  }
  return new McpServer(serverImplementation);
}

function legacyToolsFor(
  toolGatingMode: ReturnType<typeof parseToolGatingMode>,
  readOnlyMode: boolean,
): ToolEntry[] {
  const legacyTools = getToolEntries();
  const exposedLegacyTools = (() => {
    if (toolGatingMode.kind !== 'static') {
      return legacyTools;
    }
    const exposedToolNames = toolNamesInExposurePaths(toolGatingMode.exposurePaths);
    return legacyTools.filter((legacyTool) => exposedToolNames.has(legacyTool.definition.name));
  })();

  if (!readOnlyMode) {
    return exposedLegacyTools;
  }
  return exposedLegacyTools.filter((legacyTool) => isReadOnlyTool(legacyTool.definition));
}

function ebayResourceToolsFor(
  toolGatingMode: ReturnType<typeof parseToolGatingMode>,
  readOnlyMode: boolean,
): EbayTool[] {
  return ebayToolCatalogue.filter((ebayTool) => {
    if (
      toolGatingMode.kind === 'static' &&
      !toolGatingMode.exposurePaths.includes(ebayTool.namespace)
    ) {
      return false;
    }
    if (readOnlyMode && !isReadOnlyTool(ebayTool)) {
      return false;
    }
    return true;
  });
}

/**
 * Create an MCP server runtime and register all eBay tool handlers.
 *
 * @param runtimeDependencies - Optional runtime dependencies and metadata overrides.
 * @returns Initialized runtime wrapper containing the MCP server and API facade.
 *
 * @example
 * ```ts
 * const runtime = createEbayMcpRuntime({ logToolExecution: true });
 * await runtime.initializeEbaySellerApi();
 * ```
 */
export const createEbayMcpRuntime = (
  runtimeDependencies: EbayMcpRuntimeDependencies = {},
): EbayMcpRuntime => {
  const ebaySellerApi = ebaySellerApiFor(runtimeDependencies);
  const sellerSession = sellerSessionFor(runtimeDependencies, ebaySellerApi);
  const serverImplementation = serverImplementationFor(runtimeDependencies);
  const toolGatingMode = parseToolGatingMode();

  // Instructions are set only in dynamic mode so the agent knows the catalogue is
  // hidden behind the discovery tools; default/static modes keep the handshake
  // byte-for-byte unchanged (a bare single-arg construction).
  const server = mcpServerFor(serverImplementation, toolGatingMode);

  const uiBridge = createUiBridge(server, import.meta.url);
  const readOnlyMode = isReadOnlyModeEnabled();

  // Static mode registers only the named exposure paths; all and dynamic register the
  // full catalogue (dynamic then disables it below, before the transport connects).
  const legacyTools = legacyToolsFor(toolGatingMode, readOnlyMode);
  if (readOnlyMode) {
    serverLogger.info(`EBAY_READ_ONLY: filtered to ${legacyTools.length} legacy read-only tools`);
  }

  const registeredTools = new Map<string, RegisteredTool>();
  const logToolExecution = runtimeDependencies.logToolExecution === true;
  for (const legacyTool of legacyTools) {
    registeredTools.set(
      legacyTool.definition.name,
      registerLegacyTool({
        server,
        ebaySellerApi,
        legacyTool,
        logToolExecution,
        uiBridge,
      }),
    );
  }

  const ebayResourceTools = ebayResourceToolsFor(toolGatingMode, readOnlyMode);
  for (const ebayTool of ebayResourceTools) {
    registeredTools.set(
      ebayTool.name,
      registerEbayResourceTool({
        server,
        sellerSession,
        ebayTool,
        logToolExecution,
        uiBridge,
      }),
    );
  }

  if (toolGatingMode.kind === 'dynamic') {
    // Disable before `connect`: the SDK only emits `tools/listChanged` once the
    // transport is connected, so these flips are silent. The agent re-enables the
    // tools it needs via the meta-tools, which fire `listChanged` post-connect.
    for (const registeredTool of registeredTools.values()) {
      registeredTool.disable();
    }
    registerMetaTools(server, createToolGatingController(registeredTools));
    serverLogger.info(
      `Dynamic tool mode: ${registeredTools.size} eBay tools hidden behind 3 discovery tools`,
    );
  } else if (toolGatingMode.kind === 'static') {
    serverLogger.info(
      `Static tool mode: registered ${registeredTools.size} tools from exposure paths: ${toolGatingMode.exposurePaths.join(', ')}`,
    );
  } else {
    serverLogger.info(`Registering ${registeredTools.size} tools`);
  }

  // Install after registration so every UI-eligible tool is captured before the
  // gate can flip their metadata on a UI-capable client's `initialize`.
  uiBridge.installCapabilityGate();

  return {
    ebaySellerApi,
    server,
    initializeEbaySellerApi: async () => Effect.runPromise(ebaySellerApi.initialize()),
  };
};
