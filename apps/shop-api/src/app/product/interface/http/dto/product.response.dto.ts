import type { Product } from "../../../domain/product.entity";
import { z } from "zod";

export const ProductResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  price: z.number(),
  vatRate: z.number(),
  stock: z.number().int(),
  minStock: z.number().int(),
  producerId: z.uuid(),
  categoryIds: z.array(z.uuid())
});

export type ProductResponseDto = z.infer<typeof ProductResponseSchema>;

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
