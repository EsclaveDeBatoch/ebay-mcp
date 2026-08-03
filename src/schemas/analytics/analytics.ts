import { z } from '@/utils/effectSchema.js';
import { zodToJsonSchema } from 'zod-to-json-schema';

/**
 * Analytics API Schemas
 *
 * This file contains Effect-backed schemas for the Sell Analytics API.
 * Schemas are organized by type and include all analytics-related endpoints.
 */

// ============================================================================
// Common Schemas
// ============================================================================

// ============================================================================
// Customer Service Metric Schemas
// ============================================================================

const benchmarkMetadataSchema = z.object({
  average: z.string().optional(),
});

const metricBenchmarkSchema = z.object({
  adjustment: z.string().optional(),
  basis: z.string().optional(),
  metadata: benchmarkMetadataSchema.optional(),
  rating: z.string().optional(),
});

const distributionSchema = z.object({
  name: z.string().optional(),
  value: z.string().optional(),
});

const metricDistributionSchema = z.object({
  basis: z.string().optional(),
  data: z.array(distributionSchema).optional(),
});

const metricSchema = z.object({
  benchmark: metricBenchmarkSchema.optional(),
  distributions: z.array(metricDistributionSchema).optional(),
  metricKey: z.string().optional(),
  value: z.string().optional(),
});

const dimensionSchema = z.object({
  dimensionKey: z.string().optional(),
  name: z.string().optional(),
  value: z.string().optional(),
});

const dimensionMetricSchema = z.object({
  dimension: dimensionSchema.optional(),
  metrics: z.array(metricSchema).optional(),
});

const evaluationCycleSchema = z.object({
  endDate: z.string().optional(),
  evaluationDate: z.string().optional(),
  evaluationType: z.string().optional(),
  startDate: z.string().optional(),
});

const getCustomerServiceMetricResponseSchema = z.object({
  dimensionMetrics: z.array(dimensionMetricSchema).optional(),
  evaluationCycle: evaluationCycleSchema.optional(),
  marketplaceId: z.string().optional(),
});

// ============================================================================
// Seller Standards Profile Schemas
// ============================================================================

const cycleSchema = z.object({
  cycleType: z.string().optional(),
  evaluationDate: z.string().optional(),
  evaluationMonth: z.string().optional(),
});

const standardsProfileSchema = z.object({
  cycle: cycleSchema.optional(),
  defaultProgram: z.boolean().optional(),
  evaluationReason: z.string().optional(),
  metrics: z.array(metricSchema).optional(),
  program: z.string().optional(),
  standardsLevel: z.string().optional(),
});

const findSellerStandardsProfilesResponseSchema = z.object({
  standardsProfiles: z.array(standardsProfileSchema).optional(),
});

// ============================================================================
// Input Schemas for Operations
// ============================================================================

/** Input accepted by Analytics API findSellerStandardsProfiles. */
export const findSellerStandardsProfilesInputSchema = z.object({});

/** Input accepted by Analytics API getCustomerServiceMetric. */
export const getCustomerServiceMetricInputSchema = z.object({
  customerServiceMetricType: z
    .string()
    .describe('Customer service metric type, e.g., ITEM_NOT_AS_DESCRIBED'),
  evaluationType: z.string().describe('Evaluation type, e.g., CURRENT or PROJECTED'),
  evaluationMarketplaceId: z.string().describe('Marketplace ID used for the evaluation'),
});

/** Input accepted by Analytics API getSellerStandardsProfile. */
export const getSellerStandardsProfileInputSchema = z.object({
  program: z.string().describe('Seller standards program identifier'),
  cycle: z.string().describe('Seller standards cycle, e.g., CURRENT or PROJECTED'),
});

// ============================================================================
// JSON Schema Conversion Functions
// ============================================================================

/**
 * Converts Analytics API Effect-backed schemas to JSON Schema format for MCP tools.
 *
 * @returns Analytics API JSON schemas keyed by endpoint or shared model name.
 * @example
 * ```ts
 * const schemas = getAnalyticsJsonSchemas();
 * ```
 */
export const getAnalyticsJsonSchemas = () => {
  return {
    // Customer Service Metrics
    getCustomerServiceMetricInput: zodToJsonSchema(
      getCustomerServiceMetricInputSchema,
      'getCustomerServiceMetricInput',
    ),
    getCustomerServiceMetricOutput: zodToJsonSchema(
      getCustomerServiceMetricResponseSchema,
      'getCustomerServiceMetricOutput',
    ),

    // Seller Standards Profiles
    findSellerStandardsProfilesInput: zodToJsonSchema(
      findSellerStandardsProfilesInputSchema,
      'findSellerStandardsProfilesInput',
    ),
    findSellerStandardsProfilesOutput: zodToJsonSchema(
      findSellerStandardsProfilesResponseSchema,
      'findSellerStandardsProfilesOutput',
    ),
    getSellerStandardsProfileInput: zodToJsonSchema(
      getSellerStandardsProfileInputSchema,
      'getSellerStandardsProfileInput',
    ),
    getSellerStandardsProfileOutput: zodToJsonSchema(
      standardsProfileSchema,
      'getSellerStandardsProfileOutput',
    ),

    // Common Types
    benchmarkMetadata: zodToJsonSchema(benchmarkMetadataSchema, 'benchmarkMetadata'),
    cycle: zodToJsonSchema(cycleSchema, 'cycle'),
    dimension: zodToJsonSchema(dimensionSchema, 'dimension'),
    dimensionMetric: zodToJsonSchema(dimensionMetricSchema, 'dimensionMetric'),
    distribution: zodToJsonSchema(distributionSchema, 'distribution'),
    evaluationCycle: zodToJsonSchema(evaluationCycleSchema, 'evaluationCycle'),
    metric: zodToJsonSchema(metricSchema, 'metric'),
    metricBenchmark: zodToJsonSchema(metricBenchmarkSchema, 'metricBenchmark'),
    metricDistribution: zodToJsonSchema(metricDistributionSchema, 'metricDistribution'),
    standardsProfile: zodToJsonSchema(standardsProfileSchema, 'standardsProfile'),
  };
};
