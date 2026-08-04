/** Local credential tooling rejected the call because its arguments or state were invalid. */
export type CredentialToolRejectionFailure = {
  readonly kind: 'credentialToolRejected';
  readonly message: string;
};

/** Local credential tooling could not complete because a dependency was unavailable. */
export type CredentialToolUnavailableFailure = {
  readonly kind: 'credentialToolUnavailable';
  readonly message: string;
};

/** Closed operational failures returned by credential and local token-management tools. */
export type CredentialToolFailure =
  | CredentialToolRejectionFailure
  | CredentialToolUnavailableFailure;

/**
 * Explicit completion returned by every fallible credential or local token tool.
 *
 * @typeParam Document - Success document returned without reshaping at the MCP boundary.
 */
export type CredentialToolCompletion<Document> =
  | {
      readonly kind: 'credentialToolSucceeded';
      readonly document: Document;
    }
  | {
      readonly kind: 'credentialToolFailed';
      readonly failure: CredentialToolFailure;
    };
