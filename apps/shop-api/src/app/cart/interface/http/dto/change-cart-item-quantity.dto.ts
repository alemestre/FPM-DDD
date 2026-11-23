import { MAX_QUANTITY_PER_PRODUCT } from '../../../domain/cart-line.value-object';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** The stock is checked by the domain. */
export const ChangeCartItemQuantitySchema = z.strictObject({
    quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_PRODUCT),
});

export class ChangeCartItemQuantityDto extends createZodDto(ChangeCartItemQuantitySchema) {}
