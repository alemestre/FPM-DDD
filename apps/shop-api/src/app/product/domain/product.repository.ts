import { GenericEntityRepository } from "../../shared/domain/generic-entity.repository";
import { Product } from "./product.entity";

/**
 * Product read with the producer it belongs to. The aggregate itself only keeps
 * the producer id: the name is read alongside it for display.
 */
export type ProductWithProducer = {
  product: Product;
  producer: { id: string; name: string };
};

/**
 * Persistence port for the Product aggregate.
 *
 * Infrastructure adapters implement this abstract class. Application use cases
 * depend on it so the domain stays independent of Prisma or HTTP.
 *
 * `save` and `update` must reject with `ProductReferenceNotFoundError` when the
 * product points to a producer or a category that does not exist.
 */
export abstract class ProductRepository extends GenericEntityRepository<Product> {
  /**
   * Lists products with their producer, optionally restricted to one category.
   */
  abstract findManyWithProducer(categoryId?: string): Promise<ProductWithProducer[]>;

  /**
   * @throws {NotFoundException} If the product does not exist.
   */
  abstract findByIdWithProducerOrFail(id: string): Promise<ProductWithProducer>;
}
