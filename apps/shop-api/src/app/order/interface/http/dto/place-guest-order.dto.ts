import { BillingAddressSchema, OrderItemsSchema } from './place-order.dto';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/** Order of a guest, who gives the contact details the shop will use to reach them. */
export const PlaceGuestOrderSchema = z.strictObject({
    items: OrderItemsSchema,
    contact: z.strictObject({
        firstName: z.string().trim().min(1).max(100),
        lastName: z.string().trim().min(1).max(100),
        email: z.string().trim().min(1),
        phone: z.string().trim().min(1),
    }),
    billingAddress: BillingAddressSchema,
});

export class PlaceGuestOrderDto extends createZodDto(PlaceGuestOrderSchema) {}
