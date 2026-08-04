import { describe, it, expect } from 'vitest';
import { Effect, Either } from 'effect';
import { timeDurationSchema, amountSchema, offerSchema } from '@/tools/schemas.js';
import { decodeEffectSchema } from '@/utils/effectSchema.js';
import type { EffectBackedSchema, InferEffectSchema } from '@/utils/effectSchemaTypes.js';

type DecodeResult<TValue> = { success: true; data: TValue } | { success: false; error: unknown };

const decodeResult = <TSchema extends EffectBackedSchema>(
  schema: TSchema,
  value: unknown,
): DecodeResult<InferEffectSchema<TSchema>> => {
  const decoded = Effect.runSync(Effect.either(decodeEffectSchema(schema, value)));
  return Either.isRight(decoded)
    ? { success: true, data: decoded.right }
    : { success: false, error: decoded.left };
};

describe('Schema Validation', () => {
  describe('Common Schemas', () => {
    describe('timeDurationSchema', () => {
      it('validate valid time duration', () => {
        const validDuration = {
          unit: 'DAY',
          value: 30,
        };

        const result = decodeResult(timeDurationSchema, validDuration);
        expect(result.success).toBe(true);
      });

      it('reject invalid unit', () => {
        const invalidDuration = {
          unit: 'INVALID_UNIT',
          value: 30,
        };

        const result = decodeResult(timeDurationSchema, invalidDuration);
        expect(result.success).toBe(false);
      });

      it('require unit and value', () => {
        const missingFields = {
          unit: 'DAY',
        };

        const result = decodeResult(timeDurationSchema, missingFields);
        expect(result.success).toBe(false);
      });

      it('allow additional properties (passthrough)', () => {
        const withExtra = {
          unit: 'DAY',
          value: 30,
          extraField: 'extra',
        };

        const result = decodeResult(timeDurationSchema, withExtra);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toHaveProperty('extraField');
        }
      });
    });

    describe('amountSchema', () => {
      it('validate valid amount', () => {
        const validAmount = {
          currency: 'USD',
          value: '99.99',
        };

        const result = decodeResult(amountSchema, validAmount);
        expect(result.success).toBe(true);
      });

      it('accept different currencies', () => {
        const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

        currencies.forEach((currency) => {
          const amount = { currency, value: '100.00' };
          const result = decodeResult(amountSchema, amount);
          expect(result.success).toBe(true);
        });
      });

      it('require both currency and value', () => {
        const missingValue = { currency: 'USD' };
        const missingCurrency = { value: '99.99' };

        expect(decodeResult(amountSchema, missingValue).success).toBe(false);
        expect(decodeResult(amountSchema, missingCurrency).success).toBe(false);
      });
    });
  });

  describe('Inventory Management Schemas', () => {
    describe('offerSchema', () => {
      it('validate complete offer', () => {
        const validOffer = {
          sku: 'TEST-SKU-001',
          marketplaceId: 'EBAY_US',
          format: 'FIXED_PRICE',
          listingPolicies: {
            fulfillmentPolicyId: '12345',
            paymentPolicyId: '67890',
            returnPolicyId: '11111',
          },
          pricingSummary: {
            price: { currency: 'USD', value: '99.99' },
          },
          quantityLimitPerBuyer: 5,
          categoryId: '1234',
        };

        const result = decodeResult(offerSchema, validOffer);
        expect(result.success).toBe(true);
      });

      it('require sku and marketplaceId', () => {
        const missingSku = { marketplaceId: 'EBAY_US', format: 'FIXED_PRICE' };
        const missingMarketplace = { sku: 'TEST-001', format: 'FIXED_PRICE' };

        expect(decodeResult(offerSchema, missingSku).success).toBe(false);
        expect(decodeResult(offerSchema, missingMarketplace).success).toBe(false);
      });

      it('validate listing formats', () => {
        const formats = ['FIXED_PRICE', 'AUCTION'];

        formats.forEach((format) => {
          const offer = {
            sku: 'TEST-001',
            marketplaceId: 'EBAY_US',
            format,
          };
          const result = decodeResult(offerSchema, offer);
          expect(result.success).toBe(true);
        });
      });
    });
  });

  describe('Schema Edge Cases', () => {
    it('reject non-object values', () => {
      const schemas = [amountSchema, timeDurationSchema];

      const invalidValues = [null, undefined, 'string', 123, [], true];

      schemas.forEach((schema) => {
        invalidValues.forEach((value) => {
          const result = decodeResult(schema, value);
          expect(result.success).toBe(false);
        });
      });
    });

    it('preserve extra fields with passthrough', () => {
      const schemaWithExtra = decodeResult(amountSchema, {
        currency: 'USD',
        value: '99.99',
        metadata: { source: 'test' },
        customField: 'custom',
      });

      expect(schemaWithExtra.success).toBe(true);
      if (schemaWithExtra.success) {
        expect(schemaWithExtra.data).toHaveProperty('metadata');
        expect(schemaWithExtra.data).toHaveProperty('customField');
      }
    });
  });
});
