import { z } from 'zod';

export const ProductUnitSchema = z.enum(['KG', 'BOTTE', 'PIECE', 'CONDITIONNEMENT', 'BOUTEILLE']);

export type ProductUnitDto = z.infer<typeof ProductUnitSchema>;

export const QuantityUnitSchema = z.enum(['pcs', 'g', 'ml', 'kg', 'l']);

export type QuantityUnitDto = z.infer<typeof QuantityUnitSchema>;

export const ProductResponseSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    price: z.number(),
    vatRate: z.number(),
    stock: z.number().int(),
    minStock: z.number().int(),
    producerId: z.uuid(),
    categoryId: z.uuid(),
    unit: ProductUnitSchema,
    quantity: z.number().positive().nullable(),
    quantityUnit: QuantityUnitSchema.nullable(),
});

export type ProductResponseDto = z.infer<typeof ProductResponseSchema>;

export const ProducerSummarySchema = z.object({
    id: z.uuid(),
    name: z.string(),
});

export type ProducerSummaryDto = z.infer<typeof ProducerSummarySchema>;

/**
 * Product as returned by the read endpoints: the producer is embedded instead of its id.
 */
export const ProductWithProducerResponseSchema = ProductResponseSchema.omit({ producerId: true }).extend({
    producer: ProducerSummarySchema,
});

export type ProductWithProducerResponseDto = z.infer<typeof ProductWithProducerResponseSchema>;
