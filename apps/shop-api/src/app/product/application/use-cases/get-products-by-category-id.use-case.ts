import { ProductRepository, type ProductWithProducer } from "../../domain/product.repository";
import { Inject } from "@nestjs/common";

export class GetProductsByCategoryIdUseCase {
  constructor(@Inject(ProductRepository) private readonly repository: ProductRepository) {}

  execute(categoryId: string): Promise<ProductWithProducer[]> {
    return this.repository.findManyWithProducer(categoryId);
  }
}
