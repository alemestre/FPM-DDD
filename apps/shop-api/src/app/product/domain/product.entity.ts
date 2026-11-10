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
import { ProductQuantity } from "./value-objects/product-quantity.value-object";
import type { QuantityUnitValue } from "./value-objects/quantity-unit.value-object";
import { DomainValidationError } from "../../shared/domain/errors/domain-validation.error";

/**
 * A product sold by a producer, classified in exactly one category.
 * Producer and category are other aggregates and are referenced by id only.
 *
 * Sale unit rules: the quantity (amount + unit) is optional, except for
 * CONDITIONNEMENT and BOUTEILLE where it is required.
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
    private _unit: ProductUnit,
    private _quantity: ProductQuantity | null
  ) {}

  static create(
    name: string,
    price: number,
    vatRate: number,
    stock: number,
    minStock: number,
    producerId: string,
    categoryId: string,
    unit: string = DEFAULT_PRODUCT_UNIT,
    quantity: number | null = null,
    quantityUnit: string | null = null
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
      unit,
      quantity,
      quantityUnit
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
    unit: string,
    quantity: number | null = null,
    quantityUnit: string | null = null
  ): Product {
    const saleUnit = ProductUnit.create(unit);
    const productQuantity = ProductQuantity.fromNullable(quantity, quantityUnit);
    Product.assertQuantityAllowed(saleUnit, productQuantity);

    return new Product(
      id,
      Name.create(name),
      PositiveAmount.create(price),
      Percentage.create(vatRate),
      Stock.create(stock, minStock),
      Product.validateId(producerId),
      Product.validateId(categoryId),
      saleUnit,
      productQuantity
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

  get quantity(): number | null {
    return this._quantity?.amount ?? null;
  }

  get quantityUnit(): QuantityUnitValue | null {
    return this._quantity?.unit ?? null;
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

  /**
   * Changes the sale unit and keeps the current quantity.
   *
   * @throws {DomainValidationError} If the new unit requires a quantity the product does not have.
   */
  changeUnit(unit: string): void {
    this.changeSaleUnit(unit, this.quantity, this.quantityUnit);
  }

  /**
   * Sets the quantity and its unit, or removes both with `null`.
   *
   * @throws {DomainValidationError} If only one is given, or if the sale unit requires a quantity.
   */
  changeQuantity(quantity: number | null, quantityUnit: string | null): void {
    this.changeSaleUnit(this.unit, quantity, quantityUnit);
  }

  /**
   * Changes the sale unit and the quantity together, so a product can switch
   * to a unit that requires a quantity in a single valid step.
   * Nothing changes if a rule is broken.
   *
   * @throws {DomainValidationError} If a value is invalid or the sale unit rules are broken.
   */
  changeSaleUnit(unit: string, quantity: number | null, quantityUnit: string | null): void {
    const saleUnit = ProductUnit.create(unit);
    const productQuantity = ProductQuantity.fromNullable(quantity, quantityUnit);
    Product.assertQuantityAllowed(saleUnit, productQuantity);

    this._unit = saleUnit;
    this._quantity = productQuantity;
  }

  /**
   * @throws {DomainValidationError} If the sale unit requires a quantity and none is given.
   */
  private static assertQuantityAllowed(unit: ProductUnit, quantity: ProductQuantity | null): void {
    if (unit.requiresQuantity() && quantity === null) {
      throw new DomainValidationError(
        `Un produit vendu en ${unit.value} doit avoir une quantité et une unité de quantité`
      );
    }
  }

  private static validateId(id: string): string {
    Uuid.validate(id);
    return id;
  }
}
