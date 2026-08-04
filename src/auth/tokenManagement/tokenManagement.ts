import { z } from 'zod';
import { Effect } from 'effect';

import type { EbaySellerApi } from '@/api/index.js';
import { buildCredentialDisplay, maskToken } from '@/auth/credentialSession.js';
import { getOAuthAuthorizationUrl, validateScopes } from '@/config/environment.js';
import type { CredentialToolCompletion } from '@/mcp/credentialToolCompletion.js';
import { defineCredentialTool } from '@/mcp/defineCredentialTool.js';
import { convertToTimestamp, validateTokenExpiry } from '@/utils/dateConverter.js';
import { getErrorMessage } from '@/utils/errors.js';

const TOKEN_MANAGEMENT_NAMESPACE = 'token-management';

const MISSING_CLIENT_ID_MESSAGE =
  'EBAY_CLIENT_ID environment variable is required to generate OAuth URL';

const MISSING_REDIRECT_URI_MESSAGE =
  'Redirect URI is required. Either provide it as a parameter or set EBAY_REDIRECT_URI in your .env file.';

const MISSING_USER_TOKENS_MESSAGE =
  'No user tokens available. Please set user tokens first using ebay_set_user_tokens_with_expiry or add EBAY_USER_REFRESH_TOKEN to your .env file.';

/** Exact MCP arguments accepted by ebay_get_oauth_url. */
export const oauthUrlArgumentsSchema = z
  .object({
    redirectUri: z
      .string()
      .optional()
      .describe(
        'Optional redirect URI registered with your eBay application (RuName). If not provided, will use EBAY_REDIRECT_URI from .env file.',
      ),
    scopes: z
      .array(z.string())
      .optional()
      .describe(
        'Optional array of OAuth scopes. If not provided, uses environment-specific default scopes (production or sandbox based on EBAY_ENVIRONMENT). Custom scopes will be validated against the environment.',
      ),
    state: z.string().optional().describe('Optional state parameter for CSRF protection'),
  })
  .strict();

/** Exact MCP arguments accepted by ebay_set_user_tokens. */
export const setUserTokensArgumentsSchema = z
  .object({
    accessToken: z.string().min(1).describe('The user access token obtained from OAuth flow'),
    refreshToken: z.string().min(1).describe('The refresh token obtained from OAuth flow'),
  })
  .strict();

/** Exact MCP arguments accepted by ebay_set_user_tokens_with_expiry. */
export const setUserTokensWithExpiryArgumentsSchema = z
  .object({
    accessToken: z.string().min(1).describe('eBay user access token'),
    refreshToken: z.string().min(1).describe('eBay user refresh token'),
    accessTokenExpiry: z
      .union([z.string(), z.number()])
      .optional()
      .describe(
        'Optional access-token expiry. Supports ISO date strings, Unix timestamps, and relative time.',
      ),
    refreshTokenExpiry: z
      .union([z.string(), z.number()])
      .optional()
      .describe(
        'Optional refresh-token expiry. Supports ISO date strings, Unix timestamps, and relative time.',
      ),
    autoRefresh: z
      .boolean()
      .optional()
      .default(true)
      .describe('Whether to validate and refresh the access token immediately'),
  })
  .strict();

/** Exact MCP arguments accepted by no-argument token tools. */
export const emptyTokenArgumentsSchema = z.object({}).strict();

/** Exact MCP arguments accepted by ebay_validate_token_expiry. */
export const validateTokenExpiryArgumentsSchema = z
  .object({
    accessTokenExpiry: z
      .union([z.string(), z.number()])
      .describe('Access token expiry as an ISO date string, Unix timestamp, or relative time'),
    refreshTokenExpiry: z
      .union([z.string(), z.number()])
      .describe('Refresh token expiry as an ISO date string, Unix timestamp, or relative time'),
  })
  .strict();

/** Exact MCP arguments accepted by ebay_convert_date_to_timestamp. */
export const convertDateToTimestampArgumentsSchema = z
  .object({
    dateInput: z
      .union([z.string(), z.number()])
      .describe('Date to convert as an ISO date string, Unix timestamp, or relative time'),
  })
  .strict();

