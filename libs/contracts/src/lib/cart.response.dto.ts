import { ProductWithProducerResponseSchema } from './product.response.dto';
import { z } from 'zod';

export const CartItemResponseSchema = z.object({
    product: ProductWithProducerResponseSchema,
    quantity: z.number().int().min(1),
});

export type CartItemResponseDto = z.infer<typeof CartItemResponseSchema>;

/** Cart of the signed-in customer, lines in the order they were added. */
export const CartResponseSchema = z.object({
    items: z.array(CartItemResponseSchema),
});

export type CartResponseDto = z.infer<typeof CartResponseSchema>;
