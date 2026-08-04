import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getToolDefinitions } from '@/tools/index.js';
import { ebayToolCatalogue } from '@/mcp/ebayToolCatalogue.js';
import { sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

/**
 * Exercises the EBAY_MCP_TOOLS gating in createEbayMcpRuntime by mocking McpServer
 * and capturing every registered tool handle, so we can assert which tools are
 * registered and whether dynamic mode disables them at boot.
 */
const mcpMock = vi.hoisted(() => {
  interface Handle {
    name: string;
    enabled: boolean;
    enable(): void;
    disable(): void;
    update: ReturnType<typeof vi.fn>;
  }
  const state: { handles: Handle[]; constructorArgs: unknown[][] } = {
    handles: [],
    constructorArgs: [],
  };
  return {
    state,
    registerTool: vi.fn((name: string) => {
      const handle: Handle = {
        name,
        enabled: true,
        enable() {
          handle.enabled = true;
        },
        disable() {
          handle.enabled = false;
        },
        update: vi.fn(),
      };
      state.handles.push(handle);
      return handle;
    }),
    registerResource: vi.fn(),
    connect: vi.fn(),
    close: vi.fn(),
    getClientCapabilities: vi.fn(() => ({})),
  };
});

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: vi.fn(function (this: unknown, serverInfo: unknown, options: unknown) {
    mcpMock.state.constructorArgs.push([serverInfo, options]);
    return {
      registerTool: mcpMock.registerTool,
      registerResource: mcpMock.registerResource,
      connect: mcpMock.connect,
      close: mcpMock.close,
      server: {
        oninitialized: undefined,
        getClientCapabilities: mcpMock.getClientCapabilities,
      },
    };
  }),
}));

const fakeEbaySellerApi = { initialize: vi.fn() } as never;
const { sellerSession: fakeSellerSession } = sellerSessionReturning<unknown>({
  kind: 'ebayRequestSucceeded',
  ebayDocument: {},
});
const serverConfig = { name: 'test-mcp', version: '0.0.0' };
const sellInventoryCount = ebayToolCatalogue.filter(
  (ebayTool) => ebayTool.namespace === 'sell.inventory',
).length;
const META_TOOL_NAMES = ['list_ebay_tools', 'enable_ebay_tools', 'disable_ebay_tools'];

describe('createEbayMcpRuntime — tool gating', () => {
  beforeEach(() => {
    // Stub only the gating key (not the whole process.env object) so dotenv-injected
    // config from other modules survives across tests in the same worker.
    vi.stubEnv('EBAY_MCP_TOOLS', undefined);
    vi.clearAllMocks();
    mcpMock.state.handles = [];
    mcpMock.state.constructorArgs = [];
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('registers the full catalogue and no meta-tools by default', async () => {
    const { createEbayMcpRuntime } = await import('@/mcp/runtime.js');
    createEbayMcpRuntime({
      ebaySellerApi: fakeEbaySellerApi,
      sellerSession: fakeSellerSession,
      serverConfig,
    });

    expect(mcpMock.registerTool).toHaveBeenCalledTimes(
      getToolDefinitions().length + ebayToolCatalogue.length,
    );
    expect(mcpMock.state.handles.every((handle) => handle.enabled)).toBe(true);
    expect(mcpMock.state.constructorArgs[0]).toEqual([serverConfig, undefined]);
  });

  it('dynamic mode advertises only the 3 discovery tools and disables the rest', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'dynamic');
    const { createEbayMcpRuntime } = await import('@/mcp/runtime.js');
    createEbayMcpRuntime({
      ebaySellerApi: fakeEbaySellerApi,
      sellerSession: fakeSellerSession,
      serverConfig,
    });

    const total = getToolDefinitions().length + ebayToolCatalogue.length;
    expect(mcpMock.registerTool).toHaveBeenCalledTimes(total + META_TOOL_NAMES.length);

    // Classify by name, not registration order, so a registration-order refactor
    // that preserves behavior does not break this test.
    const metaNames = new Set(META_TOOL_NAMES);
    const ebayHandles = mcpMock.state.handles.filter((handle) => !metaNames.has(handle.name));
    const metaHandles = mcpMock.state.handles.filter((handle) => metaNames.has(handle.name));
    expect(ebayHandles).toHaveLength(total);
    expect(ebayHandles.every((handle) => !handle.enabled)).toBe(true);
    expect(metaHandles.map((handle) => handle.name).sort()).toEqual([...META_TOOL_NAMES].sort());
    expect(metaHandles.every((handle) => handle.enabled)).toBe(true);

    const [, serverConstruction] = mcpMock.state.constructorArgs[0] as [
      unknown,
      { instructions?: string },
    ];
    expect(serverConstruction.instructions).toContain('list_ebay_tools');
  });

  it('static mode registers only the named families, frozen', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.inventory');
    const { createEbayMcpRuntime } = await import('@/mcp/runtime.js');
    createEbayMcpRuntime({
      ebaySellerApi: fakeEbaySellerApi,
      sellerSession: fakeSellerSession,
      serverConfig,
    });

    expect(mcpMock.registerTool).toHaveBeenCalledTimes(sellInventoryCount);
    expect(mcpMock.state.handles.every((handle) => handle.enabled)).toBe(true);
    expect(mcpMock.state.constructorArgs[0]).toEqual([serverConfig, undefined]);
  });

  it('EBAY_READ_ONLY filters the catalogue to read-only tools only', async () => {
    const { isReadOnlyTool } = await import('@/mcp/readOnlyFilter.js');
    const expected = [
      ...getToolDefinitions().filter((definition) => isReadOnlyTool(definition)),
      ...ebayToolCatalogue.filter((ebayTool) => isReadOnlyTool(ebayTool)),
    ];
    expect(expected.length).toBeGreaterThan(0);
    expect(expected.length).toBeLessThan(getToolDefinitions().length + ebayToolCatalogue.length);

    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { createEbayMcpRuntime } = await import('@/mcp/runtime.js');
    createEbayMcpRuntime({
      ebaySellerApi: fakeEbaySellerApi,
      sellerSession: fakeSellerSession,
      serverConfig,
    });

    expect(mcpMock.registerTool).toHaveBeenCalledTimes(expected.length);
    const registeredNames = mcpMock.state.handles.map((handle) => handle.name).sort();
    expect(registeredNames).toEqual(expected.map((definition) => definition.name).sort());
    // No write-shaped tools should slip through
    expect(registeredNames.some((name) => name.includes('_create_'))).toBe(false);
    expect(registeredNames.some((name) => name.includes('_delete_'))).toBe(false);
  });

  it('EBAY_READ_ONLY composes with static family gating', async () => {
    const { isReadOnlyTool } = await import('@/mcp/readOnlyFilter.js');
    const sellInventoryTools = ebayToolCatalogue.filter(
      (ebayTool) => ebayTool.namespace === 'sell.inventory',
    );
    const expected = sellInventoryTools.filter((ebayTool) => isReadOnlyTool(ebayTool));

    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.inventory');
    vi.stubEnv('EBAY_READ_ONLY', 'yes');
    const { createEbayMcpRuntime } = await import('@/mcp/runtime.js');
    createEbayMcpRuntime({
      ebaySellerApi: fakeEbaySellerApi,
      sellerSession: fakeSellerSession,
      serverConfig,
    });

    expect(mcpMock.registerTool).toHaveBeenCalledTimes(expected.length);
    expect(expected.length).toBeLessThan(sellInventoryCount);
  });
});
