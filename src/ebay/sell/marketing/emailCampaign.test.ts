import { describe, expect, it } from 'vitest';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { ebayFailures, sellerSessionReturning } from '@tests/fixtures/ebaySellerSession.js';

import {
  createEmailCampaign,
  createEmailCampaignArgumentsSchema,
  type CreatedEmailCampaign,
  deleteEmailCampaign,
  type DeletedEmailCampaign,
  type EmailCampaign,
  type EmailCampaignAudiences,
  type EmailCampaignsPage,
  type EmailPreview,
  type EmailReport,
  emailCampaignIdArgumentsSchema,
  getAudiences,
  getAudiencesArgumentsSchema,
  getEmailCampaign,
  getEmailCampaigns,
  getEmailCampaignsArgumentsSchema,
  getEmailPreview,
  getEmailReport,
  getEmailReportArgumentsSchema,
  updateEmailCampaign,
  updateEmailCampaignArgumentsSchema,
  type UpdatedEmailCampaign,
} from './emailCampaign.js';

const emailCampaignCreation = {
  'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
  audienceCodes: ['ALL_SUBSCRIBERS'],
  emailCampaignType: 'WELCOME',
  itemSelectMode: 'AUTO',
  personalizedMessage: 'Thanks for joining our store.',
  sort: 'NEWLY_LISTED',
  subject: 'Welcome to our store',
};

const emailCampaignUpdate = {
  email_campaign_id: 'CAMPAIGN-1',
  personalizedMessage: 'Updated welcome message',
  subject: 'Updated subject',
};

