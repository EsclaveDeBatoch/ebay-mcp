import type { EbayFailure, EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type {
  EbayGetCall,
  EbayPostCall,
  EbayPutCall,
  EbaySellerSession,
} from '@/ebay/ebaySellerSession.js';

export const ebayFailures: readonly EbayFailure[] = [
  { kind: 'ebayAuthenticationFailed', message: 'Seller authorization expired' },
  { kind: 'ebayRateLimited', message: 'Request quota exhausted' },
  { kind: 'ebayRequestRejected', message: 'eBay rejected the request', status: 400 },
  { kind: 'ebayUnavailable', message: 'Service unavailable' },
];

export const sellerSessionReturning = <EbayDocument>(
  ebayRequestCompletion: EbayRequestCompletion<EbayDocument>,
): {
  readonly sellerSession: EbaySellerSession;
  readonly getCalls: EbayGetCall[];
  readonly postCalls: EbayPostCall[];
  readonly putCalls: EbayPutCall[];
} => {
  const getCalls: EbayGetCall[] = [];
  const postCalls: EbayPostCall[] = [];
  const putCalls: EbayPutCall[] = [];
  const get = <RequestedEbayDocument>(
    ebayGetCall: EbayGetCall,
  ): Promise<EbayRequestCompletion<RequestedEbayDocument>> => {
    getCalls.push(ebayGetCall);
    return Promise.resolve(ebayRequestCompletion as EbayRequestCompletion<RequestedEbayDocument>);
  };
  const post = <RequestedEbayDocument>(
    ebayPostCall: EbayPostCall,
  ): Promise<EbayRequestCompletion<RequestedEbayDocument>> => {
    postCalls.push(ebayPostCall);
    return Promise.resolve(ebayRequestCompletion as EbayRequestCompletion<RequestedEbayDocument>);
  };
  const put = <RequestedEbayDocument>(
    ebayPutCall: EbayPutCall,
  ): Promise<EbayRequestCompletion<RequestedEbayDocument>> => {
    putCalls.push(ebayPutCall);
    return Promise.resolve(ebayRequestCompletion as EbayRequestCompletion<RequestedEbayDocument>);
  };

  return { sellerSession: { get, post, put }, getCalls, postCalls, putCalls };
};
