import type { EbayApiClient } from '@/api/client.js';
import {
  type EbayApiError,
  type EndpointInputError,
  requestGetEffect,
  requestPostEffect,
  requireObjectEffect,
  requireStringEffect,
} from '@/api/shared/request.js';
import type {
  createSigningKeyInputSchema,
  getSigningKeyInputSchema,
  getSigningKeysInputSchema,
} from '@/schemas/developer/developer.js';
import type { components as KeyComponents } from '@/generated/ebay/application-settings/developerKeyManagementV1Oas3.js';
import { Effect } from 'effect';
import type { InferEffectSchema } from '@/utils/effectSchemaTypes.js';

/** Signing key response returned by Developer Key Management endpoints. */
type SigningKey = KeyComponents['schemas']['SigningKey'];
/** Response returned by the list signing keys endpoint. */
type QuerySigningKeysResponse = KeyComponents['schemas']['QuerySigningKeysResponse'];
/** Request body for creating a signing key. */
type CreateSigningKeyRequest = KeyComponents['schemas']['CreateSigningKeyRequest'];
type GetSigningKeysInput = InferEffectSchema<typeof getSigningKeysInputSchema>;
type CreateSigningKeyInput = InferEffectSchema<typeof createSigningKeyInputSchema>;
type GetSigningKeyInput = InferEffectSchema<typeof getSigningKeyInputSchema>;

/**
 * Developer Key Management API
 * Based on:
 * - specs/ebay/application-settings/developer_key_management_v1_oas3.json
 */
export class DeveloperApi {
  private readonly keyBasePath = '/developer/key_management/v1';

  public constructor(private readonly client: EbayApiClient) {}

  // ========================================
  // SIGNING KEY MANAGEMENT
  // ========================================

  /**
   * Retrieves all signing keys for the application.
   *
   * @param input - Empty endpoint input object.
   * @returns An Effect that succeeds with eBay's generated QuerySigningKeysResponse.
   *
   * @example
   * ```ts
   * const keys = await Effect.runPromise(developerApi.getSigningKeys({}));
   * ```
   *
   * @see https://developer.ebay.com/api-docs/developer/key_management/resources/signing_key/methods/getSigningKeys
   */
  public getSigningKeys = (
    input: GetSigningKeysInput = {},
  ): Effect.Effect<QuerySigningKeysResponse, EbayApiError> => {
    void input;
    return requestGetEffect<QuerySigningKeysResponse>(
      this.client,
      `${this.keyBasePath}/signing_key`,
    );
  };

  /**
   * Creates a signing keypair for API digital signatures.
   *
   * @param input - Optional signing-key cipher request body.
   * @returns An Effect that succeeds with eBay's generated SigningKey response.
   *
   * @example
   * ```ts
   * const key = await Effect.runPromise(
   *   developerApi.createSigningKey({ request: { signingKeyCipher: 'RSA' } }),
   * );
   * ```
   *
   * @see https://developer.ebay.com/api-docs/developer/key_management/resources/signing_key/methods/createSigningKey
   */
  public createSigningKey = (
    input: CreateSigningKeyInput = {},
  ): Effect.Effect<SigningKey, EbayApiError> =>
    requestPostEffect<SigningKey>(
      this.client,
      `${this.keyBasePath}/signing_key`,
      (input.request as CreateSigningKeyRequest | undefined) ?? {},
    );

  /**
   * Retrieves a specific signing key by eBay signing key ID.
   *
   * @param input - eBay-generated signing key identifier.
   * @returns An Effect that succeeds with eBay's generated SigningKey response.
   *
   * @example
   * ```ts
   * const key = await Effect.runPromise(developerApi.getSigningKey({ signingKeyId: 'key_001' }));
   * ```
   *
   * @see https://developer.ebay.com/api-docs/developer/key_management/resources/signing_key/methods/getSigningKey
   */
  public getSigningKey = (
    input: GetSigningKeyInput,
  ): Effect.Effect<SigningKey, EbayApiError | EndpointInputError> =>
    Effect.gen(this, function* () {
      const endpointInput = yield* requireObjectEffect<GetSigningKeyInput>(input, 'input');
      const signingKeyId = yield* requireStringEffect(endpointInput.signingKeyId, 'signingKeyId');

      return yield* requestGetEffect<SigningKey>(
        this.client,
        `${this.keyBasePath}/signing_key/${signingKeyId}`,
      );
    });
}
