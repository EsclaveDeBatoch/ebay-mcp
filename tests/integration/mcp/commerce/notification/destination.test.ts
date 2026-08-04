import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  DestinationCreationConfirmation,
  DestinationPage,
  NotificationDestination,
  NotificationDestinationSubmission,
  NotificationDestinationUpdate,
} from '@/ebay/commerce/notification/destination.js';
import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';
import {
  destinationDocument,
  destinationPageDocument,
} from '@tests/fixtures/notificationDestination.js';

const getDestinationsToolName = 'ebay_commerce_notification_get_destinations';
const createDestinationToolName = 'ebay_commerce_notification_create_destination';
const getDestinationToolName = 'ebay_commerce_notification_get_destination';
const updateDestinationToolName = 'ebay_commerce_notification_update_destination';
const deleteDestinationToolName = 'ebay_commerce_notification_delete_destination';
const destinationSearch = { continuation_token: 'next-destination-page', limit: '20' };
const destinationLookup = { destination_id: 'destination-123' };
const destinationSubmission: NotificationDestinationSubmission = {
  deliveryConfig: {
    endpoint: 'https://notifications.example.com/ebay',
    verificationToken: 'notification_token_1234567890abcdef',
  },
  name: 'Order events',
  status: 'ENABLED',
};
const destinationUpdate: NotificationDestinationUpdate = {
  destination_id: 'destination-123',
  ...destinationSubmission,
  status: 'DISABLED',
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Commerce Notification destination MCP exposure', () => {
  it('exposes five official names once without flat compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<DestinationPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: destinationPageDocument,
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);
    const destinationToolNames = [
      getDestinationsToolName,
      createDestinationToolName,
      getDestinationToolName,
      updateDestinationToolName,
      deleteDestinationToolName,
    ];

    for (const destinationToolName of destinationToolNames) {
      expect(
        listedToolNames.filter((listedToolName) => listedToolName === destinationToolName),
      ).toEqual([destinationToolName]);
    }
    expect(listedToolNames).not.toContain('ebay_get_notification_destinations');
    expect(listedToolNames).not.toContain('ebay_create_notification_destination');
    expect(listedToolNames).not.toContain('ebay_get_notification_destination');
    expect(listedToolNames).not.toContain('ebay_update_notification_destination');
    expect(listedToolNames).not.toContain('ebay_delete_notification_destination');
    await mcpClient.close();
  });
});

describe('Commerce Notification destination MCP calls', () => {
  it('returns the generated destination page unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<DestinationPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: destinationPageDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getDestinationsToolName,
      destinationSearch,
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/destination',
        searchParameters: destinationSearch,
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(destinationPageDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('returns one generated destination unchanged', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<NotificationDestination>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: destinationDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getDestinationToolName,
      destinationLookup,
    );

    expect(getCalls).toEqual([
      { endpoint: '/commerce/notification/v1/destination/destination-123' },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(destinationDocument, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('submits the exact create document', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<DestinationCreationConfirmation>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      createDestinationToolName,
      destinationSubmission,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/destination',
        requestDocument: destinationSubmission,
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({}, null, 2) }],
    });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('keeps the path ID out of the update document', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, putCalls } = sellerSessionReturning<void>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      updateDestinationToolName,
      destinationUpdate,
    );

    expect(putCalls).toEqual([
      {
        endpoint: '/commerce/notification/v1/destination/destination-123',
        requestDocument: {
          deliveryConfig: destinationSubmission.deliveryConfig,
          name: destinationSubmission.name,
          status: 'DISABLED',
        },
      },
    ]);
    expect(toolCompletion).toMatchObject({ content: [] });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });

  it('deletes the exact destination path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, deleteCalls } = sellerSessionReturning<void>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: undefined,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      deleteDestinationToolName,
      destinationLookup,
    );

    expect(deleteCalls).toEqual([
      { endpoint: '/commerce/notification/v1/destination/destination-123' },
    ]);
    expect(toolCompletion).toMatchObject({ content: [] });
    expect(toolCompletion.isError).not.toBe(true);
    await mcpClient.close();
  });
});

describe('Commerce Notification destination MCP validation', () => {
  it('rejects unsafe destination writes before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, postCalls } = sellerSessionReturning<DestinationCreationConfirmation>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: {},
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      createDestinationToolName,
      {
        ...destinationSubmission,
        deliveryConfig: {
          ...destinationSubmission.deliveryConfig,
          endpoint: 'https://localhost/ebay',
        },
      },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(postCalls).toEqual([]);
    await mcpClient.close();
  });

  it('rejects renamed lookup fields before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls } = sellerSessionReturning<NotificationDestination>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: destinationDocument,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getDestinationToolName,
      { destinationId: 'destination-123' },
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    await mcpClient.close();
  });
});

describe('Commerce Notification destination MCP failures', () => {
  it.each(ebayFailures)('translates a $kind list failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<DestinationPage>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });
    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getDestinationsToolName,
      destinationSearch,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });

  it.each(ebayFailures)('translates a $kind lookup failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<NotificationDestination>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });
    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      getDestinationToolName,
      destinationLookup,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });

  it.each(ebayFailures)('translates a $kind create failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<DestinationCreationConfirmation>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });
    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      createDestinationToolName,
      destinationSubmission,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });

  it.each(ebayFailures)('translates a $kind update failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<void>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });
    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      updateDestinationToolName,
      destinationUpdate,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });

  it.each(ebayFailures)('translates a $kind delete failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<void>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });
    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      deleteDestinationToolName,
      destinationLookup,
    );

    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify({ ebayFailure }, null, 2) }],
      isError: true,
    });
    await mcpClient.close();
  });
});
