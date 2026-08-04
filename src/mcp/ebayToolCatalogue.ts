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
import { getPublicKeyTool } from '@/ebay/commerce/notification/publicKey.js';
import {
  createSubscriptionTool,
  deleteSubscriptionTool,
  disableSubscriptionTool,
  enableSubscriptionTool,
  getSubscriptionTool,
  getSubscriptionsTool,
  testSubscriptionTool,
  updateSubscriptionTool,
} from '@/ebay/commerce/notification/subscription.js';
import {
  createSubscriptionFilterTool,
  deleteSubscriptionFilterTool,
  getSubscriptionFilterTool,
} from '@/ebay/commerce/notification/subscriptionFilter.js';
import { getTopicsTool, getTopicTool } from '@/ebay/commerce/notification/topic.js';
import {
  getCategorySuggestionsTool,
  getCategoryTreeTool,
  getDefaultCategoryTreeIdTool,
  getItemAspectsForCategoryTool,
} from '@/ebay/commerce/taxonomy/categoryTree.js';
import { translateListingTextTool } from '@/ebay/commerce/translation/language.js';
import {
  createVeroReportTool,
  getVeroReportItemsTool,
  getVeroReportTool,
} from '@/ebay/commerce/vero/report.js';
import { getVeroReasonCodesTool, getVeroReasonCodeTool } from '@/ebay/commerce/vero/reasonCode.js';
import { getRateLimitsTool, getUserRateLimitsTool } from '@/ebay/developer/analytics/rateLimit.js';
import {
  createSigningKeyTool,
  getSigningKeysTool,
  getSigningKeyTool,
} from '@/ebay/developer/keyManagement/signingKey.js';
import { getDeveloperStatusFeedTool } from '@/ebay/developer/status/incident.js';
import { getAdvertisingEligibilityTool } from '@/ebay/sell/account/advertisingEligibility.js';
import {
  createCustomPolicyTool,
  getCustomPoliciesTool,
  getCustomPolicyTool,
  updateCustomPolicyTool,
} from '@/ebay/sell/account/customPolicy.js';
import {
  createFulfillmentPolicyTool,
  deleteFulfillmentPolicyTool,
  getFulfillmentPoliciesTool,
  getFulfillmentPolicyByNameTool,
  getFulfillmentPolicyTool,
  updateFulfillmentPolicyTool,
} from '@/ebay/sell/account/fulfillmentPolicy.js';
import { getKycTool } from '@/ebay/sell/account/kyc.js';
import {
  createPaymentPolicyTool,
  deletePaymentPolicyTool,
  getPaymentPoliciesTool,
  getPaymentPolicyByNameTool,
  getPaymentPolicyTool,
  updatePaymentPolicyTool,
} from '@/ebay/sell/account/paymentPolicy.js';
import {
  getPaymentsProgramOnboardingTool,
  getPaymentsProgramTool,
} from '@/ebay/sell/account/paymentsProgram.js';
import { getPrivilegesTool } from '@/ebay/sell/account/privilege.js';
import {
  getOptedInProgramsTool,
  optInToProgramTool,
  optOutOfProgramTool,
} from '@/ebay/sell/account/program.js';
import { getRateTablesTool } from '@/ebay/sell/account/rateTable.js';
import {
  bulkCreateOrReplaceSalesTaxTool,
  createOrReplaceSalesTaxTool,
  deleteSalesTaxTool,
  getSalesTaxesTool,
  getSalesTaxTool,
} from '@/ebay/sell/account/salesTax.js';
import {
  createReturnPolicyTool,
  deleteReturnPolicyTool,
  getReturnPoliciesTool as getAccountReturnPoliciesTool,
  getReturnPolicyByNameTool,
  getReturnPolicyTool,
  updateReturnPolicyTool,
} from '@/ebay/sell/account/returnPolicy.js';
import { getSubscriptionTool as getAccountSubscriptionTool } from '@/ebay/sell/account/subscription.js';
import { getCustomerServiceMetricTool } from '@/ebay/sell/analytics/customerServiceMetric.js';
import {
  findSellerStandardsProfilesTool,
  getSellerStandardsProfileTool,
} from '@/ebay/sell/analytics/sellerStandardsProfile.js';
import { getTrafficReportTool } from '@/ebay/sell/analytics/trafficReport.js';
import { getOrderTool, getOrdersTool, issueRefundTool } from '@/ebay/sell/fulfillment/order.js';
import {
  acceptPaymentDisputeTool,
  addEvidenceTool,
  contestPaymentDisputeTool,
  fetchEvidenceContentTool,
  getActivitiesTool,
  getPaymentDisputeSummariesTool,
  getPaymentDisputeTool,
  updateEvidenceTool,
  uploadEvidenceFileTool,
} from '@/ebay/sell/fulfillment/paymentDispute.js';
import {
  createShippingFulfillmentTool,
  getShippingFulfillmentTool,
  getShippingFulfillmentsTool,
} from '@/ebay/sell/fulfillment/shippingFulfillment.js';
import {
  bulkCreateOrReplaceInventoryItemTool,
  bulkGetInventoryItemTool,
  bulkMigrateListingTool,
  bulkUpdatePriceQuantityTool,
  createOrReplaceInventoryItemTool,
  deleteInventoryItemTool,
  getInventoryItemsTool,
  getInventoryItemTool,
} from '@/ebay/sell/inventory/inventoryItem.js';
import {
  createOrReplaceInventoryItemGroupTool,
  deleteInventoryItemGroupTool,
  getInventoryItemGroupTool,
} from '@/ebay/sell/inventory/inventoryItemGroup.js';
import {
  createInventoryLocationTool,
  deleteInventoryLocationTool,
  disableInventoryLocationTool,
  enableInventoryLocationTool,
  getInventoryLocationsTool,
  getInventoryLocationTool,
  updateInventoryLocationTool,
} from '@/ebay/sell/inventory/inventoryLocation.js';
import {
  createOrReplaceProductCompatibilityTool,
  deleteProductCompatibilityTool,
  getProductCompatibilityTool,
} from '@/ebay/sell/inventory/productCompatibility.js';
import {
  createOrReplaceSkuLocationMappingTool,
  deleteSkuLocationMappingTool,
  getSkuLocationMappingTool,
} from '@/ebay/sell/inventory/skuLocationMapping.js';
import {
  getCompatibilitiesBySpecificationTool,
  getCompatibilityPropertyNamesTool,
  getCompatibilityPropertyValuesTool,
  getMultiCompatibilityPropertyValuesTool,
  getProductCompatibilitiesTool,
} from '@/ebay/sell/metadata/compatibility.js';
import {
  getAutomotivePartsCompatibilityPoliciesTool,
  getCategoryPoliciesTool,
  getClassifiedAdPoliciesTool,
  getCurrenciesTool,
  getExtendedProducerResponsibilityPoliciesTool,
  getHazardousMaterialsLabelsTool,
  getItemConditionPoliciesTool,
  getListingStructurePoliciesTool,
  getListingTypePoliciesTool,
  getMotorsListingPoliciesTool,
  getNegotiatedPricePoliciesTool,
  getProductSafetyLabelsTool,
  getRegulatoryPoliciesTool,
  getReturnPoliciesTool,
  getShippingPoliciesTool,
  getSiteVisibilityPoliciesTool,
} from '@/ebay/sell/metadata/marketplace.js';
import { getSalesTaxJurisdictionsTool } from '@/ebay/sell/metadata/salesTaxJurisdiction.js';
import {
  createListingTool,
  endListingTool,
  getActiveListingsTool,
  getListingTool,
  relistListingTool,
  reviseListingTool,
} from '@/ebay/trading/fixedPriceListing.js';
import { getActualCostsTool } from '@/ebay/sell/edelivery/actualCost.js';
import {
  cancelBundleTool,
  createBundleTool,
  getBundleLabelTool,
  getBundleTool,
} from '@/ebay/sell/edelivery/bundle.js';
import { createComplaintTool } from '@/ebay/sell/edelivery/complaint.js';
import { getHandoverSheetTool, getLabelsTool } from '@/ebay/sell/edelivery/shippingDocument.js';
import {
  getAgentsTool,
  getBatteryQualificationsTool,
  getDropoffSitesTool,
  getServicesTool,
} from '@/ebay/sell/edelivery/shippingOption.js';
import {
  createAddressPreferenceTool,
  createConsignPreferenceTool,
  getAddressPreferencesTool,
  getConsignPreferencesTool,
} from '@/ebay/sell/edelivery/shippingPreference.js';
import {
  bulkCancelPackagesTool,
  bulkConfirmPackagesTool,
  bulkDeletePackagesTool,
  cancelPackageTool,
  clonePackageTool,
  confirmPackageTool,
  createPackageTool,
  deletePackageTool,
  getPackageTool,
  getPackagesByLineItemIdTool,
} from '@/ebay/sell/edelivery/shipmentPackage.js';
import { getTrackingTool } from '@/ebay/sell/edelivery/tracking.js';
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
  getPublicKeyTool,
  getSubscriptionsTool,
  createSubscriptionTool,
  getSubscriptionTool,
  updateSubscriptionTool,
  deleteSubscriptionTool,
  disableSubscriptionTool,
  enableSubscriptionTool,
  testSubscriptionTool,
  createSubscriptionFilterTool,
  getSubscriptionFilterTool,
  deleteSubscriptionFilterTool,
  getTopicsTool,
  getTopicTool,
  getDefaultCategoryTreeIdTool,
  getCategoryTreeTool,
  getCategorySuggestionsTool,
  getItemAspectsForCategoryTool,
  getUserTool,
  translateListingTextTool,
  createVeroReportTool,
  getVeroReportTool,
  getVeroReportItemsTool,
  getVeroReasonCodeTool,
  getVeroReasonCodesTool,
  getRateLimitsTool,
  getUserRateLimitsTool,
  getSigningKeysTool,
  createSigningKeyTool,
  getSigningKeyTool,
  getDeveloperStatusFeedTool,
  getCustomPoliciesTool,
  createCustomPolicyTool,
  getCustomPolicyTool,
  updateCustomPolicyTool,
  getFulfillmentPoliciesTool,
  createFulfillmentPolicyTool,
  getFulfillmentPolicyTool,
  getFulfillmentPolicyByNameTool,
  updateFulfillmentPolicyTool,
  deleteFulfillmentPolicyTool,
  getPaymentPoliciesTool,
  createPaymentPolicyTool,
  getPaymentPolicyTool,
  getPaymentPolicyByNameTool,
  updatePaymentPolicyTool,
  deletePaymentPolicyTool,
  getAccountReturnPoliciesTool,
  createReturnPolicyTool,
  getReturnPolicyTool,
  getReturnPolicyByNameTool,
  updateReturnPolicyTool,
  deleteReturnPolicyTool,
  getPrivilegesTool,
  getRateTablesTool,
  getAccountSubscriptionTool,
  getKycTool,
  getAdvertisingEligibilityTool,
  getOptedInProgramsTool,
  optInToProgramTool,
  optOutOfProgramTool,
  createOrReplaceSalesTaxTool,
  bulkCreateOrReplaceSalesTaxTool,
  deleteSalesTaxTool,
  getSalesTaxTool,
  getSalesTaxesTool,
  getPaymentsProgramTool,
  getPaymentsProgramOnboardingTool,
  getInventoryItemsTool,
  getInventoryItemTool,
  createOrReplaceInventoryItemTool,
  deleteInventoryItemTool,
  bulkCreateOrReplaceInventoryItemTool,
  bulkGetInventoryItemTool,
  bulkUpdatePriceQuantityTool,
  bulkMigrateListingTool,
  getInventoryItemGroupTool,
  createOrReplaceInventoryItemGroupTool,
  deleteInventoryItemGroupTool,
  getProductCompatibilityTool,
  createOrReplaceProductCompatibilityTool,
  deleteProductCompatibilityTool,
  getSkuLocationMappingTool,
  createOrReplaceSkuLocationMappingTool,
  deleteSkuLocationMappingTool,
  getInventoryLocationsTool,
  getInventoryLocationTool,
  createInventoryLocationTool,
  deleteInventoryLocationTool,
  disableInventoryLocationTool,
  enableInventoryLocationTool,
  updateInventoryLocationTool,
  getActualCostsTool,
  getAddressPreferencesTool,
  createAddressPreferenceTool,
  getConsignPreferencesTool,
  createConsignPreferenceTool,
  getAgentsTool,
  getBatteryQualificationsTool,
  getDropoffSitesTool,
  getServicesTool,
  createBundleTool,
  getBundleTool,
  cancelBundleTool,
  getBundleLabelTool,
  createPackageTool,
  getPackageTool,
  deletePackageTool,
  getPackagesByLineItemIdTool,
  cancelPackageTool,
  clonePackageTool,
  confirmPackageTool,
  bulkCancelPackagesTool,
  bulkConfirmPackagesTool,
  bulkDeletePackagesTool,
  getLabelsTool,
  getHandoverSheetTool,
  getTrackingTool,
  createComplaintTool,
  getTrafficReportTool,
  findSellerStandardsProfilesTool,
  getSellerStandardsProfileTool,
  getCustomerServiceMetricTool,
  getOrdersTool,
  getOrderTool,
  issueRefundTool,
  getShippingFulfillmentsTool,
  createShippingFulfillmentTool,
  getShippingFulfillmentTool,
  getPaymentDisputeTool,
  fetchEvidenceContentTool,
  getActivitiesTool,
  getPaymentDisputeSummariesTool,
  contestPaymentDisputeTool,
  acceptPaymentDisputeTool,
  uploadEvidenceFileTool,
  addEvidenceTool,
  updateEvidenceTool,
  getAutomotivePartsCompatibilityPoliciesTool,
  getCategoryPoliciesTool,
  getClassifiedAdPoliciesTool,
  getCurrenciesTool,
  getExtendedProducerResponsibilityPoliciesTool,
  getHazardousMaterialsLabelsTool,
  getItemConditionPoliciesTool,
  getListingStructurePoliciesTool,
  getListingTypePoliciesTool,
  getMotorsListingPoliciesTool,
  getNegotiatedPricePoliciesTool,
  getProductSafetyLabelsTool,
  getRegulatoryPoliciesTool,
  getReturnPoliciesTool,
  getShippingPoliciesTool,
  getSiteVisibilityPoliciesTool,
  getCompatibilitiesBySpecificationTool,
  getCompatibilityPropertyNamesTool,
  getCompatibilityPropertyValuesTool,
  getMultiCompatibilityPropertyValuesTool,
  getProductCompatibilitiesTool,
  getSalesTaxJurisdictionsTool,
  findEligibleItemsTool,
  sendOfferToInterestedBuyersTool,
  findListingRecommendationsTool,
  getActiveListingsTool,
  getListingTool,
  createListingTool,
  reviseListingTool,
  endListingTool,
  relistListingTool,
];
