import { describe, it, expect } from 'vitest';
import {
  validateScopesDetailed,
  getRequiredScopesForTool,
  hasRequiredScopes,
  getScopeDifferences,
  formatScopeForDisplay,
  groupScopesByCategory,
  isScopeReadonly,
  getWriteScope,
  getReadonlyScope,
  getScopeTypeDescription,
} from '@/auth/scopeUtils.js';

describe('Scope Utils', () => {
  describe('validateScopesDetailed', () => {
    it('validate production scopes', () => {
      const result = validateScopesDetailed(
        [
          'https://api.ebay.com/oauth/api_scope/sell.inventory',
          'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
        ],
        'production',
      );

      expect(result.isValid).toBe(true);
      expect(result.validScopes).toHaveLength(2);
      expect(result.invalidScopes).toHaveLength(0);
    });

    it('detect invalid scopes', () => {
      const result = validateScopesDetailed(
        [
          'https://api.ebay.com/oauth/api_scope/sell.inventory',
          'https://api.ebay.com/oauth/api_scope/invalid.scope',
        ],
        'production',
      );

      expect(result.isValid).toBe(false);
      expect(result.validScopes).toHaveLength(1);
      expect(result.invalidScopes).toContain('https://api.ebay.com/oauth/api_scope/invalid.scope');
    });

    it('validate sandbox scopes', () => {
      const result = validateScopesDetailed(
        [
          'https://api.ebay.com/oauth/api_scope/sell.inventory',
          'https://api.ebay.com/oauth/api_scope/buy.order.readonly',
        ],
        'sandbox',
      );

      expect(result.validScopes).toContain('https://api.ebay.com/oauth/api_scope/sell.inventory');
    });
  });

  describe('getRequiredScopesForTool', () => {
    it('return scopes for inventory tools', () => {
      const requirement = getRequiredScopesForTool('ebay_get_inventory_items');

      expect(requirement).toBeDefined();
      expect(requirement?.requiredScopes).toContain(
        'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
      );
      expect(requirement?.minimumScope).toBe(
        'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
      );
    });

    it('return scopes for order management tools', () => {
      const requirement = getRequiredScopesForTool('ebay_sell_fulfillment_get_orders');

      expect(requirement).toBeDefined();
      expect(requirement?.requiredScopes).toContain(
        'https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly',
      );
    });

    it('uses the finances scope for direct order refunds', () => {
      const requirement = getRequiredScopesForTool('ebay_sell_fulfillment_issue_refund');

      expect(requirement?.requiredScopes).toEqual([
        'https://api.ebay.com/oauth/api_scope/sell.finances',
      ]);
    });

    it('uses the payment-dispute scope for dispute evidence', () => {
      const requirement = getRequiredScopesForTool('ebay_sell_fulfillment_add_evidence');

      expect(requirement?.requiredScopes).toEqual([
        'https://api.ebay.com/oauth/api_scope/sell.payment.dispute',
      ]);
    });

    it.each(['ebay_sell_account_get_custom_policies', 'ebay_sell_account_get_custom_policy'])(
      'returns either account scope for the hierarchical read %s tool',
      (customPolicyToolName) => {
        const requirement = getRequiredScopesForTool(customPolicyToolName);

        expect(requirement).toEqual({
          requiredScopes: [
            'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
            'https://api.ebay.com/oauth/api_scope/sell.account',
          ],
          minimumScope: 'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
          description: 'Requires read access to seller custom policies',
        });
      },
    );

    it.each(['ebay_sell_account_create_custom_policy', 'ebay_sell_account_update_custom_policy'])(
      'returns the account write scope for the hierarchical %s tool',
      (customPolicyToolName) => {
        const requirement = getRequiredScopesForTool(customPolicyToolName);

        expect(requirement).toEqual({
          requiredScopes: ['https://api.ebay.com/oauth/api_scope/sell.account'],
          minimumScope: 'https://api.ebay.com/oauth/api_scope/sell.account',
          description: 'Requires write access to seller custom policies',
        });
      },
    );

    it.each([
      'ebay_sell_account_get_fulfillment_policies',
      'ebay_sell_account_get_fulfillment_policy',
      'ebay_sell_account_get_fulfillment_policy_by_name',
    ])('returns either account scope for the hierarchical %s tool', (fulfillmentPolicyToolName) => {
      const requirement = getRequiredScopesForTool(fulfillmentPolicyToolName);

      expect(requirement).toEqual({
        requiredScopes: [
          'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
          'https://api.ebay.com/oauth/api_scope/sell.account',
        ],
        minimumScope: 'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
        description: 'Requires read access to seller fulfillment policies',
      });
    });

    it.each([
      'ebay_sell_account_create_fulfillment_policy',
      'ebay_sell_account_update_fulfillment_policy',
      'ebay_sell_account_delete_fulfillment_policy',
    ])(
      'returns the account write scope for the hierarchical %s tool',
      (fulfillmentPolicyToolName) => {
        const requirement = getRequiredScopesForTool(fulfillmentPolicyToolName);

        expect(requirement).toEqual({
          requiredScopes: ['https://api.ebay.com/oauth/api_scope/sell.account'],
          minimumScope: 'https://api.ebay.com/oauth/api_scope/sell.account',
          description: 'Requires write access to seller fulfillment policies',
        });
      },
    );

    it.each([
      'ebay_sell_account_get_payment_policies',
      'ebay_sell_account_get_payment_policy',
      'ebay_sell_account_get_payment_policy_by_name',
    ])('returns either account scope for the hierarchical %s tool', (paymentPolicyToolName) => {
      const requirement = getRequiredScopesForTool(paymentPolicyToolName);

      expect(requirement).toEqual({
        requiredScopes: [
          'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
          'https://api.ebay.com/oauth/api_scope/sell.account',
        ],
        minimumScope: 'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
        description: 'Requires read access to seller payment policies',
      });
    });

    it.each([
      'ebay_sell_account_create_payment_policy',
      'ebay_sell_account_update_payment_policy',
      'ebay_sell_account_delete_payment_policy',
    ])('returns the account write scope for the hierarchical %s tool', (paymentPolicyToolName) => {
      const requirement = getRequiredScopesForTool(paymentPolicyToolName);

      expect(requirement).toEqual({
        requiredScopes: ['https://api.ebay.com/oauth/api_scope/sell.account'],
        minimumScope: 'https://api.ebay.com/oauth/api_scope/sell.account',
        description: 'Requires write access to seller payment policies',
      });
    });

    it.each([
      'ebay_sell_account_get_return_policies',
      'ebay_sell_account_get_return_policy',
      'ebay_sell_account_get_return_policy_by_name',
    ])('returns either account scope for the hierarchical %s tool', (returnPolicyToolName) => {
      const requirement = getRequiredScopesForTool(returnPolicyToolName);

      expect(requirement).toEqual({
        requiredScopes: [
          'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
          'https://api.ebay.com/oauth/api_scope/sell.account',
        ],
        minimumScope: 'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
        description: 'Requires read access to seller return policies',
      });
    });

    it.each([
      'ebay_sell_account_create_return_policy',
      'ebay_sell_account_update_return_policy',
      'ebay_sell_account_delete_return_policy',
    ])('returns the account write scope for the hierarchical %s tool', (returnPolicyToolName) => {
      const requirement = getRequiredScopesForTool(returnPolicyToolName);

      expect(requirement).toEqual({
        requiredScopes: ['https://api.ebay.com/oauth/api_scope/sell.account'],
        minimumScope: 'https://api.ebay.com/oauth/api_scope/sell.account',
        description: 'Requires write access to seller return policies',
      });
    });

    it.each([
      'ebay_sell_account_get_privileges',
      'ebay_sell_account_get_rate_tables',
      'ebay_sell_account_get_subscription',
      'ebay_sell_account_get_kyc',
      'ebay_sell_account_get_advertising_eligibility',
    ])('returns either account scope for the hierarchical %s tool', (accountReadToolName) => {
      const requirement = getRequiredScopesForTool(accountReadToolName);

      expect(requirement).toEqual({
        requiredScopes: [
          'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
          'https://api.ebay.com/oauth/api_scope/sell.account',
        ],
        minimumScope: 'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
        description: 'Requires read access to seller account information',
      });
    });

    it('returns either account scope for seller program reads', () => {
      const requirement = getRequiredScopesForTool('ebay_sell_account_get_opted_in_programs');

      expect(requirement).toEqual({
        requiredScopes: [
          'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
          'https://api.ebay.com/oauth/api_scope/sell.account',
        ],
        minimumScope: 'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
        description: 'Requires read access to seller program enrollment',
      });
    });

    it.each(['ebay_sell_account_opt_in_to_program', 'ebay_sell_account_opt_out_of_program'])(
      'returns the account write scope for the hierarchical %s tool',
      (programWriteToolName) => {
        const requirement = getRequiredScopesForTool(programWriteToolName);

        expect(requirement).toEqual({
          requiredScopes: ['https://api.ebay.com/oauth/api_scope/sell.account'],
          minimumScope: 'https://api.ebay.com/oauth/api_scope/sell.account',
          description: 'Requires write access to seller program enrollment',
        });
      },
    );

    it.each(['ebay_sell_account_get_sales_tax', 'ebay_sell_account_get_sales_taxes'])(
      'returns either account scope for the hierarchical %s read',
      (salesTaxReadToolName) => {
        const salesTaxScopeRequirement = getRequiredScopesForTool(salesTaxReadToolName);

        expect(salesTaxScopeRequirement).toEqual({
          requiredScopes: [
            'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
            'https://api.ebay.com/oauth/api_scope/sell.account',
          ],
          minimumScope: 'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
          description: 'Requires read access to seller sales-tax entries',
        });
      },
    );

    it.each([
      'ebay_sell_account_create_or_replace_sales_tax',
      'ebay_sell_account_bulk_create_or_replace_sales_tax',
      'ebay_sell_account_delete_sales_tax',
    ])('returns the account write scope for the hierarchical %s tool', (salesTaxWriteToolName) => {
      const salesTaxScopeRequirement = getRequiredScopesForTool(salesTaxWriteToolName);

      expect(salesTaxScopeRequirement).toEqual({
        requiredScopes: ['https://api.ebay.com/oauth/api_scope/sell.account'],
        minimumScope: 'https://api.ebay.com/oauth/api_scope/sell.account',
        description: 'Requires write access to seller sales-tax entries',
      });
    });

    it.each([
      'ebay_sell_account_get_payments_program',
      'ebay_sell_account_get_payments_program_onboarding',
    ])('returns either account scope for the hierarchical %s read', (paymentsProgramToolName) => {
      const paymentsProgramScopeRequirement = getRequiredScopesForTool(paymentsProgramToolName);

      expect(paymentsProgramScopeRequirement).toEqual({
        requiredScopes: [
          'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
          'https://api.ebay.com/oauth/api_scope/sell.account',
        ],
        minimumScope: 'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
        description: 'Requires read access to deprecated payments-program status',
      });
    });

    it('returns either inventory scope for the hierarchical item-group read', () => {
      const inventoryItemGroupScopeRequirement = getRequiredScopesForTool(
        'ebay_sell_inventory_get_inventory_item_group',
      );

      expect(inventoryItemGroupScopeRequirement).toEqual({
        requiredScopes: [
          'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
          'https://api.ebay.com/oauth/api_scope/sell.inventory',
        ],
        minimumScope: 'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
        description: 'Requires read access to inventory item groups',
      });
    });

    it.each([
      'ebay_sell_inventory_create_or_replace_inventory_item_group',
      'ebay_sell_inventory_delete_inventory_item_group',
    ])(
      'returns the inventory write scope for the hierarchical %s tool',
      (inventoryWriteToolName) => {
        const inventoryItemGroupScopeRequirement = getRequiredScopesForTool(inventoryWriteToolName);

        expect(inventoryItemGroupScopeRequirement).toEqual({
          requiredScopes: ['https://api.ebay.com/oauth/api_scope/sell.inventory'],
          minimumScope: 'https://api.ebay.com/oauth/api_scope/sell.inventory',
          description: 'Requires write access to inventory item groups',
        });
      },
    );

    it('returns either inventory scope for the hierarchical product-compatibility read', () => {
      const productCompatibilityScopeRequirement = getRequiredScopesForTool(
        'ebay_sell_inventory_get_product_compatibility',
      );

      expect(productCompatibilityScopeRequirement).toEqual({
        requiredScopes: [
          'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
          'https://api.ebay.com/oauth/api_scope/sell.inventory',
        ],
        minimumScope: 'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
        description: 'Requires read access to inventory product compatibility',
      });
    });

    it.each([
      'ebay_sell_inventory_create_or_replace_product_compatibility',
      'ebay_sell_inventory_delete_product_compatibility',
    ])(
      'returns the inventory write scope for the hierarchical %s tool',
      (productCompatibilityToolName) => {
        const productCompatibilityScopeRequirement = getRequiredScopesForTool(
          productCompatibilityToolName,
        );

        expect(productCompatibilityScopeRequirement).toEqual({
          requiredScopes: ['https://api.ebay.com/oauth/api_scope/sell.inventory'],
          minimumScope: 'https://api.ebay.com/oauth/api_scope/sell.inventory',
          description: 'Requires write access to inventory product compatibility',
        });
      },
    );

    it.each([
      'ebay_sell_analytics_get_traffic_report',
      'ebay_sell_analytics_find_seller_standards_profiles',
      'ebay_sell_analytics_get_seller_standards_profile',
      'ebay_sell_analytics_get_customer_service_metric',
    ])('returns the analytics scope for the hierarchical %s tool', (analyticsToolName) => {
      const requirement = getRequiredScopesForTool(analyticsToolName);

      expect(requirement).toBeDefined();
      expect(requirement?.requiredScopes).toEqual([
        'https://api.ebay.com/oauth/api_scope/sell.analytics.readonly',
      ]);
      expect(requirement?.minimumScope).toBe(
        'https://api.ebay.com/oauth/api_scope/sell.analytics.readonly',
      );
    });

    it('returns the public-data scope for application rate limits', () => {
      const requirement = getRequiredScopesForTool('ebay_developer_analytics_get_rate_limits');

      expect(requirement?.requiredScopes).toEqual(['https://api.ebay.com/oauth/api_scope']);
      expect(requirement?.minimumScope).toBe('https://api.ebay.com/oauth/api_scope');
    });

    it('returns the supported user-scope alternatives for user rate limits', () => {
      const requirement = getRequiredScopesForTool('ebay_developer_analytics_get_user_rate_limits');

      expect(requirement?.requiredScopes).toEqual([
        'https://api.ebay.com/oauth/api_scope/sell.inventory',
        'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
        'https://api.ebay.com/oauth/api_scope/sell.marketplace.insights.readonly',
        'https://api.ebay.com/oauth/api_scope/commerce.catalog.readonly',
        'https://api.ebay.com/oauth/api_scope/sell.marketing',
        'https://api.ebay.com/oauth/api_scope/sell.marketing.readonly',
      ]);
      expect(requirement?.minimumScope).toBe(
        'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
      );
    });

    it.each([
      'ebay_developer_key_management_get_signing_keys',
      'ebay_developer_key_management_create_signing_key',
      'ebay_developer_key_management_get_signing_key',
    ])('returns the public-data scope for hierarchical %s', (signingKeyToolName) => {
      const requirement = getRequiredScopesForTool(signingKeyToolName);

      expect(requirement?.requiredScopes).toEqual(['https://api.ebay.com/oauth/api_scope']);
      expect(requirement?.minimumScope).toBe('https://api.ebay.com/oauth/api_scope');
    });

    it('returns the inventory scope for listing recommendations', () => {
      const requirement = getRequiredScopesForTool(
        'ebay_sell_recommendation_find_listing_recommendations',
      );

      expect(requirement).toBeDefined();
      expect(requirement?.requiredScopes).toEqual([
        'https://api.ebay.com/oauth/api_scope/sell.inventory',
      ]);
      expect(requirement?.minimumScope).toBe('https://api.ebay.com/oauth/api_scope/sell.inventory');
    });

    it('returns the public-data scope for listing translation', () => {
      const requirement = getRequiredScopesForTool('ebay_commerce_translation_translate');

      expect(requirement).toBeDefined();
      expect(requirement?.requiredScopes).toEqual(['https://api.ebay.com/oauth/api_scope']);
      expect(requirement?.minimumScope).toBe('https://api.ebay.com/oauth/api_scope');
    });

    it('returns the identity scope for the hierarchical user-profile tool', () => {
      const requirement = getRequiredScopesForTool('ebay_commerce_identity_get_user');

      expect(requirement).toBeDefined();
      expect(requirement?.requiredScopes).toEqual([
        'https://api.ebay.com/oauth/api_scope/commerce.identity.readonly',
      ]);
      expect(requirement?.minimumScope).toBe(
        'https://api.ebay.com/oauth/api_scope/commerce.identity.readonly',
      );
    });

    it('returns the readonly feedback scope for rating summaries', () => {
      const requirement = getRequiredScopesForTool(
        'ebay_commerce_feedback_get_feedback_rating_summary',
      );

      expect(requirement?.requiredScopes).toEqual([
        'https://api.ebay.com/oauth/api_scope/commerce.feedback.readonly',
      ]);
      expect(requirement?.minimumScope).toBe(
        'https://api.ebay.com/oauth/api_scope/commerce.feedback.readonly',
      );
    });

    it('returns the feedback scope for line items awaiting feedback', () => {
      const requirement = getRequiredScopesForTool(
        'ebay_commerce_feedback_get_items_awaiting_feedback',
      );

      expect(requirement?.requiredScopes).toEqual([
        'https://api.ebay.com/oauth/api_scope/commerce.feedback',
      ]);
      expect(requirement?.minimumScope).toBe(
        'https://api.ebay.com/oauth/api_scope/commerce.feedback',
      );
    });

    it('returns both accepted scopes for feedback lookup', () => {
      const requirement = getRequiredScopesForTool('ebay_commerce_feedback_get_feedback');

      expect(requirement?.requiredScopes).toEqual([
        'https://api.ebay.com/oauth/api_scope/commerce.feedback.readonly',
        'https://api.ebay.com/oauth/api_scope/commerce.feedback',
      ]);
      expect(requirement?.minimumScope).toBe(
        'https://api.ebay.com/oauth/api_scope/commerce.feedback.readonly',
      );
    });

    it('returns the write scope for feedback submission', () => {
      const requirement = getRequiredScopesForTool('ebay_commerce_feedback_leave_feedback');

      expect(requirement?.requiredScopes).toEqual([
        'https://api.ebay.com/oauth/api_scope/commerce.feedback',
      ]);
      expect(requirement?.minimumScope).toBe(
        'https://api.ebay.com/oauth/api_scope/commerce.feedback',
      );
    });

    it('returns the write scope for feedback replies', () => {
      const requirement = getRequiredScopesForTool('ebay_commerce_feedback_respond_to_feedback');

      expect(requirement?.requiredScopes).toEqual([
        'https://api.ebay.com/oauth/api_scope/commerce.feedback',
      ]);
      expect(requirement?.minimumScope).toBe(
        'https://api.ebay.com/oauth/api_scope/commerce.feedback',
      );
    });

    it.each([
      'ebay_commerce_message_get_conversations',
      'ebay_commerce_message_get_conversation',
      'ebay_commerce_message_send_message',
      'ebay_commerce_message_update_conversation',
      'ebay_commerce_message_bulk_update_conversation',
    ])('returns the production message scope for %s', (toolName) => {
      const requirement = getRequiredScopesForTool(toolName);

      expect(requirement?.requiredScopes).toEqual([
        'https://api.ebay.com/oauth/api_scope/commerce.message',
      ]);
      expect(requirement?.minimumScope).toBe(
        'https://api.ebay.com/oauth/api_scope/commerce.message',
      );
    });

    it.each([
      'ebay_commerce_notification_get_config',
      'ebay_commerce_notification_update_config',
      'ebay_commerce_notification_get_destinations',
      'ebay_commerce_notification_create_destination',
      'ebay_commerce_notification_get_destination',
      'ebay_commerce_notification_update_destination',
      'ebay_commerce_notification_delete_destination',
      'ebay_commerce_notification_get_public_key',
      'ebay_commerce_notification_get_topic',
      'ebay_commerce_notification_get_topics',
    ])('returns the public API scope for %s', (notificationToolName) => {
      const requirement = getRequiredScopesForTool(notificationToolName);

      expect(requirement?.requiredScopes).toEqual(['https://api.ebay.com/oauth/api_scope']);
      expect(requirement?.minimumScope).toBe('https://api.ebay.com/oauth/api_scope');
    });

    it.each([
      'ebay_commerce_notification_get_subscriptions',
      'ebay_commerce_notification_get_subscription',
      'ebay_commerce_notification_get_subscription_filter',
    ])('returns both subscription read scopes for %s', (subscriptionReadToolName) => {
      const requirement = getRequiredScopesForTool(subscriptionReadToolName);

      expect(requirement?.requiredScopes).toEqual([
        'https://api.ebay.com/oauth/api_scope/commerce.notification.subscription.readonly',
        'https://api.ebay.com/oauth/api_scope/commerce.notification.subscription',
      ]);
      expect(requirement?.minimumScope).toBe(
        'https://api.ebay.com/oauth/api_scope/commerce.notification.subscription.readonly',
      );
    });

    it.each([
      'ebay_commerce_notification_create_subscription',
      'ebay_commerce_notification_update_subscription',
      'ebay_commerce_notification_delete_subscription',
      'ebay_commerce_notification_disable_subscription',
      'ebay_commerce_notification_enable_subscription',
      'ebay_commerce_notification_test_subscription',
      'ebay_commerce_notification_create_subscription_filter',
      'ebay_commerce_notification_delete_subscription_filter',
    ])('returns the subscription write scope for %s', (subscriptionWriteToolName) => {
      const requirement = getRequiredScopesForTool(subscriptionWriteToolName);

      expect(requirement?.requiredScopes).toEqual([
        'https://api.ebay.com/oauth/api_scope/commerce.notification.subscription',
      ]);
      expect(requirement?.minimumScope).toBe(
        'https://api.ebay.com/oauth/api_scope/commerce.notification.subscription',
      );
    });

    it.each([
      'ebay_commerce_taxonomy_get_default_category_tree_id',
      'ebay_commerce_taxonomy_get_category_tree',
      'ebay_commerce_taxonomy_get_category_suggestions',
    ])('returns the public API scope for %s', (taxonomyLookupToolName) => {
      const requirement = getRequiredScopesForTool(taxonomyLookupToolName);

      expect(requirement?.requiredScopes).toEqual(['https://api.ebay.com/oauth/api_scope']);
      expect(requirement?.minimumScope).toBe('https://api.ebay.com/oauth/api_scope');
    });

    it('returns the metadata insights scope for category aspects', () => {
      const requirement = getRequiredScopesForTool(
        'ebay_commerce_taxonomy_get_item_aspects_for_category',
      );

      expect(requirement?.requiredScopes).toEqual([
        'https://api.ebay.com/oauth/api_scope/metadata.insights',
      ]);
      expect(requirement?.minimumScope).toBe(
        'https://api.ebay.com/oauth/api_scope/metadata.insights',
      );
    });

    it('returns the readonly inventory scope for eligible seller-offer listings', () => {
      const requirement = getRequiredScopesForTool('ebay_sell_negotiation_find_eligible_items');

      expect(requirement?.requiredScopes).toEqual([
        'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
        'https://api.ebay.com/oauth/api_scope/sell.inventory',
      ]);
      expect(requirement?.minimumScope).toBe(
        'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
      );
    });

    it('returns the inventory write scope for sending a seller offer', () => {
      const requirement = getRequiredScopesForTool(
        'ebay_sell_negotiation_send_offer_to_interested_buyers',
      );

      expect(requirement?.requiredScopes).toEqual([
        'https://api.ebay.com/oauth/api_scope/sell.inventory',
      ]);
      expect(requirement?.minimumScope).toBe('https://api.ebay.com/oauth/api_scope/sell.inventory');
    });

    it('return scopes for create/write operations', () => {
      const requirement = getRequiredScopesForTool('ebay_create_or_replace_inventory_item');

      expect(requirement).toBeDefined();
      expect(requirement?.requiredScopes).toEqual([
        'https://api.ebay.com/oauth/api_scope/sell.inventory',
      ]);
      expect(requirement?.minimumScope).toBe('https://api.ebay.com/oauth/api_scope/sell.inventory');
    });

    it('return null for unknown tools', () => {
      const requirement = getRequiredScopesForTool('ebay_unknown_tool');
      expect(requirement).toBeNull();
    });

    it('include optional scopes when applicable', () => {
      const requirement = getRequiredScopesForTool('ebay_publish_offer');

      expect(requirement).toBeDefined();
      expect(requirement?.optionalScopes).toBeDefined();
      expect(requirement?.optionalScopes).toContain(
        'https://api.ebay.com/oauth/api_scope/sell.account',
      );
    });
  });

  describe('hasRequiredScopes', () => {
    it('return true when token has required scope', () => {
      const tokenScopes = [
        'https://api.ebay.com/oauth/api_scope/sell.inventory',
        'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
      ];

      const result = hasRequiredScopes(tokenScopes, [
        'https://api.ebay.com/oauth/api_scope/sell.inventory',
      ]);

      expect(result).toBe(true);
    });

    it('return true when token has one of multiple required scopes', () => {
      const tokenScopes = ['https://api.ebay.com/oauth/api_scope/sell.inventory.readonly'];

      const result = hasRequiredScopes(tokenScopes, [
        'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
        'https://api.ebay.com/oauth/api_scope/sell.inventory',
      ]);

      expect(result).toBe(true);
    });

    it('return false when token lacks required scopes', () => {
      const tokenScopes = ['https://api.ebay.com/oauth/api_scope/sell.inventory'];

      const result = hasRequiredScopes(tokenScopes, [
        'https://api.ebay.com/oauth/api_scope/sell.fulfillment',
      ]);

      expect(result).toBe(false);
    });

    it('handle empty token scopes', () => {
      const result = hasRequiredScopes([], ['https://api.ebay.com/oauth/api_scope/sell.inventory']);

      expect(result).toBe(false);
    });
  });

  describe('getScopeDifferences', () => {
    it('identify scopes in both environments', () => {
      const diff = getScopeDifferences();

      expect(diff.inBothEnvironments).toBeDefined();
      expect(diff.productionOnly).toBeDefined();
      expect(diff.sandboxOnly).toBeDefined();

      // Sell inventory exists in both environments.
      expect(diff.inBothEnvironments).toContain(
        'https://api.ebay.com/oauth/api_scope/sell.inventory',
      );
    });

    it('identify production-only scopes', () => {
      const diff = getScopeDifferences();

      // commerce.message is production-only
      if (diff.productionOnly.length > 0) {
        expect(diff.productionOnly).toBeDefined();
      }
    });

    it('identify sandbox-only scopes', () => {
      const diff = getScopeDifferences();

      // buy.* scopes are typically sandbox-only
      if (diff.sandboxOnly.length > 0) {
        expect(diff.sandboxOnly).toBeDefined();
      }
    });
  });

  describe('formatScopeForDisplay', () => {
    it('remove common eBay prefix', () => {
      const formatted = formatScopeForDisplay(
        'https://api.ebay.com/oauth/api_scope/sell.inventory',
      );

      expect(formatted).toBe('api_scope/sell.inventory');
    });

    it('return scope as-is if no prefix', () => {
      const formatted = formatScopeForDisplay('custom:scope');

      expect(formatted).toBe('custom:scope');
    });
  });

  describe('groupScopesByCategory', () => {
    it('group scopes by category', () => {
      const scopes = [
        'https://api.ebay.com/oauth/api_scope/sell.inventory',
        'https://api.ebay.com/oauth/api_scope/buy.order.readonly',
        'https://api.ebay.com/oauth/api_scope/commerce.identity.readonly',
        'custom:scope',
      ];

      const grouped = groupScopesByCategory(scopes);

      expect(grouped.sell).toContain('https://api.ebay.com/oauth/api_scope/sell.inventory');
      expect(grouped.buy).toContain('https://api.ebay.com/oauth/api_scope/buy.order.readonly');
      expect(grouped.commerce).toContain(
        'https://api.ebay.com/oauth/api_scope/commerce.identity.readonly',
      );
      expect(grouped.other).toContain('custom:scope');
    });

    it('handle empty array', () => {
      const grouped = groupScopesByCategory([]);

      expect(grouped.sell).toHaveLength(0);
      expect(grouped.buy).toHaveLength(0);
      expect(grouped.commerce).toHaveLength(0);
      expect(grouped.other).toHaveLength(0);
    });
  });

  describe('isScopeReadonly', () => {
    it('identify readonly scopes', () => {
      expect(isScopeReadonly('https://api.ebay.com/oauth/api_scope/sell.inventory.readonly')).toBe(
        true,
      );
      expect(
        isScopeReadonly('https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly'),
      ).toBe(true);
    });

    it('identify write scopes', () => {
      expect(isScopeReadonly('https://api.ebay.com/oauth/api_scope/sell.inventory')).toBe(false);
      expect(isScopeReadonly('https://api.ebay.com/oauth/api_scope/sell.fulfillment')).toBe(false);
    });
  });

  describe('getWriteScope', () => {
    it('convert readonly scope to write scope', () => {
      const writeScope = getWriteScope(
        'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
      );

      expect(writeScope).toBe('https://api.ebay.com/oauth/api_scope/sell.inventory');
    });

    it('return null for write scope', () => {
      const writeScope = getWriteScope('https://api.ebay.com/oauth/api_scope/sell.inventory');

      expect(writeScope).toBeNull();
    });
  });

  describe('getReadonlyScope', () => {
    it('convert write scope to readonly scope', () => {
      const readonlyScope = getReadonlyScope('https://api.ebay.com/oauth/api_scope/sell.inventory');

      expect(readonlyScope).toBe('https://api.ebay.com/oauth/api_scope/sell.inventory.readonly');
    });

    it('return null for readonly scope', () => {
      const readonlyScope = getReadonlyScope(
        'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
      );

      expect(readonlyScope).toBeNull();
    });

    it('return null for scopes without readonly equivalent', () => {
      const readonlyScope = getReadonlyScope('https://api.ebay.com/oauth/api_scope/sell.edelivery');

      expect(readonlyScope).toBeNull();
    });
  });

  describe('getScopeTypeDescription', () => {
    it('return description for known scopes', () => {
      expect(getScopeTypeDescription('https://api.ebay.com/oauth/api_scope/sell.inventory')).toBe(
        'View and manage your inventory and offers',
      );

      expect(
        getScopeTypeDescription('https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly'),
      ).toBe('View your order fulfillments');

      expect(
        getScopeTypeDescription('https://api.ebay.com/oauth/api_scope/commerce.identity.readonly'),
      ).toBe('View basic user information from eBay account');
    });

    it('return generic description for unknown scopes', () => {
      const description = getScopeTypeDescription(
        'https://api.ebay.com/oauth/api_scope/unknown.scope',
      );

      expect(description).toBe('Access to unknown.scope');
    });
  });
});
