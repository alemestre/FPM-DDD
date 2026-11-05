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
  readonly categoryIds?: readonly string[];
}
