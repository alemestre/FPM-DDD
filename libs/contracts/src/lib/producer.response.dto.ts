import { z } from 'zod';

export const ProducerResponseSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
    vatNumber: z.string(),
    addressLine1: z.string(),
    addressLine2: z.string(),
    postalCode: z.string(),
    city: z.string(),
    isActive: z.boolean(),
});

export type ProducerResponseDto = z.infer<typeof ProducerResponseSchema>;
