import { MAX_QUANTITY_PER_PRODUCT } from '../../../domain/cart-line.value-object';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** The stock is checked by the domain. */
export const AddCartItemSchema = z.strictObject({
    productId: z.uuid(),
    quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_PRODUCT),
});

export class AddCartItemDto extends createZodDto(AddCartItemSchema) {}
