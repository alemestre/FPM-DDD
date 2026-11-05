import { GenericEntityRepository } from "../../shared/domain/generic-entity.repository";
import type { Category } from "./category.entity";

/**
 * Persistence port for the Category aggregate.
 *
 * Infrastructure adapters implement this abstract class. Application use cases
 * depend on it so the domain stays independent of Prisma or HTTP.
 */
export abstract class CategoryRepository extends GenericEntityRepository<Category> {}