/** Exact MCP arguments accepted by ebay_exchange_authorization_code. */
export const exchangeAuthorizationCodeArgumentsSchema = z
  .object({
    code: z
      .string()
      .min(1)
      .describe('The authorization code received from eBay after user authorization'),
  })
  .strict();

export type OAuthUrlArguments = z.infer<typeof oauthUrlArgumentsSchema>;
export type SetUserTokensArguments = z.infer<typeof setUserTokensArgumentsSchema>;
export type SetUserTokensWithExpiryArguments = z.infer<
  typeof setUserTokensWithExpiryArgumentsSchema
>;
export type ValidateTokenExpiryArguments = z.infer<typeof validateTokenExpiryArgumentsSchema>;
export type ConvertDateToTimestampArguments = z.infer<typeof convertDateToTimestampArgumentsSchema>;
export type ExchangeAuthorizationCodeArguments = z.infer<
  typeof exchangeAuthorizationCodeArgumentsSchema
>;

type TimestampParseCompletion =
  | { readonly kind: 'timestampParsed'; readonly timestamp: number }
  | { readonly kind: 'timestampParseFailed'; readonly failureMessage: string };

const credentialRejected = (
  failureMessage: string,
): Extract<CredentialToolCompletion<never>, { kind: 'credentialToolFailed' }> => ({
  kind: 'credentialToolFailed',
  failure: {
    kind: 'credentialToolRejected',
    message: failureMessage,
  },
});

const credentialSucceeded = <Document>(
  document: Document,
): Extract<CredentialToolCompletion<Document>, { kind: 'credentialToolSucceeded' }> => ({
  kind: 'credentialToolSucceeded',
  document,
});

const failureMessageFromCause = (prefix: string, thrownFailure: unknown): string =>
  `${prefix}: ${getErrorMessage(thrownFailure, String(thrownFailure))}`;

const parseTimestamp = async (dateInput: string | number): Promise<TimestampParseCompletion> => {
  try {
    const timestamp = await Effect.runPromise(convertToTimestamp(dateInput));
    return { kind: 'timestampParsed', timestamp };
  } catch (thrownFailure) {
    return {
      kind: 'timestampParseFailed',
      failureMessage: getErrorMessage(thrownFailure, String(thrownFailure)),
    };
  }
};

const optionalExpiryTimestamp = async (
  dateInput: string | number | undefined,
  failurePrefix: string,
): Promise<
  | { readonly kind: 'expiryReady'; readonly timestamp: number | undefined }
  | { readonly kind: 'expiryFailed'; readonly failureMessage: string }
> => {
  if (dateInput === undefined) {
    return { kind: 'expiryReady', timestamp: undefined };
  }
  const parseCompletion = await parseTimestamp(dateInput);
  if (parseCompletion.kind === 'timestampParseFailed') {
    return {
      kind: 'expiryFailed',
      failureMessage: `${failurePrefix}: ${parseCompletion.failureMessage}`,
    };
  }
  return { kind: 'expiryReady', timestamp: parseCompletion.timestamp };
};

const currentTokenTypeLabel = (tokenInfo: {
  readonly hasUserToken: boolean;
  readonly hasAppAccessToken: boolean;
}): string => {
  if (tokenInfo.hasUserToken) {
    return 'user_token (10,000-50,000 req/day)';
  }
  if (tokenInfo.hasAppAccessToken) {
    return 'app_access_token (1,000 req/day)';
  }
  return 'none';
};

const maskedUserAccessToken = (userAccessToken: string | undefined): string | null => {
  if (userAccessToken === undefined) {
    return null;
  }
  return maskToken(userAccessToken);
};

const accessTokenExpiryDocument = (userAccessTokenExpiry: number | undefined) => {
  if (userAccessTokenExpiry === undefined) {
    return null;
  }
  return {
    timestamp: userAccessTokenExpiry,
    date: new Date(userAccessTokenExpiry).toISOString(),
    expiresInSeconds: Math.floor((userAccessTokenExpiry - Date.now()) / 1000),
  };
};

const decodeAuthorizationCode = (code: string): string | CredentialToolCompletion<never> => {
  if (!code.includes('%')) {
    return code;
  }
  try {
    return decodeURIComponent(code);
  } catch (thrownFailure) {
    return credentialRejected(
      failureMessageFromCause('Failed to exchange authorization code', thrownFailure),
    );
  }
};

