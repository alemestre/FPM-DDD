import type { ProductContentProps } from "../domain/value-objects/product-content.value-object";

export interface CreateProductInput {
  readonly name: string;
  readonly price: number;
  readonly vatRate: number;
  readonly stock: number;
  readonly minStock: number;
  readonly producerId: string;
  readonly categoryId: string;
  /** Absolute http(s) URL. */
  readonly image: string;
  /** Defaults to KG when omitted. */
  readonly unit?: string;
  /** What one sale unit contains (4 × 125 g). Required or forbidden depending on the unit. */
  readonly content?: ProductContentProps | null;
}
