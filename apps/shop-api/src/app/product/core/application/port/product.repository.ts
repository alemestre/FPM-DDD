import { GenericEntityRepository } from "../../../../core/application/generic-entity.repository";
import type { Product } from "../../domain/product.entity";

/**
 * Persistence port for the Product aggregate.
 *
 * Infrastructure adapters implement this abstract class. Application use cases
 * depend on it so the domain stays independent of Prisma or HTTP.
 */
export abstract class ProductRepository extends GenericEntityRepository<Product>{
}
