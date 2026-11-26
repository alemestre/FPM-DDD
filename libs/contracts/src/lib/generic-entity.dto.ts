import { z } from 'zod';

/**
 * Properties shared by every entity in the HTTP responses. Entity schemas extend it:
 * `GenericEntitySchema.extend({ ... })`.
 * Only the id is common: the entities expose no other shared field (only orders have `createdAt`).
 */
export const GenericEntitySchema = z.object({
    id: z.uuid(),
});

export type GenericEntity = z.infer<typeof GenericEntitySchema>;
