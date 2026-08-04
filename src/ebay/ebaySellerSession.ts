import type { EbayApiClient } from '@/api/client.js';
import { EbayClientRequestError } from '@/api/clientRequestError.js';
import { getApizBaseUrl } from '@/config/environment.js';
import type { EbayFailure, EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import {
  createTradingTransport,
  type TradingCall,
  type TradingDocument,
} from '@/ebay/trading/tradingTransport.js';
import { getErrorMessage } from '@/utils/errors.js';
import type { ResponseType } from '@/utils/http.js';

/** Query values accepted by the shared eBay HTTP client. */
type EbaySearchParameters = {
  readonly [wireField: string]: unknown;
};

/** Request headers accepted by the shared eBay HTTP client. */
type EbayRequestHeaders = {
  readonly [wireHeader: string]: string;
};

/** One authenticated GET call issued by an eBay resource operation. */
type EbayGetCall = {
  readonly apiHost?: 'apiz';
  readonly endpoint: string;
  readonly searchParameters?: EbaySearchParameters;
  readonly requestHeaders?: EbayRequestHeaders;
  readonly responseType?: ResponseType;
};

/** One authenticated POST call issued by an eBay resource operation. */
type EbayPostCall = {
  readonly apiHost?: 'apiz';
  readonly endpoint: string;
  readonly requestDocument?: unknown;
  readonly searchParameters?: EbaySearchParameters;
  readonly requestHeaders?: EbayRequestHeaders;
};

/** One authenticated PUT call issued by an eBay resource operation. */
type EbayPutCall = {
  readonly endpoint: string;
  readonly requestDocument: unknown;
  readonly searchParameters?: EbaySearchParameters;
  readonly requestHeaders?: EbayRequestHeaders;
};

/** One authenticated DELETE call issued by an eBay resource operation. */
type EbayDeleteCall = {
  readonly endpoint: string;
  readonly searchParameters?: EbaySearchParameters;
  readonly requestHeaders?: EbayRequestHeaders;
};

/** Authenticated seller boundary used by eBay resource operations. */
type EbaySellerSession = {
  readonly delete: <EbayDocument>(
    ebayDeleteCall: EbayDeleteCall,
  ) => Promise<EbayRequestCompletion<EbayDocument>>;
  readonly get: <EbayDocument>(
    ebayGetCall: EbayGetCall,
  ) => Promise<EbayRequestCompletion<EbayDocument>>;
  readonly post: <EbayDocument>(
    ebayPostCall: EbayPostCall,
  ) => Promise<EbayRequestCompletion<EbayDocument>>;
  readonly put: <EbayDocument>(
    ebayPutCall: EbayPutCall,
  ) => Promise<EbayRequestCompletion<EbayDocument>>;
  readonly trading: <EbayDocument extends TradingDocument>(
    tradingCall: TradingCall,
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
    default: {
      const impossibleClientFailureKind: never = thrownFailure.kind;
      return impossibleClientFailureKind;
    }
  }
}

function completeEbayCall<EbayDocument>(
  ebayCall: Promise<EbayDocument>,
): Promise<EbayRequestCompletion<EbayDocument>> {
  return ebayCall.then<EbayRequestCompletion<EbayDocument>, EbayRequestCompletion<EbayDocument>>(
    (ebayDocument) => ({ kind: 'ebayRequestSucceeded', ebayDocument }),
    (thrownFailure: unknown) => ({
      kind: 'ebayRequestFailed',
      ebayFailure: classifyEbayFailure(thrownFailure),
    }),
  );
}

function completeGetCall<EbayDocument>(
  ebayApiClient: EbayApiClient,
  ebayGetCall: EbayGetCall,
): Promise<EbayRequestCompletion<EbayDocument>> {
  if (ebayGetCall.apiHost === 'apiz') {
    const ebaySettings = ebayApiClient.getConfig();
    const apizBaseUrl = getApizBaseUrl(ebaySettings.environment, ebaySettings.apiBaseUrl);
    const absoluteEndpoint = `${apizBaseUrl}${ebayGetCall.endpoint}`;
    if (ebayGetCall.requestHeaders === undefined && ebayGetCall.responseType === undefined) {
      return completeEbayCall(
        ebayApiClient.getFromUrl<EbayDocument>(absoluteEndpoint, ebayGetCall.searchParameters),
      );
    }
    return completeEbayCall(
      ebayApiClient.getFromUrl<EbayDocument>(absoluteEndpoint, ebayGetCall.searchParameters, {
        headers: ebayGetCall.requestHeaders,
        responseType: ebayGetCall.responseType,
      }),
    );
  }
  if (ebayGetCall.requestHeaders === undefined && ebayGetCall.responseType === undefined) {
    return completeEbayCall(
      ebayApiClient.get<EbayDocument>(ebayGetCall.endpoint, ebayGetCall.searchParameters),
    );
  }
  return completeEbayCall(
    ebayApiClient.get<EbayDocument>(ebayGetCall.endpoint, ebayGetCall.searchParameters, {
      headers: ebayGetCall.requestHeaders,
      responseType: ebayGetCall.responseType,
    }),
  );
}

function completePostCall<EbayDocument>(
  ebayApiClient: EbayApiClient,
  ebayPostCall: EbayPostCall,
): Promise<EbayRequestCompletion<EbayDocument>> {
  if (ebayPostCall.apiHost === 'apiz') {
    const ebaySettings = ebayApiClient.getConfig();
    const apizBaseUrl = getApizBaseUrl(ebaySettings.environment, ebaySettings.apiBaseUrl);
    const absoluteEndpoint = `${apizBaseUrl}${ebayPostCall.endpoint}`;
    if (ebayPostCall.searchParameters === undefined && ebayPostCall.requestHeaders === undefined) {
      return completeEbayCall(
        ebayApiClient.postToUrl<EbayDocument>(absoluteEndpoint, ebayPostCall.requestDocument),
      );
    }
    return completeEbayCall(
      ebayApiClient.postToUrl<EbayDocument>(absoluteEndpoint, ebayPostCall.requestDocument, {
        searchParameters: ebayPostCall.searchParameters,
        headers: ebayPostCall.requestHeaders,
      }),
    );
  }
  if (
    ebayPostCall.requestDocument === undefined &&
    ebayPostCall.searchParameters === undefined &&
    ebayPostCall.requestHeaders === undefined
  ) {
    return completeEbayCall(ebayApiClient.post<EbayDocument>(ebayPostCall.endpoint));
  }
  return completeEbayCall(
    ebayApiClient.post<EbayDocument>(ebayPostCall.endpoint, ebayPostCall.requestDocument, {
      searchParameters: ebayPostCall.searchParameters,
      headers: ebayPostCall.requestHeaders,
    }),
  );
}

export type {
  EbayDeleteCall,
  EbayGetCall,
  EbayPostCall,
  EbayPutCall,
  EbayRequestHeaders,
  EbaySearchParameters,
  EbaySellerSession,
};

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
export const createEbaySellerSession = (ebayApiClient: EbayApiClient): EbaySellerSession => {
  const tradingTransport = createTradingTransport(ebayApiClient);
  return {
    delete: <EbayDocument>(ebayDeleteCall: EbayDeleteCall) =>
      completeEbayCall(
        ebayApiClient.delete<EbayDocument>(ebayDeleteCall.endpoint, {
          searchParameters: ebayDeleteCall.searchParameters,
          headers: ebayDeleteCall.requestHeaders,
        }),
      ),
    get: <EbayDocument>(ebayGetCall: EbayGetCall) =>
      completeGetCall<EbayDocument>(ebayApiClient, ebayGetCall),
    post: <EbayDocument>(ebayPostCall: EbayPostCall) =>
      completePostCall<EbayDocument>(ebayApiClient, ebayPostCall),
    put: <EbayDocument>(ebayPutCall: EbayPutCall) =>
      completeEbayCall(
        ebayApiClient.put<EbayDocument>(ebayPutCall.endpoint, ebayPutCall.requestDocument, {
          searchParameters: ebayPutCall.searchParameters,
          headers: ebayPutCall.requestHeaders,
        }),
      ),
    trading: <EbayDocument extends TradingDocument>(tradingCall: TradingCall) =>
      completeEbayCall(tradingTransport.execute<EbayDocument>(tradingCall)),
  };
};
