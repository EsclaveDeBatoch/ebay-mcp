import { getItemsAwaitingFeedbackTool } from '@/ebay/commerce/feedback/awaitingFeedback.js';
import { getFeedbackTool, leaveFeedbackTool } from '@/ebay/commerce/feedback/feedback.js';
import { getFeedbackRatingSummaryTool } from '@/ebay/commerce/feedback/feedbackRatingSummary.js';
import { respondToFeedbackTool } from '@/ebay/commerce/feedback/respondToFeedback.js';
import { getUserTool } from '@/ebay/commerce/identity/user.js';
import { bulkUpdateConversationTool } from '@/ebay/commerce/message/bulkUpdateConversation.js';
import { getConversationTool, getConversationsTool } from '@/ebay/commerce/message/conversation.js';
import { sendMessageTool } from '@/ebay/commerce/message/sendMessage.js';
import { updateConversationTool } from '@/ebay/commerce/message/updateConversation.js';
import { getConfigTool, updateConfigTool } from '@/ebay/commerce/notification/configuration.js';
import {
  createDestinationTool,
  deleteDestinationTool,
  getDestinationTool,
  getDestinationsTool,
  updateDestinationTool,
} from '@/ebay/commerce/notification/destination.js';
import { translateListingTextTool } from '@/ebay/commerce/translation/language.js';
import { getCustomerServiceMetricTool } from '@/ebay/sell/analytics/customerServiceMetric.js';
import {
  findSellerStandardsProfilesTool,
  getSellerStandardsProfileTool,
} from '@/ebay/sell/analytics/sellerStandardsProfile.js';
import { getTrafficReportTool } from '@/ebay/sell/analytics/trafficReport.js';
import {
  findEligibleItemsTool,
  sendOfferToInterestedBuyersTool,
} from '@/ebay/sell/negotiation/offer.js';
import { findListingRecommendationsTool } from '@/ebay/sell/recommendation/listingRecommendation.js';
import type { EbayTool } from '@/mcp/defineTool.js';

/** Explicit catalogue of migrated eBay resource tools. */
export const ebayToolCatalogue: readonly EbayTool[] = [
  getItemsAwaitingFeedbackTool,
  getFeedbackTool,
  leaveFeedbackTool,
  getFeedbackRatingSummaryTool,
  respondToFeedbackTool,
  bulkUpdateConversationTool,
  getConversationsTool,
  getConversationTool,
  sendMessageTool,
  updateConversationTool,
  getConfigTool,
  updateConfigTool,
  getDestinationsTool,
  createDestinationTool,
  getDestinationTool,
  updateDestinationTool,
  deleteDestinationTool,
  getUserTool,
  translateListingTextTool,
  getTrafficReportTool,
  findSellerStandardsProfilesTool,
  getSellerStandardsProfileTool,
  getCustomerServiceMetricTool,
  findEligibleItemsTool,
  sendOfferToInterestedBuyersTool,
  findListingRecommendationsTool,
];
