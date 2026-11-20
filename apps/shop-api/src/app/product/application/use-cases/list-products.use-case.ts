import { ProductFilters, ProductRepository, type ProductWithProducer } from '../../domain/product.repository';
import { Inject } from "@nestjs/common";

export class ListProductsUseCase {
  constructor(@Inject(ProductRepository) private readonly repository: ProductRepository) {}

  /**
   * @param filters
   */
  execute(filters?: ProductFilters): Promise<ProductWithProducer[]> {
    return this.repository.findManyWithProducer({ ...filters });
  }
}