describe('Sell Marketing email-campaign schemas', () => {
  it('accepts exact query, header, path, and direct document fields', () => {
    expect(
      getEmailCampaignsArgumentsSchema.parse({
        limit: '25',
        offset: '0',
        q: 'welcome',
        sort: 'CREATION_DATE',
      }),
    ).toEqual({
      limit: '25',
      offset: '0',
      q: 'welcome',
      sort: 'CREATION_DATE',
    });
    expect(createEmailCampaignArgumentsSchema.parse(emailCampaignCreation)).toEqual(
      emailCampaignCreation,
    );
    expect(emailCampaignIdArgumentsSchema.parse({ email_campaign_id: 'CAMPAIGN-1' })).toEqual({
      email_campaign_id: 'CAMPAIGN-1',
    });
    expect(updateEmailCampaignArgumentsSchema.parse(emailCampaignUpdate)).toEqual(
      emailCampaignUpdate,
    );
    expect(
      getAudiencesArgumentsSchema.parse({
        emailCampaignType: 'WELCOME',
        limit: '10',
        offset: '0',
      }),
    ).toEqual({
      emailCampaignType: 'WELCOME',
      limit: '10',
      offset: '0',
    });
    expect(
      getEmailReportArgumentsSchema.parse({
        endDate: '2022-12-28T19:09:02.768Z',
        startDate: '2022-11-01T19:09:02.768Z',
      }),
    ).toEqual({
      endDate: '2022-12-28T19:09:02.768Z',
      startDate: '2022-11-01T19:09:02.768Z',
    });
  });

  it.each([
    { marketplaceId: 'EBAY_US', emailCampaignType: 'WELCOME' },
    {
      body: {
        emailCampaignType: 'WELCOME',
      },
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
    },
    {
      emailCampaignType: 'WELCOME',
    },
    {
      'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
      emailCampaignType: 'WELCOME',
      'Content-Type': 'application/json',
    },
  ])('rejects create aliases, wrappers, and transport headers', (invalidArguments) => {
    expect(createEmailCampaignArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
  });

  it.each([{ emailCampaignId: 'CAMPAIGN-1' }, { email_campaign_id: '' }, { limit: 25 }])(
    'rejects path aliases and incomplete email_campaign_id selectors',
    (invalidArguments) => {
      expect(emailCampaignIdArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
    },
  );

  it.each([
    { emailCampaignId: 'CAMPAIGN-1', subject: 'Updated' },
    { email_campaign_id: 'CAMPAIGN-1', request: { subject: 'Updated' } },
  ])('rejects update wrappers and renamed path fields', (invalidArguments) => {
    expect(updateEmailCampaignArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
  });

  it.each([{ email_campaign_type: 'WELCOME' }, { limit: 10 }, { emailCampaignType: '' }])(
    'rejects incomplete or renamed audience query fields',
    (invalidArguments) => {
      expect(getAudiencesArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
    },
  );

  it.each([
    { end_date: '2022-12-28T19:09:02.768Z', start_date: '2022-11-01T19:09:02.768Z' },
    { endDate: '2022-12-28T19:09:02.768Z' },
    { startDate: '2022-11-01T19:09:02.768Z' },
  ])('rejects incomplete or renamed email-report query fields', (invalidArguments) => {
    expect(getEmailReportArgumentsSchema.safeParse(invalidArguments).success).toBe(false);
  });
});

describe('Sell Marketing email-campaign operations', () => {
  it('lists email campaigns with exact string query fields', async () => {
    const successfulLookup: EbayRequestCompletion<EmailCampaignsPage> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: { campaigns: [], total: 0 },
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    const campaignsCompletion = await getEmailCampaigns(sellerSession, {
      limit: '25',
      offset: '0',
      q: 'welcome',
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/email_campaign',
        searchParameters: { limit: '25', offset: '0', q: 'welcome' },
      },
    ]);
    expect(campaignsCompletion).toBe(successfulLookup);
  });

  it('creates an email campaign with the marketplace header stripped from the document', async () => {
    const successfulCreate: EbayRequestCompletion<CreatedEmailCampaign> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: { emailCampaignId: 'CAMPAIGN-1', emailCampaignStatus: 'SCHEDULED' },
    };
    const { sellerSession, postCalls } = sellerSessionReturning(successfulCreate);

    const createCompletion = await createEmailCampaign(sellerSession, emailCampaignCreation);

    expect(postCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/email_campaign',
        requestDocument: {
          audienceCodes: ['ALL_SUBSCRIBERS'],
          emailCampaignType: 'WELCOME',
          itemSelectMode: 'AUTO',
          personalizedMessage: 'Thanks for joining our store.',
          sort: 'NEWLY_LISTED',
          subject: 'Welcome to our store',
        },
        requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US' },
      },
    ]);
    expect(createCompletion).toBe(successfulCreate);
  });

  it('encodes the email_campaign_id path for get, update, delete, and preview', async () => {
    const successfulLookup: EbayRequestCompletion<EmailCampaign> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: { emailCampaignId: 'CAMPAIGN/1', subject: 'Welcome' },
    };
    const { sellerSession, getCalls, putCalls, deleteCalls } =
      sellerSessionReturning(successfulLookup);

    await getEmailCampaign(sellerSession, { email_campaign_id: 'CAMPAIGN/1' });
    await updateEmailCampaign(sellerSession, {
      email_campaign_id: 'CAMPAIGN/1',
      subject: 'Updated subject',
    });
    await deleteEmailCampaign(sellerSession, { email_campaign_id: 'CAMPAIGN/1' });
    await getEmailPreview(sellerSession, { email_campaign_id: 'CAMPAIGN/1' });

    expect(getCalls).toEqual([
      { endpoint: '/sell/marketing/v1/email_campaign/CAMPAIGN%2F1' },
      { endpoint: '/sell/marketing/v1/email_campaign/CAMPAIGN%2F1/email_preview' },
    ]);
    expect(putCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/email_campaign/CAMPAIGN%2F1',
        requestDocument: { subject: 'Updated subject' },
      },
    ]);
    expect(deleteCalls).toEqual([{ endpoint: '/sell/marketing/v1/email_campaign/CAMPAIGN%2F1' }]);
  });

  it('gets audiences and the email report with exact OpenAPI query names', async () => {
    const successfulLookup: EbayRequestCompletion<EmailCampaignAudiences | EmailReport> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: { audiences: [], total: 0 },
    };
    const { sellerSession, getCalls } = sellerSessionReturning(successfulLookup);

    await getAudiences(sellerSession, {
      emailCampaignType: 'WELCOME',
      limit: '10',
      offset: '0',
    });
    await getEmailReport(sellerSession, {
      endDate: '2022-12-28T19:09:02.768Z',
      startDate: '2022-11-01T19:09:02.768Z',
    });

    expect(getCalls).toEqual([
      {
        endpoint: '/sell/marketing/v1/email_campaign/audience',
        searchParameters: {
          emailCampaignType: 'WELCOME',
          limit: '10',
          offset: '0',
        },
      },
      {
        endpoint: '/sell/marketing/v1/email_campaign/report',
        searchParameters: {
          endDate: '2022-12-28T19:09:02.768Z',
          startDate: '2022-11-01T19:09:02.768Z',
        },
      },
    ]);
  });

  it.each(ebayFailures)('passes a $kind failure through unchanged', async (ebayFailure) => {
    const failedLookup: EbayRequestCompletion<EmailCampaignsPage> = {
      kind: 'ebayRequestFailed',
      ebayFailure,
    };
    const { sellerSession } = sellerSessionReturning(failedLookup);

    await expect(getEmailCampaigns(sellerSession, {})).resolves.toBe(failedLookup);
  });

  it('returns the generated delete document unchanged', async () => {
    const successfulDelete: EbayRequestCompletion<DeletedEmailCampaign> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: { emailCampaignId: 'CAMPAIGN-1' },
    };
    const { sellerSession } = sellerSessionReturning(successfulDelete);

    await expect(
      deleteEmailCampaign(sellerSession, { email_campaign_id: 'CAMPAIGN-1' }),
    ).resolves.toBe(successfulDelete);
  });

  it('returns the generated update and preview documents unchanged', async () => {
    const successfulUpdate: EbayRequestCompletion<UpdatedEmailCampaign> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: { emailCampaignId: 'CAMPAIGN-1', emailCampaignStatus: 'SCHEDULED' },
    };
    const { sellerSession: updateSession } = sellerSessionReturning(successfulUpdate);
    await expect(updateEmailCampaign(updateSession, emailCampaignUpdate)).resolves.toBe(
      successfulUpdate,
    );

    const successfulPreview: EbayRequestCompletion<EmailPreview> = {
      kind: 'ebayRequestSucceeded',
      ebayDocument: {
        content: '<html><body>Welcome</body></html>',
        renderDate: '2026-08-04T00:00:00Z',
      },
    };
    const { sellerSession: previewSession } = sellerSessionReturning(successfulPreview);
    await expect(
      getEmailPreview(previewSession, { email_campaign_id: 'CAMPAIGN-1' }),
    ).resolves.toBe(successfulPreview);
  });
});
