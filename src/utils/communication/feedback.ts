import { z } from '@/utils/effectSchema.js';

/**
 * Effect-backed schemas for Feedback API input validation.
 * OpenAPI spec: specs/ebay/sell-apps/communication/commerce_feedback_v1_beta_oas3.json
 */

/** Schema for respondToFeedback input. */
export const respondToFeedbackSchema = z.object({
  feedbackId: z
    .string({
      invalid_type_error: 'feedbackId must be a string',
      description: 'The unique identifier of the feedback being responded to',
    })
    .optional(),
  recipientUserId: z
    .string({
      invalid_type_error: 'recipientUserId must be a string',
      description: 'The user ID of the feedback provider',
    })
    .optional(),
  responseText: z
    .string({
      invalid_type_error: 'responseText must be a string',
      description: 'The text content of the response (max 500 characters)',
    })
    .max(500, 'responseText must be 500 characters or less')
    .optional(),
  responseType: z
    .string({
      invalid_type_error: 'responseType must be a string',
      description: 'The type of response: REPLY or FOLLOW_UP',
    })
    .optional(),
});
