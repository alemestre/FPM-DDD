import { ProductRepository, type ProductWithProducer } from "../../domain/product.repository";
import { Inject } from "@nestjs/common";

export class GetProductUseCase {
  constructor(@Inject(ProductRepository) private readonly repository: ProductRepository) {}

  execute(id: string): Promise<ProductWithProducer> {
    return this.repository.findByIdWithProducerOrFail(id);
  }
}
