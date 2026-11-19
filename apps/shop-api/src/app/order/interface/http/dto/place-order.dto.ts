import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** Upper bounds mirror the storefront cart (50 products, 99 units each). */
const MAX_ITEMS = 50;
const MAX_QUANTITY = 99;

export const OrderItemsSchema = z
    .array(
        z.strictObject({
            productId: z.uuid(),
            quantity: z.number().int().min(1).max(MAX_QUANTITY),
        }),
    )
    .min(1)
    .max(MAX_ITEMS);

/** Phone and postal code rules are enforced by the domain. */
export const BillingAddressSchema = z.strictObject({
    line1: z.string().trim().min(1),
    line2: z.string().trim().optional(),
    postalCode: z.string().trim().min(1),
    city: z.string().trim().min(1),
});

/**
 * Order of the signed-in customer. Only the products and quantities are sent:
 * prices come from the catalog and the contact details from the account.
 */
export const PlaceOrderSchema = z.strictObject({
    items: OrderItemsSchema,
    billingAddress: BillingAddressSchema,
});

export class PlaceOrderDto extends createZodDto(PlaceOrderSchema) {}