const redirectUriForOAuth = (
  providedRedirectUri: string | undefined,
  configuredRedirectUri: string | undefined,
): string | undefined => {
  if (providedRedirectUri !== undefined && providedRedirectUri !== '') {
    return providedRedirectUri;
  }
  if (configuredRedirectUri !== undefined && configuredRedirectUri !== '') {
    return configuredRedirectUri;
  }
};

/**
 * Generate the eBay OAuth authorization URL for user consent.
 *
 * @param ebaySellerApi - Seller API facade carrying runtime configuration.
 * @param oauthUrlArguments - Optional redirect URI, scopes, and CSRF state.
 * @returns Authorization URL document or a credential rejection.
 */
export const getOAuthUrl = async (
  ebaySellerApi: EbaySellerApi,
  oauthUrlArguments: OAuthUrlArguments,
): Promise<CredentialToolCompletion<Record<string, unknown>>> => {
  const ebayConfig = ebaySellerApi.getConfig();
  if (ebayConfig.clientId === undefined || ebayConfig.clientId === '') {
    return credentialRejected(MISSING_CLIENT_ID_MESSAGE);
  }

  const redirectUri = redirectUriForOAuth(oauthUrlArguments.redirectUri, ebayConfig.redirectUri);
  if (redirectUri === undefined) {
    return credentialRejected(MISSING_REDIRECT_URI_MESSAGE);
  }

  const requestedScopes = oauthUrlArguments.scopes;
  if (requestedScopes !== undefined && requestedScopes.length > 0) {
    const scopeValidation = validateScopes(requestedScopes, ebayConfig.environment);
    const authorizationUrl = getOAuthAuthorizationUrl(
      ebayConfig.clientId,
      redirectUri,
      ebayConfig.environment,
      scopeValidation.validScopes,
      oauthUrlArguments.state,
    );
    const oauthUrlDocument: Record<string, unknown> = {
      authorizationUrl,
      redirectUri,
      instructions:
        'Open this URL in a browser to authorize the application. After authorization, you will be redirected to your redirect URI with an authorization code that can be exchanged for an access token.',
      environment: ebayConfig.environment,
      scopes: requestedScopes,
    };
    if (scopeValidation.warnings.length > 0) {
      oauthUrlDocument.warnings = scopeValidation.warnings;
    }
    return credentialSucceeded(oauthUrlDocument);
  }

  const authorizationUrl = getOAuthAuthorizationUrl(
    ebayConfig.clientId,
    redirectUri,
    ebayConfig.environment,
    undefined,
    oauthUrlArguments.state,
  );
  return credentialSucceeded({
    authorizationUrl,
    redirectUri,
    instructions:
      'Open this URL in a browser to authorize the application. After authorization, you will be redirected to your redirect URI with an authorization code that can be exchanged for an access token.',
    environment: ebayConfig.environment,
    scopes: 'default (all Sell API scopes)',
  });
};

/**
 * Store user access and refresh tokens for authenticated API requests.
 *
 * @param ebaySellerApi - Seller API facade that owns token storage.
 * @param setUserTokensArguments - Access and refresh tokens from the OAuth flow.
 * @returns Storage confirmation or a credential rejection.
 */
export const setUserTokens = async (
  ebaySellerApi: EbaySellerApi,
  setUserTokensArguments: SetUserTokensArguments,
): Promise<CredentialToolCompletion<Record<string, unknown>>> => {
  try {
    await Effect.runPromise(
      ebaySellerApi.setUserTokens(
        setUserTokensArguments.accessToken,
        setUserTokensArguments.refreshToken,
      ),
    );
  } catch (thrownFailure) {
    return credentialRejected(failureMessageFromCause('Failed to set user tokens', thrownFailure));
  }

  return credentialSucceeded({
    success: true,
    message:
      'User tokens successfully stored. These tokens will be used for all subsequent API requests and will be automatically refreshed when needed.',
    tokenInfo: ebaySellerApi.getTokenInfo(),
  });
};

/**
 * Store user tokens with optional custom expiry timestamps and optional auto-refresh.
 *
 * @param ebaySellerApi - Seller API facade that owns token storage.
 * @param setUserTokensWithExpiryArguments - Tokens, optional expiries, and auto-refresh flag.
 * @returns Storage confirmation or a credential rejection.
 */
