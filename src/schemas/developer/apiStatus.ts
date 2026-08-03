import { z } from '@/utils/effectSchema.js';

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
