import { GenericEntitySchema } from './generic-entity.dto';
import { z } from 'zod';

export const OrderStatusSchema = z.enum([
    'PENDING',
    'PREPARING',
    'READY',
    'COMPLETED',
    'CANCELLED',
]);

export const OrderContactResponseSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    phone: z.string(),
});

export const OrderBillingAddressResponseSchema = z.object({
    line1: z.string(),
    line2: z.string(),
    postalCode: z.string(),
    city: z.string(),
});

export const OrderItemResponseSchema = z.object({
    productId: z.uuid(),
    productName: z.string(),
    /** Unit price excluding VAT when ordered. */
    unitPrice: z.number(),
    /** VAT rate in percent. */
    vatRate: z.number(),
    /** Quantity ordered by the customer. */
    quantity: z.number().int(),
    /** Quantity kept by the shop: 0 when the product was removed. The totals use it. */
    confirmedQuantity: z.number().int(),
    /** Line total including VAT: line subtotal + line VAT rounded to the cent. */
    total: z.number(),
});

export const OrderResponseSchema = GenericEntitySchema.extend({
    /** YYYY-MM-N, e.g. 2026-11-7. */
    number: z.string(),
    status: OrderStatusSchema,
    /** The shop changed at least one quantity or removed a product. */
    isModified: z.boolean(),
    /** ISO date-time. */
    createdAt: z.string(),
    /** Indicative pickup day at the shop, YYYY-MM-DD. */
    estimatedPickupDate: z.string(),
    contact: OrderContactResponseSchema,
    billingAddress: OrderBillingAddressResponseSchema,
    items: z.array(OrderItemResponseSchema),
    /** Totals rounded to the cent: excluding VAT, VAT, including VAT. */
    subtotal: z.number(),
    tax: z.number(),
    total: z.number(),
});

export type OrderStatusDto = z.infer<typeof OrderStatusSchema>;
export type OrderItemResponseDto = z.infer<typeof OrderItemResponseSchema>;
export type OrderResponseDto = z.infer<typeof OrderResponseSchema>;