export const setUserTokensWithExpiry = async (
  ebaySellerApi: EbaySellerApi,
  setUserTokensWithExpiryArguments: SetUserTokensWithExpiryArguments,
): Promise<CredentialToolCompletion<Record<string, unknown>>> => {
  const accessExpiryCompletion = await optionalExpiryTimestamp(
    setUserTokensWithExpiryArguments.accessTokenExpiry,
    'Failed to set user tokens',
  );
  if (accessExpiryCompletion.kind === 'expiryFailed') {
    return credentialRejected(accessExpiryCompletion.failureMessage);
  }

  const refreshExpiryCompletion = await optionalExpiryTimestamp(
    setUserTokensWithExpiryArguments.refreshTokenExpiry,
    'Failed to set user tokens',
  );
  if (refreshExpiryCompletion.kind === 'expiryFailed') {
    return credentialRejected(refreshExpiryCompletion.failureMessage);
  }

  try {
    await Effect.runPromise(
      ebaySellerApi.setUserTokens(
        setUserTokensWithExpiryArguments.accessToken,
        setUserTokensWithExpiryArguments.refreshToken,
        accessExpiryCompletion.timestamp,
        refreshExpiryCompletion.timestamp,
      ),
    );
  } catch (thrownFailure) {
    return credentialRejected(failureMessageFromCause('Failed to set user tokens', thrownFailure));
  }

  if (!setUserTokensWithExpiryArguments.autoRefresh) {
    return credentialSucceeded({
      success: true,
      message:
        'User tokens successfully stored in memory. These tokens will be used for all subsequent API requests and will be automatically refreshed when needed. To persist tokens, update EBAY_USER_REFRESH_TOKEN in .env file.',
      tokenInfo: ebaySellerApi.getTokenInfo(),
      refreshed: false,
    });
  }

  try {
    await Effect.runPromise(ebaySellerApi.getAuthClient().getOAuthClient().getAccessToken());
    return credentialSucceeded({
      success: true,
      message:
        'User tokens stored successfully in memory. Access token validated and refreshed if needed. To persist tokens, update EBAY_USER_REFRESH_TOKEN in .env file.',
      tokenInfo: ebaySellerApi.getTokenInfo(),
      refreshed: true,
    });
  } catch (thrownFailure) {
    return credentialSucceeded({
      success: true,
      message:
        'User tokens stored, but failed to validate/refresh access token. You may need to re-authorize.',
      tokenInfo: ebaySellerApi.getTokenInfo(),
      refreshed: false,
      refreshError: getErrorMessage(thrownFailure),
    });
  }
};

/**
 * Report whether user tokens or client credentials are currently in use.
 *
 * @param ebaySellerApi - Seller API facade that owns token status.
 * @returns Token status document.
 */
export const getTokenStatus = async (
  ebaySellerApi: EbaySellerApi,
): Promise<CredentialToolCompletion<Record<string, unknown>>> => {
  const tokenInfo = ebaySellerApi.getTokenInfo();
  const hasUserTokens = ebaySellerApi.hasUserTokens();
  if (hasUserTokens) {
    return credentialSucceeded({
      hasUserToken: tokenInfo.hasUserToken,
      hasAppAccessToken: tokenInfo.hasAppAccessToken,
      authenticated: ebaySellerApi.isAuthenticated(),
      currentTokenType: currentTokenTypeLabel(tokenInfo),
      message: 'Using user access token with automatic refresh',
    });
  }
  return credentialSucceeded({
    hasUserToken: tokenInfo.hasUserToken,
    hasAppAccessToken: tokenInfo.hasAppAccessToken,
    authenticated: ebaySellerApi.isAuthenticated(),
    currentTokenType: currentTokenTypeLabel(tokenInfo),
    message:
      'Using app access token from client credentials flow (lower rate limits). Consider setting user tokens for higher rate limits.',
  });
};

/**
 * Clear all stored OAuth tokens from the in-memory OAuth client.
 *
 * @param ebaySellerApi - Seller API facade that owns the OAuth client.
 * @returns Clear confirmation document.
 */
