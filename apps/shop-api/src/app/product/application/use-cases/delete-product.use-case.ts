import { ProductRepository } from "../../domain/product.repository";
import { Inject } from "@nestjs/common";

export class DeleteProductUseCase {
  constructor(@Inject(ProductRepository) private readonly repository: ProductRepository) {}

  execute(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
