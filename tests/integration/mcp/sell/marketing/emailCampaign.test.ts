import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  CreatedEmailCampaign,
  DeletedEmailCampaign,
  EmailCampaign,
  EmailCampaignAudiences,
  EmailCampaignsPage,
  EmailPreview,
  EmailReport,
  UpdatedEmailCampaign,
} from '@/ebay/sell/marketing/emailCampaign.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';
import { callEbayTool, listEbayTools } from '@tests/fixtures/mcp.js';

const emailCampaignToolNames = [
  'ebay_sell_marketing_get_email_campaigns',
  'ebay_sell_marketing_create_email_campaign',
  'ebay_sell_marketing_get_email_campaign',
  'ebay_sell_marketing_update_email_campaign',
  'ebay_sell_marketing_delete_email_campaign',
  'ebay_sell_marketing_get_audiences',
  'ebay_sell_marketing_get_email_preview',
  'ebay_sell_marketing_get_email_report',
] as const;

const emailCampaignCreation = {
  'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
  audienceCodes: ['ALL_SUBSCRIBERS'],
  emailCampaignType: 'WELCOME',
  itemSelectMode: 'AUTO',
  subject: 'Welcome to our store',
};

const emailCampaignDocument: EmailCampaign = {
  emailCampaignId: 'CAMPAIGN-1',
  emailCampaignStatus: 'SCHEDULED',
  emailCampaignType: 'WELCOME',
  subject: 'Welcome to our store',
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('Sell Marketing email-campaign MCP exposure', () => {
  it('exposes eight official operations once without compatibility names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<EmailCampaignsPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { campaigns: [], total: 0 },
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    for (const toolName of emailCampaignToolNames) {
      expect(listedToolNames.filter((listedToolName) => listedToolName === toolName)).toEqual([
        toolName,
      ]);
    }
    expect(listedToolNames).not.toContain('ebay_get_email_campaigns');
    await mcpClient.close();
  });

  it('keeps only the five reads in read-only mode', async () => {
    vi.stubEnv('EBAY_MCP_TOOLS', 'sell.marketing');
    vi.stubEnv('EBAY_MCP_UI', 'off');
    vi.stubEnv('EBAY_READ_ONLY', 'true');
    const { sellerSession } = sellerSessionReturning<EmailCampaignsPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: { campaigns: [], total: 0 },
    });
    const { mcpClient, listedTools } = await listEbayTools(sellerSession);
    const listedToolNames = listedTools.tools.map((ebayTool) => ebayTool.name);

    expect(listedToolNames).toContain('ebay_sell_marketing_get_email_campaigns');
    expect(listedToolNames).toContain('ebay_sell_marketing_get_email_campaign');
    expect(listedToolNames).toContain('ebay_sell_marketing_get_audiences');
    expect(listedToolNames).toContain('ebay_sell_marketing_get_email_preview');
    expect(listedToolNames).toContain('ebay_sell_marketing_get_email_report');
    expect(listedToolNames).not.toContain('ebay_sell_marketing_create_email_campaign');
    expect(listedToolNames).not.toContain('ebay_sell_marketing_update_email_campaign');
    expect(listedToolNames).not.toContain('ebay_sell_marketing_delete_email_campaign');
    await mcpClient.close();
  });
});

