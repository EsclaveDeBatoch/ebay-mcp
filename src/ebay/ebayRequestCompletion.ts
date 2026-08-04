/** A seller session could not authenticate the eBay request. */
export type EbayAuthenticationFailure = {
  readonly kind: 'ebayAuthenticationFailed';
  readonly message: string;
};

/** eBay or the local request guard refused the call because its quota was exhausted. */
export type EbayRateLimitFailure = {
  readonly kind: 'ebayRateLimited';
  readonly message: string;
};

/** eBay understood the request but rejected its operation or arguments. */
export type EbayRejectionFailure = {
  readonly kind: 'ebayRequestRejected';
  readonly message: string;
  readonly status: number;
};

/** eBay could not be reached or could not complete the request. */
export type EbayAvailabilityFailure = {
  readonly kind: 'ebayUnavailable';
  readonly message: string;
};

/** Closed operational failures returned by an authenticated eBay seller request. */
export type EbayFailure =
  | EbayAuthenticationFailure
  | EbayRateLimitFailure
  | EbayRejectionFailure
  | EbayAvailabilityFailure;

/**
 * Explicit completion returned by every fallible eBay resource operation.
 *
 * @typeParam EbayDocument - Generated eBay response document returned without reshaping.
 */
export type EbayRequestCompletion<EbayDocument> =
  | {
      readonly kind: 'ebayRequestSucceeded';
      readonly ebayDocument: EbayDocument;
    }
  | {
      readonly kind: 'ebayRequestFailed';
      readonly ebayFailure: EbayFailure;
    };
