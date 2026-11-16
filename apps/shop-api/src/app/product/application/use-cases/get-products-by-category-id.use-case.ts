import { ProductRepository, type ProductWithProducer } from "../../domain/product.repository";
import { Inject } from "@nestjs/common";

export class GetProductsByCategoryIdUseCase {
  constructor(@Inject(ProductRepository) private readonly repository: ProductRepository) {}

  /**
   * @param isAvailable Keeps only available (true) or unavailable (false) products; all when omitted.
   */
  execute(categoryId: string, isAvailable?: boolean): Promise<ProductWithProducer[]> {
    return this.repository.findManyWithProducer({ categoryId, isAvailable });
  }
}
