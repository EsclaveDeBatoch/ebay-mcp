import { z } from '@/utils/effectSchema.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

/** Input accepted by the public eBay API status feed tool. */
export const getApiStatusInputSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .describe('Maximum number of feed items to return'),
  status: z.enum(['Resolved', 'Unresolved']).optional().describe('Optional incident status filter'),
  api: z.string().optional().describe('Optional API-name substring filter'),
});

/** Input accepted by Developer Key Management API getSigningKeys. */
export const getSigningKeysInputSchema = z.object({});

/** Generated create-signing-key request body accepted by eBay. */
export const createSigningKeyRequestSchema = z.object({
  signingKeyCipher: z
    .string()
    .optional()
    .describe('Cipher for the generated keypair, e.g. ED25519 or RSA'),
});

/** Input accepted by Developer Key Management API createSigningKey. */
export const createSigningKeyInputSchema = z.object({
  request: createSigningKeyRequestSchema.optional().describe('Optional signing-key request body'),
});

/** Input accepted by Developer Key Management API getSigningKey. */
export const getSigningKeyInputSchema = z.object({
  signingKeyId: z.string().describe('System-generated eBay signing key identifier'),
});

/** Response returned by Developer Key Management signing-key endpoints. */
export const signingKeySchema = z.object({
  creationTime: z.number().int().optional(),
  expirationTime: z.number().int().optional(),
  jwe: z.string().optional(),
  privateKey: z.string().optional(),
  publicKey: z.string().optional(),
  signingKeyCipher: z.string().optional(),
  signingKeyId: z.string().optional(),
});

/** Response returned by Developer Key Management API getSigningKeys. */
export const querySigningKeysResponseSchema = z.object({
  signingKeys: z.array(signingKeySchema).optional(),
});

/**
 * Converts Developer API Effect-backed schemas to JSON Schema format for MCP tools.
 *
 * @returns Developer API JSON schemas keyed by endpoint or shared model name.
 *
 * @example
 * ```ts
 * const schemas = getDeveloperJsonSchemas();
 * ```
 */
export const getDeveloperJsonSchemas = () => ({
  getApiStatusInput: zodToJsonSchema(getApiStatusInputSchema, 'getApiStatusInput'),
  getSigningKeysInput: zodToJsonSchema(getSigningKeysInputSchema, 'getSigningKeysInput'),
  getSigningKeysOutput: zodToJsonSchema(querySigningKeysResponseSchema, 'getSigningKeysOutput'),
  createSigningKeyInput: zodToJsonSchema(createSigningKeyInputSchema, 'createSigningKeyInput'),
  createSigningKeyOutput: zodToJsonSchema(signingKeySchema, 'createSigningKeyOutput'),
  getSigningKeyInput: zodToJsonSchema(getSigningKeyInputSchema, 'getSigningKeyInput'),
  getSigningKeyOutput: zodToJsonSchema(signingKeySchema, 'getSigningKeyOutput'),
});
