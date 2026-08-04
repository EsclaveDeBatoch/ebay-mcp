import { XMLBuilder, XMLParser } from 'fast-xml-parser';
import { Effect } from 'effect';
import { z } from 'zod';

import type { EbayApiClient } from '@/api/client.js';
import { clientRequestError, EbayClientRequestError } from '@/api/clientRequestError.js';
import { getBaseUrl, getTradingSiteId } from '@/config/environment.js';
import { getErrorMessage } from '@/utils/errors.js';
import { httpRequest, isHttpError } from '@/utils/http.js';
import { apiLogger } from '@/utils/logger.js';

const COMPATIBILITY_LEVEL = '1451';
const TRADING_ENDPOINT_PATH = '/ws/api.dll';
const TRADING_XML_NAMESPACE = 'urn:ebay:apis:eBLBaseComponents';
const tradingDocumentSchema = z.record(z.string(), z.unknown());

/** One XML call issued through the Trading API transport. */
export type TradingCall = {
  readonly callName: string;
  readonly requestDocument: Record<string, unknown>;
};

/** Parsed Trading API XML response returned without resource-level reshaping. */
export type TradingDocument = Record<string, unknown>;

function tradingEndpoint(ebayApiClient: EbayApiClient): string {
  const ebaySettings = ebayApiClient.getConfig();
  const ebayBaseUrl = getBaseUrl(ebaySettings.environment, ebaySettings.apiBaseUrl);
  return `${ebayBaseUrl}${TRADING_ENDPOINT_PATH}`;
}

function unauthenticatedTradingHeaders(callName: string): Record<string, string> {
  return {
    'X-EBAY-API-SITEID': getTradingSiteId(),
    'X-EBAY-API-COMPATIBILITY-LEVEL': COMPATIBILITY_LEVEL,
    'X-EBAY-API-CALL-NAME': callName,
    'Content-Type': 'text/xml',
  };
}

async function authenticatedTradingHeaders(
  ebayApiClient: EbayApiClient,
  callName: string,
  endpoint: string,
): Promise<Record<string, string>> {
  const tradingHeaders = unauthenticatedTradingHeaders(callName);
  if (ebayApiClient.getConfig().disableAuthHeader) {
    return tradingHeaders;
  }

  try {
    const accessToken = await Effect.runPromise(ebayApiClient.getOAuthClient().getAccessToken());
    return { ...tradingHeaders, 'X-EBAY-API-IAF-TOKEN': accessToken };
  } catch (thrownFailure) {
    throw clientRequestError({
      kind: 'tokenAcquisition',
      method: 'POST',
      url: endpoint,
      message: `Trading API ${callName} token acquisition failed: ${getErrorMessage(thrownFailure)}`,
      cause: thrownFailure,
    });
  }
}

function tradingXml(
  xmlBuilder: XMLBuilder,
  callName: string,
  requestDocument: Record<string, unknown>,
): string {
  const requestTag = `${callName}Request`;
  const xmlDocument = {
    [requestTag]: {
      '@_xmlns': TRADING_XML_NAMESPACE,
      ...requestDocument,
    },
  };
  return `<?xml version="1.0" encoding="utf-8"?>\n${xmlBuilder.build(xmlDocument)}`;
}

function parsedTradingDocument(
  xmlParser: XMLParser,
  responseText: string,
  callName: string,
  endpoint: string,
): TradingDocument {
  try {
    return tradingDocumentSchema.parse(xmlParser.parse(responseText));
  } catch (thrownFailure) {
    throw clientRequestError({
      kind: 'transport',
      method: 'POST',
      url: endpoint,
      message: `Failed to parse Trading API ${callName} response: ${getErrorMessage(thrownFailure)}`,
      cause: thrownFailure,
    });
  }
}

function tradingResponseDocument(
  parsedXml: TradingDocument,
  callName: string,
  endpoint: string,
): TradingDocument {
  const responseTag = `${callName}Response`;
  const responseCandidate = parsedXml[responseTag];
  if (responseCandidate === undefined) {
    return parsedXml;
  }

  const parsedCandidate = tradingDocumentSchema.safeParse(responseCandidate);
  if (parsedCandidate.success) {
    return parsedCandidate.data;
  }

  throw clientRequestError({
    kind: 'transport',
    method: 'POST',
    url: endpoint,
    message: `Trading API ${callName} response document must be an object`,
    cause: responseCandidate,
  });
}

