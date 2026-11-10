import { DomainValidationError } from "../../../shared/domain/errors/domain-validation.error";
import { QuantityUnit, type QuantityUnitValue } from "./quantity-unit.value-object";

/**
 * Quantity contained in one sale unit of a product (e.g. 75 cl in a bottle,
 * 500 g in a package). The amount and its unit only exist together.
 */
export class ProductQuantity {
  private constructor(
    public readonly amount: number,
    private readonly _unit: QuantityUnit
  ) {}

  /**
   * @throws {DomainValidationError} If the amount is not strictly positive or the unit is unknown.
   */
  static create(amount: number, unit: string): ProductQuantity {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new DomainValidationError("La quantité doit être strictement supérieure à 0");
    }

    return new ProductQuantity(amount, QuantityUnit.create(unit));
  }

  /**
   * Builds the quantity from optional values: both `null` means no quantity.
   *
   * @throws {DomainValidationError} If only one of the amount and the unit is given.
   */
  static fromNullable(amount: number | null, unit: string | null): ProductQuantity | null {
    if (amount === null && unit === null) return null;

    if (amount === null || unit === null) {
      throw new DomainValidationError(
        "La quantité et son unité doivent être renseignées ensemble"
      );
    }

    return ProductQuantity.create(amount, unit);
  }

  get unit(): QuantityUnitValue {
    return this._unit.value;
  }

  equals(other: ProductQuantity): boolean {
    return this.amount === other.amount && this.unit === other.unit;
  }
}
