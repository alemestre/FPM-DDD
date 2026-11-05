import { ProductRepository } from "../../domain/product.repository";
import type { Product } from "../../domain/product.entity";
import { Inject } from "@nestjs/common";

export class GetProductUseCase {
  constructor(@Inject(ProductRepository) private readonly repository: ProductRepository) {}

  execute(id: string): Promise<Product> {
    return this.repository.findByIdOrFail(id);
  }
}
