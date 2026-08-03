import type { EbayApiClient } from '@/api/client.js';
import { EbayClientRequestError } from '@/api/clientRequestError.js';
import type { EbayFailure, EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import { getErrorMessage } from '@/utils/errors.js';

/** Query values accepted by the shared eBay HTTP client. */
export type EbaySearchParameters = {
  readonly [wireField: string]: unknown;
};

/** One authenticated GET call issued by an eBay resource operation. */
export type EbayGetCall = {
  readonly endpoint: string;
  readonly searchParameters?: EbaySearchParameters;
};

/** Authenticated seller boundary used by eBay resource operations. */
export type EbaySellerSession = {
  readonly get: <EbayDocument>(
    ebayGetCall: EbayGetCall,
  ) => Promise<EbayRequestCompletion<EbayDocument>>;
};

function classifyEbayFailure(thrownFailure: unknown): EbayFailure {
  if (!(thrownFailure instanceof EbayClientRequestError)) {
    return { kind: 'ebayUnavailable', message: getErrorMessage(thrownFailure) };
  }

  switch (thrownFailure.kind) {
    case 'missingCredentials':
    case 'tokenAcquisition':
    case 'missingAccessToken':
    case 'tokenRefresh':
      return { kind: 'ebayAuthenticationFailed', message: thrownFailure.message };
    case 'localRateLimit':
    case 'remoteRateLimit':
      return { kind: 'ebayRateLimited', message: thrownFailure.message };
    case 'httpStatus': {
      if (thrownFailure.status === undefined) {
        return { kind: 'ebayUnavailable', message: thrownFailure.message };
      }
      if (thrownFailure.status >= 500) {
        return { kind: 'ebayUnavailable', message: thrownFailure.message };
      }
      return {
        kind: 'ebayRequestRejected',
        message: thrownFailure.message,
        status: thrownFailure.status,
      };
    }
    case 'transport':
      return { kind: 'ebayUnavailable', message: thrownFailure.message };
  }
}

/**
 * Gives resource operations an authenticated promise boundary over the current eBay client.
 *
 * The client still owns OAuth, omission, query serialization, retry, and rate-limit policy
 * during the migration. This session converts its thrown failures into the closed completion
 * contract consumed by resources and translated once by MCP.
 *
 * @param ebayApiClient - Authenticated eBay HTTP client owned by the process runtime.
 * @returns Seller session passed explicitly to resource operations.
 *
 * @example
 * ```ts
 * const sellerSession = createEbaySellerSession(api.getAuthClient());
 * ```
 */
export const createEbaySellerSession = (ebayApiClient: EbayApiClient): EbaySellerSession => ({
  get: async <EbayDocument>(ebayGetCall: EbayGetCall) =>
    ebayApiClient
      .get<EbayDocument>(ebayGetCall.endpoint, ebayGetCall.searchParameters)
      .then<EbayRequestCompletion<EbayDocument>, EbayRequestCompletion<EbayDocument>>(
        (ebayDocument) => ({ kind: 'ebayRequestSucceeded', ebayDocument }),
        (thrownFailure: unknown) => ({
          kind: 'ebayRequestFailed',
          ebayFailure: classifyEbayFailure(thrownFailure),
        }),
      ),
});
