import { ProductRepository } from "../../domain/product.repository";
import type { Product } from "../../domain/product.entity";
import { Inject } from "@nestjs/common";

export class ListProductsUseCase {
  constructor(@Inject(ProductRepository) private readonly repository: ProductRepository) {}

  execute(): Promise<Product[]> {
    return this.repository.findAll();
  }
}