function tradingFailureMessage(tradingFailures: unknown): string {
  const firstTradingFailure = firstTradingFailureFrom(tradingFailures);
  const parsedFailure = tradingDocumentSchema.safeParse(firstTradingFailure);
  if (!parsedFailure.success) {
    return 'Trading API returned a failure without an error message';
  }

  const shortMessage = parsedFailure.data.ShortMessage;
  if (typeof shortMessage === 'string' && shortMessage !== '') {
    return shortMessage;
  }
  const longMessage = parsedFailure.data.LongMessage;
  if (typeof longMessage === 'string' && longMessage !== '') {
    return longMessage;
  }
  return 'Trading API returned a failure without an error message';
}

function firstTradingFailureFrom(tradingFailures: unknown): unknown {
  if (Array.isArray(tradingFailures)) {
    return tradingFailures.at(0);
  }
  return tradingFailures;
}

function acceptedTradingDocument(
  tradingDocument: TradingDocument,
  callName: string,
  endpoint: string,
): TradingDocument {
  if (tradingDocument.Ack === 'Warning') {
    apiLogger.warn(`Trading API ${callName} returned warnings`, {
      tradingWarnings: tradingDocument.Errors,
    });
  }
  if (tradingDocument.Ack !== 'Failure' && tradingDocument.Ack !== 'PartialFailure') {
    return tradingDocument;
  }

  throw clientRequestError({
    kind: 'httpStatus',
    method: 'POST',
    url: endpoint,
    status: 400,
    message: tradingFailureMessage(tradingDocument.Errors),
    cause: tradingDocument.Errors,
  });
}

function tradingHttpFailure(thrownFailure: unknown, callName: string, endpoint: string): never {
  if (!isHttpError(thrownFailure)) {
    throw clientRequestError({
      kind: 'transport',
      method: 'POST',
      url: endpoint,
      message: `Trading API ${callName} request failed: ${getErrorMessage(thrownFailure)}`,
      cause: thrownFailure,
    });
  }
  if (thrownFailure.status === undefined) {
    throw clientRequestError({
      kind: 'transport',
      method: 'POST',
      url: endpoint,
      message: `Trading API ${callName} request failed: ${thrownFailure.message}`,
      cause: thrownFailure,
    });
  }
  throw clientRequestError({
    kind: 'httpStatus',
    method: 'POST',
    url: endpoint,
    status: thrownFailure.status,
    message: `Trading API ${callName} request failed: ${thrownFailure.message}`,
    cause: thrownFailure,
  });
}

/**
 * Creates the XML transport used by Trading API resource operations.
 *
 * @param ebayApiClient - Authenticated eBay client that owns seller OAuth settings.
 * @returns One-call Trading XML transport with parsed, unchanged response documents.
 */
export const createTradingTransport = (ebayApiClient: EbayApiClient) => {
  const endpoint = tradingEndpoint(ebayApiClient);
  const xmlParser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    parseTagValue: true,
    isArray: (xmlTag: string) =>
      [
        'Item',
        'Errors',
        'Error',
        'NameValueList',
        'Value',
        'ShippingServiceOptions',
        'InternationalShippingServiceOption',
        'PaymentMethods',
        'PictureURL',
        'CompatibilityList',
        'Variation',
      ].includes(xmlTag),
  });
  const xmlBuilder = new XMLBuilder({
    ignoreAttributes: false,
    format: true,
    suppressEmptyNode: true,
  });

  return {
    execute: async <EbayDocument extends TradingDocument>(
      tradingCall: TradingCall,
    ): Promise<EbayDocument> => {
      const xmlDocument = tradingXml(xmlBuilder, tradingCall.callName, tradingCall.requestDocument);
      const tradingHeaders = await authenticatedTradingHeaders(
        ebayApiClient,
        tradingCall.callName,
        endpoint,
      );
      apiLogger.debug(`Trading API ${tradingCall.callName}`, { xmlDocument });

      try {
        const httpCompletion = await httpRequest<string>({
          method: 'POST',
          url: endpoint,
          headers: tradingHeaders,
          body: xmlDocument,
          timeoutMs: 30_000,
          responseType: 'text',
        });
        const parsedXml = parsedTradingDocument(
          xmlParser,
          httpCompletion.data,
          tradingCall.callName,
          endpoint,
        );
        const responseDocument = tradingResponseDocument(parsedXml, tradingCall.callName, endpoint);
        return acceptedTradingDocument(
          responseDocument,
          tradingCall.callName,
          endpoint,
        ) as EbayDocument;
      } catch (thrownFailure) {
        if (thrownFailure instanceof EbayClientRequestError) {
          throw thrownFailure;
        }
        return tradingHttpFailure(thrownFailure, tradingCall.callName, endpoint);
      }
    },
  };
};