describe('Sell Marketing email-campaign MCP calls', () => {
  it('lists email campaigns with exact string query fields', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const campaignsPage: EmailCampaignsPage = {
      campaigns: [{ emailCampaignId: 'CAMPAIGN-1', subject: 'Welcome' }],
      total: 1,
    };
    const { sellerSession, getCalls } = sellerSessionReturning<EmailCampaignsPage>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: campaignsPage,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_email_campaigns',
      { limit: '25', offset: '0', q: 'welcome' },
    );

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/email_campaign',
        searchParameters: { limit: '25', offset: '0', q: 'welcome' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(campaignsPage, null, 2) }],
    });
    await mcpClient.close();
  });

  it('creates an email campaign with the marketplace header and direct document', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const createdCampaign: CreatedEmailCampaign = {
      emailCampaignId: 'CAMPAIGN-1',
      emailCampaignStatus: 'SCHEDULED',
    };
    const { sellerSession, postCalls } = sellerSessionReturning<CreatedEmailCampaign>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: createdCampaign,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_create_email_campaign',
      emailCampaignCreation,
    );

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/email_campaign',
        requestDocument: {
          audienceCodes: ['ALL_SUBSCRIBERS'],
          emailCampaignType: 'WELCOME',
          itemSelectMode: 'AUTO',
          subject: 'Welcome to our store',
        },
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
      },
    ]);
    expect(toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(createdCampaign, null, 2) }],
    });
    await mcpClient.close();
  });

  it('gets, updates, deletes, and previews with the exact email_campaign_id path', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const updatedCampaign: UpdatedEmailCampaign = {
      emailCampaignId: 'CAMPAIGN-1',
      emailCampaignStatus: 'SCHEDULED',
    };
    const deletedCampaign: DeletedEmailCampaign = { emailCampaignId: 'CAMPAIGN-1' };
    const emailPreview: EmailPreview = {
      content: '<html><body>Welcome</body></html>',
      renderDate: '2026-08-04T00:00:00Z',
    };

    const getSession = sellerSessionReturning<EmailCampaign>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: emailCampaignDocument,
    });
    const updateSession = sellerSessionReturning<UpdatedEmailCampaign>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: updatedCampaign,
    });
    const deleteSession = sellerSessionReturning<DeletedEmailCampaign>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: deletedCampaign,
    });
    const previewSession = sellerSessionReturning<EmailPreview>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: emailPreview,
    });

    const getCall = await callEbayTool(
      getSession.sellerSession,
      'ebay_sell_marketing_get_email_campaign',
      { email_campaign_id: 'CAMPAIGN-1' },
    );
    const updateCall = await callEbayTool(
      updateSession.sellerSession,
      'ebay_sell_marketing_update_email_campaign',
      { email_campaign_id: 'CAMPAIGN-1', subject: 'Updated subject' },
    );
    const deleteCall = await callEbayTool(
      deleteSession.sellerSession,
      'ebay_sell_marketing_delete_email_campaign',
      { email_campaign_id: 'CAMPAIGN-1' },
    );
    const previewCall = await callEbayTool(
      previewSession.sellerSession,
      'ebay_sell_marketing_get_email_preview',
      { email_campaign_id: 'CAMPAIGN-1' },
    );

    expect(getSession.getCalls).toEqual([
      { endpoint: '/sell/marketing/v1/email_campaign/CAMPAIGN-1' },
    ]);
    expect(updateSession.putCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/email_campaign/CAMPAIGN-1',
        requestDocument: { subject: 'Updated subject' },
      },
    ]);
    expect(deleteSession.deleteCalls).toEqual([
      { endpoint: '/sell/marketing/v1/email_campaign/CAMPAIGN-1' },
    ]);
    expect(previewSession.getCalls).toEqual([
      { endpoint: '/sell/marketing/v1/email_campaign/CAMPAIGN-1/email_preview' },
    ]);
    expect(getCall.toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(emailCampaignDocument, null, 2) }],
    });
    expect(updateCall.toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(updatedCampaign, null, 2) }],
    });
    expect(deleteCall.toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(deletedCampaign, null, 2) }],
    });
    expect(previewCall.toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(emailPreview, null, 2) }],
    });
    await getCall.mcpClient.close();
    await updateCall.mcpClient.close();
    await deleteCall.mcpClient.close();
    await previewCall.mcpClient.close();
  });

  it('gets audiences and the email report with exact OpenAPI query names', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const audiences: EmailCampaignAudiences = {
      audiences: [{ audienceType: 'ALL_SUBSCRIBERS', code: 'ALL_SUBSCRIBERS', name: 'All' }],
      total: 1,
    };
    const emailReport: EmailReport = {
      clickCount: 10,
      openCount: 40,
      totalSales: { currency: 'USD', value: '250.00' },
    };

    const audienceSession = sellerSessionReturning<EmailCampaignAudiences>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: audiences,
    });
    const reportSession = sellerSessionReturning<EmailReport>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: emailReport,
    });

    const audienceCall = await callEbayTool(
      audienceSession.sellerSession,
      'ebay_sell_marketing_get_audiences',
      { emailCampaignType: 'WELCOME', limit: '10', offset: '0' },
    );
    const reportCall = await callEbayTool(
      reportSession.sellerSession,
      'ebay_sell_marketing_get_email_report',
      {
        endDate: '2022-12-28T19:09:02.768Z',
        startDate: '2022-11-01T19:09:02.768Z',
      },
    );

    expect(audienceSession.getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/email_campaign/audience',
        searchParameters: {
          emailCampaignType: 'WELCOME',
          limit: '10',
          offset: '0',
        },
      },
    ]);
    expect(reportSession.getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/email_campaign/report',
        searchParameters: {
          endDate: '2022-12-28T19:09:02.768Z',
          startDate: '2022-11-01T19:09:02.768Z',
        },
      },
    ]);
    expect(audienceCall.toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(audiences, null, 2) }],
    });
    expect(reportCall.toolCompletion).toMatchObject({
      content: [{ type: 'text', text: JSON.stringify(emailReport, null, 2) }],
    });
    await audienceCall.mcpClient.close();
    await reportCall.mcpClient.close();
  });
});

describe('Sell Marketing email-campaign MCP validation and failures', () => {
  it('rejects renamed path and header fields before the seller session', async () => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession, getCalls, postCalls } = sellerSessionReturning<EmailCampaign>({
      kind: 'ebayRequestSucceeded',
      ebayDocument: emailCampaignDocument,
    });

    const getCall = await callEbayTool(sellerSession, 'ebay_sell_marketing_get_email_campaign', {
      emailCampaignId: 'CAMPAIGN-1',
    });
    const createCall = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_create_email_campaign',
      { marketplaceId: 'EBAY_US', emailCampaignType: 'WELCOME' },
    );

    expect(getCall.toolCompletion).toMatchObject({ isError: true });
    expect(createCall.toolCompletion).toMatchObject({ isError: true });
    expect(getCalls).toEqual([]);
    expect(postCalls).toEqual([]);
    await getCall.mcpClient.close();
    await createCall.mcpClient.close();
  });

  it.each(ebayFailures)('translates a $kind lookup failure once', async (ebayFailure) => {
    vi.stubEnv('EBAY_MCP_UI', 'off');
    const { sellerSession } = sellerSessionReturning<EmailCampaignsPage>({
      kind: 'ebayRequestFailed',
      ebayFailure,
    });

    const { mcpClient, toolCompletion } = await callEbayTool(
      sellerSession,
      'ebay_sell_marketing_get_email_campaigns',
      {},
    );

    expect(toolCompletion).toMatchObject({ isError: true });
    await mcpClient.close();
  });
});
