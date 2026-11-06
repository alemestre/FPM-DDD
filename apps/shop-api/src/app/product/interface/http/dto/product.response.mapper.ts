import type { ProductResponseDto } from "@fpm/contracts";
import type { Product } from "../../../domain/product.entity";

/**
 * Maps the aggregate to its public HTTP representation. Serializing the entity
 * directly would expose its private value objects instead of its getters.
 */
export function toProductResponse(product: Product): ProductResponseDto {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    vatRate: product.vatRate,
    stock: product.stock,
    minStock: product.minStock,
    producerId: product.producerId,
    categoryIds: product.categoryIds
  };
}
