import { z } from 'zod';

/**
 * Corps de POST /admin/categories et PATCH /admin/categories/:id.
 * Les règles sur le nom (longueur, espaces retirés…) restent dans le value object Name de l'API.
 */
export const CategoryRequestSchema = z.object({
    name: z.string(),
});

export type CategoryRequestDto = z.infer<typeof CategoryRequestSchema>;
