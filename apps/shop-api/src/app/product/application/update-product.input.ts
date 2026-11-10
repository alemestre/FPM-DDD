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
  readonly unit?: string;
  /** `quantity` and `quantityUnit` set to `null` remove the quantity. */
  readonly quantity?: number | null;
  readonly quantityUnit?: string | null;
}
