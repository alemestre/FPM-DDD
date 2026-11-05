import { PositiveAmount } from "../../shared/domain/value-objects/positive-amount.value-object";
import { Percentage } from "../../shared/domain/value-objects/percentage.value-object";
import { Name } from "../../shared/domain/value-objects/name.value-object";
import { Uuid } from "../../shared/domain/value-objects/uuid.value-object";
import { Stock } from "./value-objects/stock.value-object";

/**
 * A product sold by a producer, classified in zero or more categories.
 * Producer and categories are other aggregates and are referenced by id only.
 */
export class Product {
  private constructor(
    public readonly id: string,
    private _name: Name,
    private _price: PositiveAmount,
    private _vatRate: Percentage,
    private _stock: Stock,
    private _producerId: string,
    private _categoryIds: readonly string[]
  ) {}

  static create(
    name: string,
    price: number,
    vatRate: number,
    stock: number,
    minStock: number,
    producerId: string,
    categoryIds: readonly string[] = []
  ): Product {
    return Product.reconstitute(
      new Uuid().getValue(),
      name,
      price,
      vatRate,
      stock,
      minStock,
      producerId,
      categoryIds
    );
  }

  static reconstitute(
    id: string,
    name: string,
    price: number,
    vatRate: number,
    stock: number,
    minStock: number,
    producerId: string,
    categoryIds: readonly string[]
  ): Product {
    return new Product(
      id,
      Name.create(name),
      PositiveAmount.create(price),
      Percentage.create(vatRate),
      Stock.create(stock, minStock),
      Product.validateId(producerId),
      Product.normalizeCategoryIds(categoryIds)
    );
  }

  get name(): string {
    return this._name.toString();
  }

  get price(): number {
    return this._price.value;
  }

  get vatRate(): number {
    return this._vatRate.value;
  }

  get stock(): number {
    return this._stock.quantity;
  }

  get minStock(): number {
    return this._stock.minimum;
  }

  get producerId(): string {
    return this._producerId;
  }

  get categoryIds(): string[] {
    return [...this._categoryIds];
  }

  changeName(name: string): void {
    this._name = Name.create(name);
  }

  changePrice(price: number): void {
    this._price = PositiveAmount.create(price);
  }

  changeVatRate(vatRate: number): void {
    this._vatRate = Percentage.create(vatRate);
  }

  /**
   * Adds units to the stock.
   */
  restock(quantity: number): void {
    this._stock = this._stock.increase(quantity);
  }

  /**
   * Removes units from the stock.
   *
   * @throws {DomainValidationError} If the remaining stock would fall below the minimum stock.
   */
  withdrawStock(quantity: number): void {
    this._stock = this._stock.decrease(quantity);
  }

  /**
   * @throws {DomainValidationError} If the current stock is below the new minimum.
   */
  changeMinStock(minStock: number): void {
    this._stock = this._stock.withMinimum(minStock);
  }

  changeProducer(producerId: string): void {
    this._producerId = Product.validateId(producerId);
  }

  changeCategories(categoryIds: readonly string[]): void {
    this._categoryIds = Product.normalizeCategoryIds(categoryIds);
  }

  private static validateId(id: string): string {
    Uuid.validate(id);
    return id;
  }

  private static normalizeCategoryIds(categoryIds: readonly string[]): readonly string[] {
    return [...new Set(categoryIds)].map((id) => Product.validateId(id));
  }
}
