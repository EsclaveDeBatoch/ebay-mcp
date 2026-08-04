import { EbayApiClient } from '@/api/client.js';
import type { EbayOAuthError } from '@/auth/oauth.js';
import type { EbayConfig } from '@/types/ebay.js';
import type { Effect } from 'effect';

/**
 * Main API facade providing access to shared eBay client operations.
 * Migrated eBay resources use EbaySellerSession instead of category facades.
 */
export class EbaySellerApi {
  private client: EbayApiClient;
  private readonly config: EbayConfig;

  constructor(config: EbayConfig) {
    this.config = config;
    this.client = new EbayApiClient(config);
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
