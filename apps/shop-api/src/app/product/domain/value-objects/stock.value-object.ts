import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import { Quantity } from '../../../shared/domain/value-objects/quantity.value-object';

/**
 * Stock level of a product. The available quantity can never fall below the
 * minimum stock. Every operation returns a new Stock, so a rejected change
 * leaves the previous value untouched.
 */
export class Stock {
  private constructor(
    private readonly _quantity: Quantity,
    private readonly _minimum: Quantity,
  ) {}

  /**
   * @throws {DomainValidationError} If a value is not a non-negative integer or if quantity < minimum.
   */
  static create(quantity: number, minimum: number): Stock {
    return Stock.from(Quantity.create(quantity), Quantity.create(minimum));
  }

  private static from(quantity: Quantity, minimum: Quantity): Stock {
    if (quantity.isLessThan(minimum)) {
      throw new DomainValidationError(
        `Le stock (${quantity.value}) ne peut pas être inférieur au stock minimum (${minimum.value})`,
      );
    }

    return new Stock(quantity, minimum);
  }

  get quantity(): number {
    return this._quantity.value;
  }

  get minimum(): number {
    return this._minimum.value;
  }

  increase(quantity: number): Stock {
    return Stock.from(this._quantity.add(Stock.movement(quantity)), this._minimum);
  }

  /**
   * @throws {DomainValidationError} If the remaining stock would fall below the minimum.
   */
  decrease(quantity: number): Stock {
    return Stock.from(this._quantity.subtract(Stock.movement(quantity)), this._minimum);
  }

  withMinimum(minimum: number): Stock {
    return Stock.from(this._quantity, Quantity.create(minimum));
  }

  private static movement(quantity: number): Quantity {
    const movement = Quantity.create(quantity);
    if (movement.value === 0) {
      throw new DomainValidationError('Un mouvement de stock doit porter sur au moins une unité');
    }
    return movement;
  }

  equals(other: Stock): boolean {
    return this._quantity.equals(other._quantity) && this._minimum.equals(other._minimum);
  }
}
