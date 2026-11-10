import { PositiveAmount } from "../../shared/domain/value-objects/positive-amount.value-object";
import { Percentage } from "../../shared/domain/value-objects/percentage.value-object";
import { Name } from "../../shared/domain/value-objects/name.value-object";
import { Uuid } from "../../shared/domain/value-objects/uuid.value-object";
import { Stock } from "./value-objects/stock.value-object";
import {
  DEFAULT_PRODUCT_UNIT,
  ProductUnit,
  type ProductUnitValue
} from "./value-objects/product-unit.value-object";

/**
 * A product sold by a producer, classified in exactly one category.
 * Producer and category are other aggregates and are referenced by id only.
 */
export class Product {
  private constructor(
    public readonly id: string,
    private _name: Name,
    private _price: PositiveAmount,
    private _vatRate: Percentage,
    private _stock: Stock,
    private _producerId: string,
    private _categoryId: string,
    private _unit: ProductUnit
  ) {}

  static create(
    name: string,
    price: number,
    vatRate: number,
    stock: number,
    minStock: number,
    producerId: string,
    categoryId: string,
    unit: string = DEFAULT_PRODUCT_UNIT
  ): Product {
    return Product.reconstitute(
      new Uuid().getValue(),
      name,
      price,
      vatRate,
      stock,
      minStock,
      producerId,
      categoryId,
      unit
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
    categoryId: string,
    unit: string
  ): Product {
    return new Product(
      id,
      Name.create(name),
      PositiveAmount.create(price),
      Percentage.create(vatRate),
      Stock.create(stock, minStock),
      Product.validateId(producerId),
      Product.validateId(categoryId),
      ProductUnit.create(unit)
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

  get categoryId(): string {
    return this._categoryId;
  }

  get unit(): ProductUnitValue {
    return this._unit.value;
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

  changeCategory(categoryId: string): void {
    this._categoryId = Product.validateId(categoryId);
  }

  changeUnit(unit: string): void {
    this._unit = ProductUnit.create(unit);
  }

  private static validateId(id: string): string {
    Uuid.validate(id);
    return id;
  }
}