export const clearTokens = async (
  ebaySellerApi: EbaySellerApi,
): Promise<CredentialToolCompletion<Record<string, unknown>>> => {
  const oauthClient = ebaySellerApi.getAuthClient().getOAuthClient();
  oauthClient.clearAllTokens();
  return credentialSucceeded({
    success: true,
    message:
      'All tokens cleared successfully. You will need to re-authenticate for subsequent API calls.',
  });
};

/**
 * Validate access and refresh token expiry values and return renewal guidance.
 *
 * @param _ebaySellerApi - Unused seller API facade (credential tools share one signature).
 * @param validateTokenExpiryArguments - Access and refresh token expiry inputs.
 * @returns Validation document or a credential rejection.
 */
export const validateTokenExpiryTimes = async (
  _ebaySellerApi: EbaySellerApi,
  validateTokenExpiryArguments: ValidateTokenExpiryArguments,
): Promise<CredentialToolCompletion<Record<string, unknown>>> => {
  const accessParseCompletion = await parseTimestamp(
    validateTokenExpiryArguments.accessTokenExpiry,
  );
  if (accessParseCompletion.kind === 'timestampParseFailed') {
    return credentialRejected(
      `Failed to validate token expiry: ${accessParseCompletion.failureMessage}`,
    );
  }

  const refreshParseCompletion = await parseTimestamp(
    validateTokenExpiryArguments.refreshTokenExpiry,
  );
  if (refreshParseCompletion.kind === 'timestampParseFailed') {
    return credentialRejected(
      `Failed to validate token expiry: ${refreshParseCompletion.failureMessage}`,
    );
  }

  const accessExpiry = accessParseCompletion.timestamp;
  const refreshExpiry = refreshParseCompletion.timestamp;
  const validation = validateTokenExpiry(accessExpiry, refreshExpiry);
  return credentialSucceeded({
    ...validation,
    accessTokenExpiryTimestamp: accessExpiry,
    refreshTokenExpiryTimestamp: refreshExpiry,
    accessTokenExpiryDate: new Date(accessExpiry).toISOString(),
    refreshTokenExpiryDate: new Date(refreshExpiry).toISOString(),
  });
};

/**
 * Convert a date string, number, or relative time phrase into a Unix millisecond timestamp.
 *
 * @param _ebaySellerApi - Unused seller API facade (credential tools share one signature).
 * @param convertDateToTimestampArguments - Date input to convert.
 * @returns Conversion document or a credential rejection.
 */
export const convertDateToTimestamp = async (
  _ebaySellerApi: EbaySellerApi,
  convertDateToTimestampArguments: ConvertDateToTimestampArguments,
): Promise<CredentialToolCompletion<Record<string, unknown>>> => {
  const { dateInput } = convertDateToTimestampArguments;
  const parseCompletion = await parseTimestamp(dateInput);
  if (parseCompletion.kind === 'timestampParseFailed') {
    return credentialRejected(`Failed to convert date: ${parseCompletion.failureMessage}`);
  }

  const timestamp = parseCompletion.timestamp;
  return credentialSucceeded({
    success: true,
    timestamp,
    input: dateInput,
    formattedDate: new Date(timestamp).toISOString(),
    message: `Successfully converted to timestamp: ${timestamp}ms (${new Date(timestamp).toISOString()})`,
  });
};

/**
 * Display redacted eBay credentials and current token information.
 *
 * @param ebaySellerApi - Seller API facade that owns config and token state.
 * @returns Redacted credential display document.
 */
export const displayCredentials = async (
  ebaySellerApi: EbaySellerApi,
): Promise<CredentialToolCompletion<ReturnType<typeof buildCredentialDisplay>>> => {
  const tokenInfo = ebaySellerApi.getTokenInfo();
  const oauthClient = ebaySellerApi.getAuthClient().getOAuthClient();
  return credentialSucceeded(
    buildCredentialDisplay({
      appAccessToken: oauthClient.getCachedAppAccessToken(),
      appAccessTokenExpiry: oauthClient.getCachedAppAccessTokenExpiry(),
      authenticated: ebaySellerApi.isAuthenticated(),
      config: ebaySellerApi.getConfig(),
      tokenInfo,
      userTokens: oauthClient.getUserTokens(),
    }),
  );
};

