import { EbayApiClient } from '@/api/client.js';
import { createInventoryApi, type InventoryApi } from '@/api/listing-management/inventory.js';
import { MarketingApi } from '@/api/marketing-and-promotions/marketing.js';
import type { EbayOAuthError } from '@/auth/oauth.js';
import type { EbayConfig } from '@/types/ebay.js';
import type { Effect } from 'effect';

/**
 * Main API facade providing access to all eBay APIs
 */
export class EbaySellerApi {
  private client: EbayApiClient;
  private readonly config: EbayConfig;

  // API categories
  public inventory: InventoryApi;
  public marketing: MarketingApi;

  constructor(config: EbayConfig) {
    this.config = config;
    this.client = new EbayApiClient(config);

    // Initialize API category handlers
    this.inventory = createInventoryApi(this.client);
    this.marketing = new MarketingApi(this.client);
  }

  /**
   * Initialize the API (load tokens from storage)
   */
  initialize = (): Effect.Effect<void, EbayOAuthError> => this.client.initialize();

  /**
   * Check if the API client is authenticated
   */
  isAuthenticated(): boolean {
    return this.client.isAuthenticated();
  }

  /**
   * Check if user tokens are available
   */
  hasUserTokens(): boolean {
    return this.client.hasUserTokens();
  }

  /**
   * Set user access and refresh tokens
   */
  setUserTokens = (
    accessToken: string,
    refreshToken: string,
    accessTokenExpiry?: number,
    refreshTokenExpiry?: number,
  ): Effect.Effect<void, EbayOAuthError> =>
    this.client.setUserTokens(accessToken, refreshToken, accessTokenExpiry, refreshTokenExpiry);

  /**
   * Get OAuth client for advanced operations
   */
  getAuthClient(): EbayApiClient {
    return this.client;
  }

  /**
   * Returns the validated runtime configuration used to construct this API facade.
   *
   * @returns eBay API runtime configuration with credentials, environment, and proxy flags.
   *
   * @example
   * ```ts
   * const environment = api.getConfig().environment;
   * ```
   */
  getConfig(): EbayConfig {
    return this.config;
  }

  /**
   * Get token information for debugging
   */
  getTokenInfo() {
    return this.client.getTokenInfo();
  }
}

export * from '@/api/client.js';
export * from '@/api/listing-management/inventory.js';
export * from '@/api/marketing-and-promotions/marketing.js';
