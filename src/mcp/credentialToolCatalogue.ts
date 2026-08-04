import {
  clearTokensTool,
  convertDateToTimestampTool,
  displayCredentialsTool,
  exchangeAuthorizationCodeTool,
  getOAuthUrlTool,
  getTokenStatusTool,
  refreshAccessTokenTool,
  setUserTokensTool,
  setUserTokensWithExpiryTool,
  validateTokenExpiryTool,
} from '@/auth/tokenManagement/tokenManagement.js';
import type { CredentialTool } from '@/mcp/defineCredentialTool.js';

/**
 * Explicit catalogue of credential and local token-management MCP tools.
 *
 * Each tool is imported by name; the array order is the registration order.
 */
export const credentialToolCatalogue: readonly CredentialTool[] = [
  getOAuthUrlTool,
  setUserTokensTool,
  setUserTokensWithExpiryTool,
  getTokenStatusTool,
  clearTokensTool,
  validateTokenExpiryTool,
  convertDateToTimestampTool,
  displayCredentialsTool,
  refreshAccessTokenTool,
  exchangeAuthorizationCodeTool,
];
