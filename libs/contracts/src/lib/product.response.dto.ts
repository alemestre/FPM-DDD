import { z } from 'zod';

export const ProductResponseSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    price: z.number(),
    vatRate: z.number(),
    stock: z.number().int(),
    minStock: z.number().int(),
    producerId: z.uuid(),
    categoryId: z.uuid(),
});

export type ProductResponseDto = z.infer<typeof ProductResponseSchema>;
