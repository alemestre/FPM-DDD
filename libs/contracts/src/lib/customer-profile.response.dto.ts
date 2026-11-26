import { GenericEntitySchema } from './generic-entity.dto';
import { z } from 'zod';

export const CustomerAddressResponseSchema = z.object({
    line1: z.string(),
    line2: z.string(),
    postalCode: z.string(),
    city: z.string(),
});

export const CustomerProfileResponseSchema = GenericEntitySchema.extend({
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string(),
    address: CustomerAddressResponseSchema,
});

export type CustomerAddressResponseDto = z.infer<typeof CustomerAddressResponseSchema>;
export type CustomerProfileResponseDto = z.infer<typeof CustomerProfileResponseSchema>;
