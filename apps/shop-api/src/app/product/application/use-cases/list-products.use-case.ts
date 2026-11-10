import { ProductRepository, type ProductWithProducer } from "../../domain/product.repository";
import { Inject } from "@nestjs/common";

export class ListProductsUseCase {
  constructor(@Inject(ProductRepository) private readonly repository: ProductRepository) {}

  execute(): Promise<ProductWithProducer[]> {
    return this.repository.findManyWithProducer();
  }
}
