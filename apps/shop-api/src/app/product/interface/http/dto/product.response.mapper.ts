import type { ProductResponseDto, ProductWithProducerResponseDto } from "@fpm/contracts";
import type { ProductWithProducer } from "../../../domain/product.repository";
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
    categoryId: product.categoryId,
    unit: product.unit,
    quantity: product.quantity,
    quantityUnit: product.quantityUnit
  };
}

/**
 * Representation used by the read endpoints: the producer replaces its id.
 */
export function toProductWithProducerResponse({ product, producer }: ProductWithProducer): ProductWithProducerResponseDto {
  return {
    id: product.id,
    name: product.name,
    price: product.price,
    vatRate: product.vatRate,
    stock: product.stock,
    minStock: product.minStock,
    producer: { id: producer.id, name: producer.name },
    categoryId: product.categoryId,
    unit: product.unit,
    quantity: product.quantity,
    quantityUnit: product.quantityUnit
  };
}
