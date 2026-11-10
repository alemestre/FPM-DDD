import { DomainValidationError } from "../../../shared/domain/errors/domain-validation.error";

export const QUANTITY_UNITS = ["pcs", "g", "ml", "kg", "l"] as const;

export type QuantityUnitValue = (typeof QUANTITY_UNITS)[number];

/**
 * Unit of the quantity contained in a product: pieces (pcs), grams (g),
 * millilitres (ml), kilograms (kg) or litres (l).
 */
export class QuantityUnit {
  private constructor(public readonly value: QuantityUnitValue) {}

  /**
   * @throws {DomainValidationError} If the value is not a known quantity unit.
   */
  static create(value: string): QuantityUnit {
    if (!QuantityUnit.isValid(value)) {
      throw new DomainValidationError(
        `L'unité de quantité doit être l'une des valeurs suivantes : ${QUANTITY_UNITS.join(", ")}`
      );
    }

    return new QuantityUnit(value);
  }

  private static isValid(value: string): value is QuantityUnitValue {
    return (QUANTITY_UNITS as readonly string[]).includes(value);
  }

  equals(other: QuantityUnit): boolean {
    return this.value === other.value;
  }
}
