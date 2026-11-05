import { GenericEntityRepository } from "../../shared/domain/generic-entity.repository";
import { Product } from "./product.entity";

/**
 * Persistence port for the Product aggregate.
 *
 * Infrastructure adapters implement this abstract class. Application use cases
 * depend on it so the domain stays independent of Prisma or HTTP.
 *
 * `save` and `update` must reject with `ProductReferenceNotFoundError` when the
 * product points to a producer or a category that does not exist.
 */
export abstract class ProductRepository extends GenericEntityRepository<Product> {}
