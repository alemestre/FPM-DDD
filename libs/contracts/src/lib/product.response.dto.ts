import { z } from 'zod';

export const ProductUnitSchema = z.enum(['KG', 'BOTTE', 'PIECE', 'DOUZAINE', 'BOUTEILLE', 'LOT']);

export type ProductUnitDto = z.infer<typeof ProductUnitSchema>;

export const MeasureUnitSchema = z.enum(['g', 'kg', 'ml', 'l']);

export type MeasureUnitDto = z.infer<typeof MeasureUnitSchema>;

export const MeasureSchema = z.object({
    amount: z.number().positive(),
    unit: MeasureUnitSchema,
});

/**
 * What one sale unit contains: `itemCount` items of `itemSize` each (4 × 125 g),
 * or items without size (12 eggs).
 */
export const ProductContentSchema = z.object({
    itemCount: z.number().int().min(1),
    itemSize: MeasureSchema.nullable(),
});

export type ProductContentDto = z.infer<typeof ProductContentSchema>;

/**
 * Price per kilogram or per litre, used to compare products.
 */
export const ReferencePriceSchema = z.object({
    amount: z.number().nonnegative(),
    unit: z.enum(['kg', 'l']),
});

export type ReferencePriceDto = z.infer<typeof ReferencePriceSchema>;

export const ProductResponseSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    price: z.number(),
    vatRate: z.number(),
    stock: z.number().int(),
    minStock: z.number().int(),
    producerId: z.uuid(),
    categoryId: z.uuid(),
    image: z.url(),
    unit: ProductUnitSchema,
    content: ProductContentSchema.nullable(),
    referencePrice: ReferencePriceSchema.nullable(),
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