/**
 * Manually refresh the user access token using the stored refresh token.
 *
 * @param ebaySellerApi - Seller API facade that owns the OAuth client.
 * @returns Refresh confirmation with a masked access token, or a credential rejection.
 */
export const refreshAccessToken = async (
  ebaySellerApi: EbaySellerApi,
): Promise<CredentialToolCompletion<Record<string, unknown>>> => {
  if (!ebaySellerApi.hasUserTokens()) {
    return credentialRejected(MISSING_USER_TOKENS_MESSAGE);
  }

  const oauthClient = ebaySellerApi.getAuthClient().getOAuthClient();
  try {
    await Effect.runPromise(oauthClient.refreshUserToken());
  } catch (thrownFailure) {
    return credentialRejected(
      failureMessageFromCause('Failed to refresh access token', thrownFailure),
    );
  }

  const internalTokens = oauthClient.getUserTokens();
  if (internalTokens === null) {
    return credentialSucceeded({
      success: true,
      message: 'Access token refreshed successfully',
      accessToken: null,
      accessTokenExpiry: null,
      tokenInfo: ebaySellerApi.getTokenInfo(),
    });
  }

  return credentialSucceeded({
    success: true,
    message: 'Access token refreshed successfully',
    accessToken: maskedUserAccessToken(internalTokens.userAccessToken),
    accessTokenExpiry: accessTokenExpiryDocument(internalTokens.userAccessTokenExpiry),
    tokenInfo: ebaySellerApi.getTokenInfo(),
  });
};

/**
 * Exchange an OAuth authorization code for access and refresh tokens.
 *
 * @param ebaySellerApi - Seller API facade that owns the OAuth client.
 * @param exchangeAuthorizationCodeArguments - Authorization code from the redirect.
 * @returns Token exchange document or a credential rejection.
 */
export const exchangeAuthorizationCode = async (
  ebaySellerApi: EbaySellerApi,
  exchangeAuthorizationCodeArguments: ExchangeAuthorizationCodeArguments,
): Promise<CredentialToolCompletion<Record<string, unknown>>> => {
  const decodedCode = decodeAuthorizationCode(exchangeAuthorizationCodeArguments.code);
  if (typeof decodedCode !== 'string') {
    return decodedCode;
  }

  const oauthClient = ebaySellerApi.getAuthClient().getOAuthClient();
  try {
    const tokenData = await Effect.runPromise(oauthClient.exchangeCodeForToken(decodedCode));
    return credentialSucceeded({
      success: true,
      message:
        'Authorization code successfully exchanged for tokens. Tokens have been stored and will be used for subsequent API requests.',
      tokenData: {
        accessToken: maskToken(tokenData.access_token),
        refreshToken: maskToken(tokenData.refresh_token),
        expiresIn: tokenData.expires_in,
        refreshTokenExpiresIn: tokenData.refresh_token_expires_in,
        tokenType: tokenData.token_type,
        scope: tokenData.scope,
      },
      note: 'The refresh token has been saved to your .env file for future use.',
    });
  } catch (thrownFailure) {
    return credentialRejected(
      failureMessageFromCause('Failed to exchange authorization code', thrownFailure),
    );
  }
};

const GET_OAUTH_URL_DESCRIPTION =
  'Generate the eBay OAuth authorization URL for user consent. The user should open this URL in a browser to grant permissions to the application. This supports the OAuth 2.0 Authorization Code grant flow. The redirect URI can be provided as a parameter or will be read from EBAY_REDIRECT_URI environment variable.\n\n' +
  'IMPORTANT: eBay has different OAuth scopes available for production vs sandbox environments:\n' +
  '- Sandbox includes additional Buy API scopes (e.g., buy.order.readonly, buy.guest.order, buy.shopping.cart) and extended Identity scopes\n' +
  '- Production includes sell.edelivery, commerce.message (explicit), and commerce.shipping scopes not available in sandbox\n' +
  '- If you provide custom scopes, they will be validated against the current environment (set via EBAY_ENVIRONMENT). Any scopes not valid for the environment will generate warnings.\n\n' +
  'OAUTH FLOW INSTRUCTIONS:\n' +
  '1. Generate OAuth URL with this tool (optionally specify scopes)\n' +
  '2. User opens URL in browser, authorizes, and gets redirected with a code parameter\n' +
  '3. Use ebay_exchange_authorization_code tool with the code (URL-encoded format accepted)\n' +
  '4. Tokens are automatically stored and will auto-refresh every 2 hours\n\n' +
  'COMMON SCOPES:\n' +
  '- Basic (always included): https://api.ebay.com/oauth/api_scope\n' +
  '- Inventory: https://api.ebay.com/oauth/api_scope/sell.inventory\n' +
  '- Inventory (readonly): https://api.ebay.com/oauth/api_scope/sell.inventory.readonly\n' +
  '- Account: https://api.ebay.com/oauth/api_scope/sell.account\n' +
  '- Fulfillment: https://api.ebay.com/oauth/api_scope/sell.fulfillment\n\n' +
  'TROUBLESHOOTING:\n' +
  '- Authorization codes expire in ~5 minutes - get fresh code if "invalid grant" error\n' +
  '- "Insufficient permissions" errors mean you need to re-authorize with additional scopes\n' +
  '- OAuth URL format: Use + to separate scopes (e.g., scope=scope1+scope2), not %2B\n' +
  '- Refresh tokens last 18 months and are saved to .env file for persistence';

