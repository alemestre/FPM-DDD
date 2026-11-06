import { z } from 'zod';

export const CategoryResponseSchema = z.object({
    id: z.uuid(),
    name: z.string(),
});

export type CategoryResponseDto = z.infer<typeof CategoryResponseSchema>;
