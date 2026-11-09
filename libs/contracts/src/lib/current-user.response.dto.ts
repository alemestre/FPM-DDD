import { z } from 'zod';

export const CurrentUserResponseSchema = z.object({
    id: z.uuid(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    role: z.enum(['ADMIN', 'CUSTOMER'])
});

export type CurrentUserResponseDto = z.infer<typeof CurrentUserResponseSchema>;