const EXCHANGE_AUTHORIZATION_CODE_DESCRIPTION =
  'Exchange an OAuth authorization code for access and refresh tokens. This completes the OAuth 2.0 Authorization Code grant flow. After the user authorizes the application using the URL from ebay_get_oauth_url, eBay redirects back with an authorization code in the URL. Use this tool to exchange that code for tokens that can be used to make API calls. The tokens will be automatically stored and used for subsequent API requests.\n\n' +
  'IMPORTANT NOTES:\n' +
  '- Authorization codes expire in ~5 minutes - if you get "invalid grant" error, get a fresh code\n' +
  '- Codes can be URL-encoded (e.g., v%5E1.1%23...) - this tool automatically decodes them\n' +
  '- Extract the code parameter from the redirect URL (your RuName Accept URL): https://your-redirect-uri?code=YOUR_CODE&expires_in=299\n' +
  '- Tokens are saved to .env file and will auto-refresh every 2 hours\n' +
  '- Refresh tokens last 18 months before requiring re-authorization\n\n' +
  'COMMON ERRORS:\n' +
  '- "invalid or was issued to another client": Code expired, get fresh code\n' +
  '- "Insufficient permissions": Re-run OAuth flow with additional scopes in ebay_get_oauth_url\n\n' +
  'For complete OAuth guide with scopes, troubleshooting, and examples, see: docs/auth/OAUTH_QUICK_REFERENCE.md';

/** MCP definition for generating the eBay OAuth consent URL. */
export const getOAuthUrlTool = defineCredentialTool({
  name: 'ebay_get_oauth_url',
  namespace: TOKEN_MANAGEMENT_NAMESPACE,
  description: GET_OAUTH_URL_DESCRIPTION,
  argumentsSchema: oauthUrlArgumentsSchema,
  operationKind: 'read',
  operation: getOAuthUrl,
});

/** MCP definition for storing user access and refresh tokens. */
export const setUserTokensTool = defineCredentialTool({
  name: 'ebay_set_user_tokens',
  namespace: TOKEN_MANAGEMENT_NAMESPACE,
  description:
    'Set the user access token and refresh token for authenticated API requests. These tokens should be obtained through the OAuth authorization code flow. Tokens will be persisted to disk and automatically refreshed when needed. User tokens provide higher rate limits (10,000-50,000 requests/day) compared to client credentials (1,000 requests/day).',
  argumentsSchema: setUserTokensArgumentsSchema,
  operationKind: 'write',
  operation: setUserTokens,
});

/** MCP definition for storing user tokens with custom expiry timestamps. */
export const setUserTokensWithExpiryTool = defineCredentialTool({
  name: 'ebay_set_user_tokens_with_expiry',
  namespace: TOKEN_MANAGEMENT_NAMESPACE,
  description:
    "Set user access and refresh tokens with custom expiry times. This is an enhanced version of ebay_set_user_tokens that accepts expiry times and can automatically refresh the access token if it's expired but the refresh token is valid. Useful when user provides tokens that may already be partially expired.",
  argumentsSchema: setUserTokensWithExpiryArgumentsSchema,
  operationKind: 'write',
  operation: setUserTokensWithExpiry,
});

