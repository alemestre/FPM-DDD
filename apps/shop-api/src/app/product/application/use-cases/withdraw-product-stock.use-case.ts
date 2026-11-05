import { ProductRepository } from "../../domain/product.repository";
import type { Product } from "../../domain/product.entity";
import { Inject } from "@nestjs/common";

export class WithdrawProductStockUseCase {
  constructor(@Inject(ProductRepository) private readonly repository: ProductRepository) {}

  /**
   * @throws {DomainValidationError} If the remaining stock would fall below the minimum stock.
   */
  async execute(id: string, quantity: number): Promise<Product> {
    const product = await this.repository.findByIdOrFail(id);
    product.withdrawStock(quantity);
    return this.repository.save(product);
  }
}
