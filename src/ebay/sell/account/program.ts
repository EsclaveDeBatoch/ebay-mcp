import { z } from 'zod';

import type { EbayRequestCompletion } from '@/ebay/ebayRequestCompletion.js';
import type { EbaySellerSession } from '@/ebay/ebaySellerSession.js';
import type {
  components,
  operations,
} from '@/generated/ebay/sell-apps/account-management/sellAccountV1Oas3.js';
import { defineTool } from '@/mcp/defineTool.js';

const programTypeSchema = z.enum([
  'OUT_OF_STOCK_CONTROL',
  'PARTNER_MOTORS_DEALER',
  'SELLING_POLICY_MANAGEMENT',
]);

/** Exact empty argument contract accepted by getOptedInPrograms. */
export const getOptedInProgramsArgumentsSchema = z.object({}).strict();

/** Direct eBay document accepted by optInToProgram and optOutOfProgram. */
export const programEnrollmentArgumentsSchema = z
  .object({ programType: programTypeSchema })
  .strict();

/** Validated direct eBay seller-program enrollment document. */
export type ProgramEnrollmentArguments = z.infer<typeof programEnrollmentArgumentsSchema>;

/** @see https://developer.ebay.com/api-docs/sell/account/types/api:Programs */
export type ProgramEnrollmentCollection = components['schemas']['Programs'];

/** @see https://developer.ebay.com/api-docs/sell/account/resources/program/methods/optInToProgram */
export type ProgramEnrollmentConfirmation =
  operations['optInToProgram']['responses'][200]['content']['application/json'];

/**
 * Retrieves the seller programs that the account has opted into.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @returns Explicit completion containing eBay's unchanged program enrollment collection.
 * @example `await getOptedInPrograms(sellerSession)`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/program/methods/getOptedInPrograms
 */
export const getOptedInPrograms = (
  sellerSession: EbaySellerSession,
): Promise<EbayRequestCompletion<ProgramEnrollmentCollection>> =>
  sellerSession.get<ProgramEnrollmentCollection>({
    endpoint: '/sell/account/v1/program/get_opted_in_programs',
  });

/**
 * Requests enrollment in one official eBay seller program.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param programEnrollment - Direct eBay seller-program document.
 * @returns Explicit completion containing eBay's unchanged empty confirmation document.
 * @example `await optInToProgram(sellerSession, { programType: 'OUT_OF_STOCK_CONTROL' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/program/methods/optInToProgram
 */
export const optInToProgram = (
  sellerSession: EbaySellerSession,
  programEnrollment: ProgramEnrollmentArguments,
): Promise<EbayRequestCompletion<ProgramEnrollmentConfirmation>> =>
  sellerSession.post<ProgramEnrollmentConfirmation>({
    endpoint: '/sell/account/v1/program/opt_in',
    requestDocument: programEnrollment,
  });

/**
 * Requests withdrawal from one official eBay seller program.
 *
 * @param sellerSession - Authenticated seller request boundary.
 * @param programEnrollment - Direct eBay seller-program document.
 * @returns Explicit completion containing eBay's unchanged empty confirmation document.
 * @example `await optOutOfProgram(sellerSession, { programType: 'SELLING_POLICY_MANAGEMENT' })`
 * @see https://developer.ebay.com/api-docs/sell/account/resources/program/methods/optOutOfProgram
 */
export const optOutOfProgram = (
  sellerSession: EbaySellerSession,
  programEnrollment: ProgramEnrollmentArguments,
): Promise<EbayRequestCompletion<ProgramEnrollmentConfirmation>> =>
  sellerSession.post<ProgramEnrollmentConfirmation>({
    endpoint: '/sell/account/v1/program/opt_out',
    requestDocument: programEnrollment,
  });

/** MCP definition for the Account API getOptedInPrograms operation. */
export const getOptedInProgramsTool = defineTool({
  name: 'ebay_sell_account_get_opted_in_programs',
  namespace: 'sell.account',
  description: 'Retrieve seller programs that the account has opted into',
  argumentsSchema: getOptedInProgramsArgumentsSchema,
  operationKind: 'read',
  operation: getOptedInPrograms,
});

/** MCP definition for the Account API optInToProgram operation. */
export const optInToProgramTool = defineTool({
  name: 'ebay_sell_account_opt_in_to_program',
  namespace: 'sell.account',
  description: 'Request enrollment in one official eBay seller program',
  argumentsSchema: programEnrollmentArgumentsSchema,
  operationKind: 'write',
  operation: optInToProgram,
});

/** MCP definition for the Account API optOutOfProgram operation. */
export const optOutOfProgramTool = defineTool({
  name: 'ebay_sell_account_opt_out_of_program',
  namespace: 'sell.account',
  description: 'Request withdrawal from one official eBay seller program',
  argumentsSchema: programEnrollmentArgumentsSchema,
  operationKind: 'write',
  operation: optOutOfProgram,
});