/** MCP definition for reading current OAuth token status. */
export const getTokenStatusTool = defineCredentialTool({
  name: 'ebay_get_token_status',
  namespace: TOKEN_MANAGEMENT_NAMESPACE,
  description:
    'Check the current OAuth token status. Returns information about whether user tokens or client credentials are being used, and whether tokens are valid.',
  argumentsSchema: emptyTokenArgumentsSchema,
  operationKind: 'read',
  operation: async (ebaySellerApi) => getTokenStatus(ebaySellerApi),
});

/** MCP definition for clearing stored OAuth tokens. */
export const clearTokensTool = defineCredentialTool({
  name: 'ebay_clear_tokens',
  namespace: TOKEN_MANAGEMENT_NAMESPACE,
  description:
    'Clear all stored OAuth tokens (both user tokens and client credentials). This will require re-authentication for subsequent API calls.',
  argumentsSchema: emptyTokenArgumentsSchema,
  operationKind: 'write',
  operation: async (ebaySellerApi) => clearTokens(ebaySellerApi),
});

/** MCP definition for validating token expiry timestamps. */
export const validateTokenExpiryTool = defineCredentialTool({
  name: 'ebay_validate_token_expiry',
  namespace: TOKEN_MANAGEMENT_NAMESPACE,
  description:
    'Validate token expiry times and get recommendations. Checks if access/refresh tokens are expired or expiring soon, and provides actionable recommendations (e.g., refresh access token, re-authorize user).',
  argumentsSchema: validateTokenExpiryArgumentsSchema,
  operationKind: 'read',
  operation: validateTokenExpiryTimes,
});

/** MCP definition for converting date inputs into Unix millisecond timestamps. */
export const convertDateToTimestampTool = defineCredentialTool({
  name: 'ebay_convert_date_to_timestamp',
  namespace: TOKEN_MANAGEMENT_NAMESPACE,
  description:
    'Convert a date string or number to Unix timestamp (milliseconds). Supports ISO 8601 dates, Unix timestamps (seconds or milliseconds), and relative time (e.g., "in 2 hours", "in 7200 seconds"). Useful when setting token expiry times from user input.',
  argumentsSchema: convertDateToTimestampArgumentsSchema,
  operationKind: 'read',
  operation: convertDateToTimestamp,
});

/** MCP definition for displaying redacted credentials and token diagnostics. */
export const displayCredentialsTool = defineCredentialTool({
  name: 'ebay_display_credentials',
  namespace: TOKEN_MANAGEMENT_NAMESPACE,
  description:
    'Display all eBay API credentials and current token information. Shows client ID, client secret (masked), environment (production/sandbox), redirect URI, and current token status including access token (masked), refresh token (masked), app token (masked), and their expiry times. Useful for debugging authentication issues and verifying configuration.',
  argumentsSchema: emptyTokenArgumentsSchema,
  operationKind: 'read',
  operation: async (ebaySellerApi) => displayCredentials(ebaySellerApi),
});

/** MCP definition for manually refreshing the user access token. */
export const refreshAccessTokenTool = defineCredentialTool({
  name: 'ebay_refresh_access_token',
  namespace: TOKEN_MANAGEMENT_NAMESPACE,
  description:
    'Manually refresh the user access token using the stored refresh token. This is useful when you want to proactively refresh an access token before it expires, or when recovering from authentication errors. Requires that user tokens are already set (either via EBAY_USER_REFRESH_TOKEN in .env or via ebay_set_user_tokens_with_expiry). Returns the new access token and expiry time.',
  argumentsSchema: emptyTokenArgumentsSchema,
  operationKind: 'write',
  operation: async (ebaySellerApi) => refreshAccessToken(ebaySellerApi),
});

/** MCP definition for exchanging an authorization code for tokens. */
export const exchangeAuthorizationCodeTool = defineCredentialTool({
  name: 'ebay_exchange_authorization_code',
  namespace: TOKEN_MANAGEMENT_NAMESPACE,
  description: EXCHANGE_AUTHORIZATION_CODE_DESCRIPTION,
  argumentsSchema: exchangeAuthorizationCodeArgumentsSchema,
  operationKind: 'write',
  operation: exchangeAuthorizationCode,
});
