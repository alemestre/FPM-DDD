import type { ProductContentProps } from "../domain/value-objects/product-content.value-object";

/**
 * Partial product update. Stock quantity is changed only through the
 * dedicated restock / withdraw use cases.
 */
export interface UpdateProductInput {
  readonly name?: string;
  readonly price?: number;
  readonly vatRate?: number;
  readonly minStock?: number;
  readonly producerId?: string;
  readonly categoryId?: string;
  readonly image?: string;
  readonly unit?: string;
  /** `null` removes the content. */
  readonly content?: ProductContentProps | null;
}
