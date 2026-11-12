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
import { ProductContent, type ProductContentProps } from "./value-objects/product-content.value-object";
import type { ReferenceUnitValue } from "./value-objects/measure.value-object";
import { ImageUrl } from "./value-objects/image-url.value-object";

/**
 * A product sold by a producer, classified in exactly one category.
 * Producer and category are other aggregates and are referenced by id only.
 *
 * The sale unit sets the rules of the content (what one sale unit contains):
 * see {@link ProductUnit.resolveContent}.
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
    private _image: ImageUrl,
    private _unit: ProductUnit,
    private _content: ProductContent | null
  ) {}

  static create(
    name: string,
    price: number,
    vatRate: number,
    stock: number,
    minStock: number,
    producerId: string,
    categoryId: string,
    image: string,
    unit: string = DEFAULT_PRODUCT_UNIT,
    content: ProductContentProps | null = null
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
      image,
      unit,
      content
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
    image: string,
    unit: string,
    content: ProductContentProps | null = null
  ): Product {
    const saleUnit = ProductUnit.create(unit);
    const productContent = saleUnit.resolveContent(ProductContent.fromNullable(content));

    return new Product(
      id,
      Name.create(name),
      PositiveAmount.create(price),
      Percentage.create(vatRate),
      Stock.create(stock, minStock),
      Product.validateId(producerId),
      Product.validateId(categoryId),
      ImageUrl.create(image),
      saleUnit,
      productContent
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

  get image(): string {
    return this._image.value;
  }

  get unit(): ProductUnitValue {
    return this._unit.value;
  }

  get content(): ProductContent | null {
    return this._content;
  }

  /**
   * Price per kilogram or per litre, shown next to the price so products can be compared:
   * the price itself for KG, computed from the content otherwise (3 € for 4 × 125 g → 6 €/kg).
   * `null` when the content has no measure (a bunch, a dozen eggs).
   */
  get referencePrice(): { amount: number; unit: ReferenceUnitValue } | null {
    if (this._unit.isSoldByWeight()) return { amount: this.price, unit: "kg" };

    const total = this._content?.totalInReferenceUnit() ?? null;
    if (total === null) return null;

    return { amount: Math.round((this.price / total.amount) * 100) / 100, unit: total.unit };
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
   * @throws {DomainValidationError} If the image is not an absolute http(s) URL.
   */
  changeImage(image: string): void {
    this._image = ImageUrl.create(image);
  }

  /**
   * Changes the sale unit and keeps the current content.
   *
   * @throws {DomainValidationError} If the current content breaks a rule of the new unit.
   */
  changeUnit(unit: string): void {
    this.applySaleUnit(ProductUnit.create(unit), this._content);
  }

  /**
   * Sets the content, or removes it with `null`.
   *
   * @throws {DomainValidationError} If the content is invalid or breaks a rule of the sale unit.
   */
  changeContent(content: ProductContentProps | null): void {
    this.applySaleUnit(this._unit, ProductContent.fromNullable(content));
  }

  /**
   * Changes the sale unit and the content together, so a product can switch
   * to a unit that requires a content in a single valid step.
   * Nothing changes if a rule is broken.
   *
   * @throws {DomainValidationError} If a value is invalid or the sale unit rules are broken.
   */
  changeSaleUnit(unit: string, content: ProductContentProps | null): void {
    this.applySaleUnit(ProductUnit.create(unit), ProductContent.fromNullable(content));
  }

  private applySaleUnit(unit: ProductUnit, content: ProductContent | null): void {
    const resolved = unit.resolveContent(content);

    this._unit = unit;
    this._content = resolved;
  }

  private static validateId(id: string): string {
    Uuid.validate(id);
    return id;
  }
}
