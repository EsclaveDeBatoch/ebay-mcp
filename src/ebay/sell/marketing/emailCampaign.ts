import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type { components } from '@/generated/ebay/sell-apps/marketing-and-promotions/sellMarketingV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const emailCampaignIdSchema = z.string().min(1);
const pageSizeSchema = z.string().regex(/^[1-9]\d*$/, 'limit must be a positive integer string');
const pageOffsetSchema = z
  .string()
  .regex(/^(?:0|[1-9]\d*)$/, 'offset must be a non-negative integer string');

const priceRangeSchema = z
  .object({
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/, 'currency must be an uppercase ISO 4217 code')
      .optional(),
    gte: z.number().optional(),
    lte: z.number().optional(),
  })
  .strict();

const createEmailCampaignDocumentSchema = z
  .object({
    audienceCodes: z.array(z.string().min(1)).min(1).optional(),
    categoryId: z.string().min(1).optional(),
    categoryType: z.string().min(1).optional(),
    emailCampaignType: z.string().min(1),
    itemIds: z.array(z.string().min(1)).min(1).optional(),
    itemSelectMode: z.string().min(1).optional(),
    personalizedMessage: z.string().min(1).max(1000).optional(),
    priceRange: priceRangeSchema.optional(),
    promotionId: z.string().min(1).optional(),
    promotionSelectModeEnum: z.string().min(1).optional(),
    scheduleDate: z.string().min(1).optional(),
    sort: z.string().min(1).optional(),
    subject: z.string().min(1).max(70).optional(),
  })
  .strict();

const updateEmailCampaignDocumentSchema = z
  .object({
    audienceCodes: z.array(z.string().min(1)).min(1).optional(),
    categoryId: z.string().min(1).optional(),
    categoryType: z.string().min(1).optional(),
    itemIds: z.array(z.string().min(1)).min(1).optional(),
    itemSelectMode: z.string().min(1).optional(),
    personalizedMessage: z.string().min(1).max(1000).optional(),
    priceRange: priceRangeSchema.optional(),
    promotionId: z.string().min(1).optional(),
    promotionSelectModeEnum: z.string().min(1).optional(),
    scheduleDate: z.string().min(1).optional(),
    sort: z.string().min(1).optional(),
    subject: z.string().min(1).max(70).optional(),
  })
  .strict();

/** Exact eBay query fields accepted by getEmailCampaigns. */
export const getEmailCampaignsArgumentsSchema = z
  .object({
    limit: pageSizeSchema.optional(),
    offset: pageOffsetSchema.optional(),
    q: z.string().min(1).optional(),
    sort: z.string().min(1).optional(),
  })
  .strict();

/** Exact eBay marketplace header and direct CreateEmailCampaignRequest fields. */
export const createEmailCampaignArgumentsSchema = createEmailCampaignDocumentSchema
  .extend({
    'X-EBAY-C-MARKETPLACE-ID': z.string().min(1),
  })
  .strict();

/** Exact eBay path accepted by getEmailCampaign, deleteEmailCampaign, and getEmailPreview. */
export const emailCampaignIdArgumentsSchema = z
  .object({
    email_campaign_id: emailCampaignIdSchema,
  })
  .strict();

/** Exact eBay path and direct UpdateCampaignRequest fields for updateEmailCampaign. */
export const updateEmailCampaignArgumentsSchema = updateEmailCampaignDocumentSchema
  .extend({
    email_campaign_id: emailCampaignIdSchema,
  })
  .strict();

/** Exact eBay query fields accepted by getAudiences. */
export const getAudiencesArgumentsSchema = z
  .object({
    emailCampaignType: z.string().min(1),
    limit: pageSizeSchema.optional(),
    offset: pageOffsetSchema.optional(),
  })
  .strict();

/** Exact eBay query fields accepted by getEmailReport. */
export const getEmailReportArgumentsSchema = z
  .object({
    endDate: z.string().min(1),
    startDate: z.string().min(1),
  })
  .strict();

