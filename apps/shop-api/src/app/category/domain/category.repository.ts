import { GenericEntityRepository } from "../../shared/domain/generic-entity.repository";
import type { Category } from "./category.entity";

/**
 * Persistence port for the Category aggregate.
 *
 * Infrastructure adapters implement this abstract class. Application use cases
 * depend on it so the domain stays independent of Prisma or HTTP.
 *
 * `save` and `update` must reject with `CategorySlugAlreadyUsedError` when
 * another category already uses the same slug.
 */
export abstract class CategoryRepository extends GenericEntityRepository<Category> {
  /**
   * Loads a category by its URL slug.
   *
   * @returns The category when it exists, otherwise `null`.
   */
  abstract findBySlug(slug: string): Promise<Category | null>;
}
