import type { Category } from "../../../domain/category.entity";
import { z } from "zod";

export const CategoryResponseSchema = z.object({
  id: z.uuid(),
  name: z.string()
});

export type CategoryResponseDto = z.infer<typeof CategoryResponseSchema>;

/**
 * Maps the aggregate to its public HTTP representation. Serializing the entity
 * directly would expose its private Name value object.
 */
export function toCategoryResponse(category: Category): CategoryResponseDto {
  return { id: category.id, name: category.name };
}