/** Validated query for getEmailCampaigns. */
export type GetEmailCampaignsArguments = z.infer<typeof getEmailCampaignsArgumentsSchema>;

/** Validated marketplace header and create document for createEmailCampaign. */
export type CreateEmailCampaignArguments = z.infer<typeof createEmailCampaignArgumentsSchema>;

/** Validated exact email-campaign path. */
export type EmailCampaignIdArguments = z.infer<typeof emailCampaignIdArgumentsSchema>;

/** Validated path and update document for updateEmailCampaign. */
export type UpdateEmailCampaignArguments = z.infer<typeof updateEmailCampaignArgumentsSchema>;

/** Validated query for getAudiences. */
export type GetAudiencesArguments = z.infer<typeof getAudiencesArgumentsSchema>;

/** Validated query for getEmailReport. */
export type GetEmailReportArguments = z.infer<typeof getEmailReportArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/api:GetEmailCampaignsResponse */
export type EmailCampaignsPage = components['schemas']['GetEmailCampaignsResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/api:CreateEmailCampaignResponse */
export type CreatedEmailCampaign = components['schemas']['CreateEmailCampaignResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/api:GetEmailCampaignResponse */
export type EmailCampaign = components['schemas']['GetEmailCampaignResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/api:UpdateEmailCampaignResponse */
export type UpdatedEmailCampaign = components['schemas']['UpdateEmailCampaignResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/api:DeleteEmailCampaignResponse */
export type DeletedEmailCampaign = components['schemas']['DeleteEmailCampaignResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/api:GetEmailCampaignAudiencesResponse */
export type EmailCampaignAudiences = components['schemas']['GetEmailCampaignAudiencesResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/api:GetEmailPreviewResponse */
export type EmailPreview = components['schemas']['GetEmailPreviewResponse'];

/** @see https://developer.ebay.com/api-docs/sell/marketing/types/api:GetEmailReportResponse */
export type EmailReport = components['schemas']['GetEmailReportResponse'];

const emailCampaignEndpoint = (emailCampaignId: string): string =>
  `/sell/marketing/v1/email_campaign/${encodeURIComponent(emailCampaignId)}`;

/**
 * Retrieves seller email campaigns with exact eBay query filters and pagination.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param emailCampaignsPage - Exact eBay query fields for listing email campaigns.
 * @returns Explicit completion containing eBay's unchanged email-campaign collection.
 * @example `await getEmailCampaigns(sellerSession, { limit: '25', offset: '0' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/email_campaign/methods/getEmailCampaigns
 */
export const getEmailCampaigns = (
  sellerSession: EbaySellerSession,
  emailCampaignsPage: GetEmailCampaignsArguments = {},
): Promise<EbayRequestCompletion<EmailCampaignsPage>> =>
  sellerSession.get<EmailCampaignsPage>({
    endpoint: '/sell/marketing/v1/email_campaign',
    searchParameters: emailCampaignsPage,
  });

/**
 * Creates one email campaign in a marketplace.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param emailCampaignCreation - Exact marketplace header and CreateEmailCampaignRequest fields.
 * @returns Explicit completion containing eBay's unchanged creation response.
 * @example `await createEmailCampaign(sellerSession, { 'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US', emailCampaignType: 'WELCOME', subject: 'Welcome' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/email_campaign/methods/createEmailCampaign
 */
export const createEmailCampaign = (
  sellerSession: EbaySellerSession,
  emailCampaignCreation: CreateEmailCampaignArguments,
): Promise<EbayRequestCompletion<CreatedEmailCampaign>> => {
  const { 'X-EBAY-C-MARKETPLACE-ID': marketplaceId, ...emailCampaignDocument } =
    emailCampaignCreation;
  return sellerSession.post<CreatedEmailCampaign>({
    endpoint: '/sell/marketing/v1/email_campaign',
    requestDocument: emailCampaignDocument,
    requestHeaders: { 'X-EBAY-C-MARKETPLACE-ID': marketplaceId },
  });
};

/**
 * Retrieves one email campaign by identifier.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param emailCampaignSelection - Exact eBay email_campaign_id path.
 * @returns Explicit completion containing eBay's unchanged email-campaign document.
 * @example `await getEmailCampaign(sellerSession, { email_campaign_id: 'CAMPAIGN-1' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/email_campaign/methods/getEmailCampaign
 */
export const getEmailCampaign = (
  sellerSession: EbaySellerSession,
  emailCampaignSelection: EmailCampaignIdArguments,
): Promise<EbayRequestCompletion<EmailCampaign>> =>
  sellerSession.get<EmailCampaign>({
    endpoint: emailCampaignEndpoint(emailCampaignSelection.email_campaign_id),
  });

/**
 * Updates one existing email campaign.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param emailCampaignReplacement - Exact email_campaign_id path and UpdateCampaignRequest fields.
 * @returns Explicit completion containing eBay's unchanged update response.
 * @example `await updateEmailCampaign(sellerSession, { email_campaign_id: 'CAMPAIGN-1', subject: 'Updated subject' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/email_campaign/methods/updateEmailCampaign
 */
export const updateEmailCampaign = (
  sellerSession: EbaySellerSession,
  emailCampaignReplacement: UpdateEmailCampaignArguments,
): Promise<EbayRequestCompletion<UpdatedEmailCampaign>> => {
  const { email_campaign_id: emailCampaignId, ...emailCampaignDocument } = emailCampaignReplacement;
  return sellerSession.put<UpdatedEmailCampaign>({
    endpoint: emailCampaignEndpoint(emailCampaignId),
    requestDocument: emailCampaignDocument,
  });
};

/**
 * Deletes one email campaign.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param emailCampaignSelection - Exact eBay email_campaign_id path.
 * @returns Explicit completion containing eBay's unchanged delete response.
 * @example `await deleteEmailCampaign(sellerSession, { email_campaign_id: 'CAMPAIGN-1' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/email_campaign/methods/deleteEmailCampaign
 */
export const deleteEmailCampaign = (
  sellerSession: EbaySellerSession,
  emailCampaignSelection: EmailCampaignIdArguments,
): Promise<EbayRequestCompletion<DeletedEmailCampaign>> =>
  sellerSession.delete<DeletedEmailCampaign>({
    endpoint: emailCampaignEndpoint(emailCampaignSelection.email_campaign_id),
  });

/**
 * Retrieves audiences available for one email-campaign type.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param audienceSelection - Exact eBay emailCampaignType query and optional pagination.
 * @returns Explicit completion containing eBay's unchanged audience collection.
 * @example `await getAudiences(sellerSession, { emailCampaignType: 'WELCOME', limit: '25' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/email_campaign/methods/getAudiences
 */
export const getAudiences = (
  sellerSession: EbaySellerSession,
  audienceSelection: GetAudiencesArguments,
): Promise<EbayRequestCompletion<EmailCampaignAudiences>> =>
  sellerSession.get<EmailCampaignAudiences>({
    endpoint: '/sell/marketing/v1/email_campaign/audience',
    searchParameters: audienceSelection,
  });

/**
 * Retrieves the HTML preview for one email campaign.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param emailCampaignSelection - Exact eBay email_campaign_id path.
 * @returns Explicit completion containing eBay's unchanged email-preview document.
 * @example `await getEmailPreview(sellerSession, { email_campaign_id: 'CAMPAIGN-1' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/email_campaign/methods/getEmailPreview
 */
export const getEmailPreview = (
  sellerSession: EbaySellerSession,
  emailCampaignSelection: EmailCampaignIdArguments,
): Promise<EbayRequestCompletion<EmailPreview>> =>
  sellerSession.get<EmailPreview>({
    endpoint: `${emailCampaignEndpoint(emailCampaignSelection.email_campaign_id)}/email_preview`,
  });

/**
 * Retrieves the seller email-campaign performance report for a date range.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param emailReportSelection - Exact eBay startDate and endDate query fields.
 * @returns Explicit completion containing eBay's unchanged email-report document.
 * @example `await getEmailReport(sellerSession, { startDate: '2022-11-01T19:09:02.768Z', endDate: '2022-12-28T19:09:02.768Z' })`
 * @see https://developer.ebay.com/api-docs/sell/marketing/resources/email_campaign/methods/getEmailReport
 */
export const getEmailReport = (
  sellerSession: EbaySellerSession,
  emailReportSelection: GetEmailReportArguments,
): Promise<EbayRequestCompletion<EmailReport>> =>
  sellerSession.get<EmailReport>({
    endpoint: '/sell/marketing/v1/email_campaign/report',
    searchParameters: emailReportSelection,
  });

/** MCP definition for Sell Marketing getEmailCampaigns. */
export const getEmailCampaignsTool = defineTool({
  name: 'ebay_sell_marketing_get_email_campaigns',
  namespace: 'sell.marketing',
  description: "Retrieve the seller's email campaigns with exact eBay query filters",
  argumentsSchema: getEmailCampaignsArgumentsSchema,
  operationKind: 'read',
  operation: getEmailCampaigns,
});

/** MCP definition for Sell Marketing createEmailCampaign. */
export const createEmailCampaignTool = defineTool({
  name: 'ebay_sell_marketing_create_email_campaign',
  namespace: 'sell.marketing',
  description: 'Create one email campaign with the required marketplace header and direct document',
  argumentsSchema: createEmailCampaignArgumentsSchema,
  operationKind: 'write',
  operation: createEmailCampaign,
});

/** MCP definition for Sell Marketing getEmailCampaign. */
export const getEmailCampaignTool = defineTool({
  name: 'ebay_sell_marketing_get_email_campaign',
  namespace: 'sell.marketing',
  description: 'Retrieve one email campaign by its exact eBay email_campaign_id',
  argumentsSchema: emailCampaignIdArgumentsSchema,
  operationKind: 'read',
  operation: getEmailCampaign,
});

/** MCP definition for Sell Marketing updateEmailCampaign. */
export const updateEmailCampaignTool = defineTool({
  name: 'ebay_sell_marketing_update_email_campaign',
  namespace: 'sell.marketing',
  description: 'Update one email campaign using the direct eBay document',
  argumentsSchema: updateEmailCampaignArgumentsSchema,
  operationKind: 'write',
  operation: updateEmailCampaign,
});

/** MCP definition for Sell Marketing deleteEmailCampaign. */
export const deleteEmailCampaignTool = defineTool({
  name: 'ebay_sell_marketing_delete_email_campaign',
  namespace: 'sell.marketing',
  description: 'Delete one email campaign by its exact eBay email_campaign_id',
  argumentsSchema: emailCampaignIdArgumentsSchema,
  operationKind: 'write',
  operation: deleteEmailCampaign,
});

/** MCP definition for Sell Marketing getAudiences. */
export const getAudiencesTool = defineTool({
  name: 'ebay_sell_marketing_get_audiences',
  namespace: 'sell.marketing',
  description: 'Retrieve audiences available for one email campaign type',
  argumentsSchema: getAudiencesArgumentsSchema,
  operationKind: 'read',
  operation: getAudiences,
});

/** MCP definition for Sell Marketing getEmailPreview. */
export const getEmailPreviewTool = defineTool({
  name: 'ebay_sell_marketing_get_email_preview',
  namespace: 'sell.marketing',
  description: 'Retrieve the HTML preview for one email campaign',
  argumentsSchema: emailCampaignIdArgumentsSchema,
  operationKind: 'read',
  operation: getEmailPreview,
});

/** MCP definition for Sell Marketing getEmailReport. */
export const getEmailReportTool = defineTool({
  name: 'ebay_sell_marketing_get_email_report',
  namespace: 'sell.marketing',
  description: "Retrieve the seller's email campaign performance report for a date range",
  argumentsSchema: getEmailReportArgumentsSchema,
  operationKind: 'read',
  operation: getEmailReport,
});
