import { z } from 'zod';

export const CustomerAddressResponseSchema = z.object({
    line1: z.string(),
    line2: z.string(),
    postalCode: z.string(),
    city: z.string(),
});

export const CustomerProfileResponseSchema = z.object({
    id: z.uuid(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string(),
    /** `null` when the customer has not given an address. */
    address: CustomerAddressResponseSchema.nullable(),
});

export type CustomerAddressResponseDto = z.infer<typeof CustomerAddressResponseSchema>;
export type CustomerProfileResponseDto = z.infer<typeof CustomerProfileResponseSchema>;
