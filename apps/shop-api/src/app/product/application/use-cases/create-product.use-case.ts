import { ProductRepository } from "../../domain/product.repository";
import type { CreateProductInput } from "../create-product.input";
import { Product } from "../../domain/product.entity";
import { Inject } from "@nestjs/common";

export class CreateProductUseCase {
  constructor(@Inject(ProductRepository) private readonly repository: ProductRepository) {}

  /**
   * @throws {DomainValidationError} If a product invariant is broken.
   * @throws {ProductReferenceNotFoundError} If the producer or the category does not exist.
   */
  async execute(input: CreateProductInput): Promise<Product> {
    const { name, price, vatRate, stock, minStock, producerId, categoryId, unit } = input;
    const product = Product.create(name, price, vatRate, stock, minStock, producerId, categoryId, unit);

    return this.repository.save(product);
  }
}
