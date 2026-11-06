import type { CategoryResponseDto } from "@fpm/contracts";
import type { Category } from "../../../domain/category.entity";

/**
 * Maps the aggregate to its public HTTP representation. Serializing the entity
 * directly would expose its private Name value object.
 */
export function toCategoryResponse(category: Category): CategoryResponseDto {
  return { id: category.id, name: category.name };
}
