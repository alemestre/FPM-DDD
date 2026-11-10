import { ProductRepository } from "../../domain/product.repository";
import type { UpdateProductInput } from "../update-product.input";
import type { Product } from "../../domain/product.entity";
import { Inject } from "@nestjs/common";

export class UpdateProductUseCase {
  constructor(@Inject(ProductRepository) private readonly repository: ProductRepository) {}

  /**
   * Applies a partial update through the Product aggregate so every change
   * goes through the domain invariants, then persists the whole aggregate.
   *
   * @throws {ProductReferenceNotFoundError} If the new producer or the new category does not exist.
   */
  async execute(id: string, input: UpdateProductInput): Promise<Product> {
    const { name, price, vatRate, minStock, producerId, categoryId, unit, quantity, quantityUnit } = input;
    const product = await this.repository.findByIdOrFail(id);

    if (name !== undefined) product.changeName(name);
    if (price !== undefined) product.changePrice(price);
    if (vatRate !== undefined) product.changeVatRate(vatRate);
    if (minStock !== undefined) product.changeMinStock(minStock);
    if (producerId !== undefined) product.changeProducer(producerId);
    if (categoryId !== undefined) product.changeCategory(categoryId);
    if (unit !== undefined || quantity !== undefined || quantityUnit !== undefined) {
      // One atomic change, so a product can switch to BOUTEILLE with its quantity in a single PATCH.
      product.changeSaleUnit(
        unit ?? product.unit,
        quantity === undefined ? product.quantity : quantity,
        quantityUnit === undefined ? product.quantityUnit : quantityUnit
      );
    }

    return this.repository.save(product);
  }
}
