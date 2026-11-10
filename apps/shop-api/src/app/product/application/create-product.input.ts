export interface CreateProductInput {
  readonly name: string;
  readonly price: number;
  readonly vatRate: number;
  readonly stock: number;
  readonly minStock: number;
  readonly producerId: string;
  readonly categoryId: string;
}
