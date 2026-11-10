import { z } from 'zod';

export const ProductUnitSchema = z.enum(['KG', 'BOTTE', 'PIECE']);

export type ProductUnitDto = z.infer<typeof ProductUnitSchema>;

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
});

export type ProductResponseDto = z.infer<typeof ProductResponseSchema>;
