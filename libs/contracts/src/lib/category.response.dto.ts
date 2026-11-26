import { GenericEntitySchema } from './generic-entity.dto';
import { z } from 'zod';

export const CategoryResponseSchema = GenericEntitySchema.extend({
    name: z.string(),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export type CategoryResponseDto = z.infer<typeof CategoryResponseSchema>;
