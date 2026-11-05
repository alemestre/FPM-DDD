import { ProductRepository } from "../../domain/product.repository";
import type { Product } from "../../domain/product.entity";
import { Inject } from "@nestjs/common";

export class RestockProductUseCase {
  constructor(@Inject(ProductRepository) private readonly repository: ProductRepository) {}

  async execute(id: string, quantity: number): Promise<Product> {
    const product = await this.repository.findByIdOrFail(id);
    product.restock(quantity);
    return this.repository.save(product);
  }
}
