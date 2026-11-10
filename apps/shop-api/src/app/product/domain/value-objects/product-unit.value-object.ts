import { DomainValidationError } from "../../../shared/domain/errors/domain-validation.error";

export const PRODUCT_UNITS = ["KG", "BOTTE", "PIECE", "CONDITIONNEMENT", "BOUTEILLE"] as const;

export type ProductUnitValue = (typeof PRODUCT_UNITS)[number];

/**
 * Unit given to a product when none is specified.
 */
export const DEFAULT_PRODUCT_UNIT: ProductUnitValue = "KG";

/**
 * Units whose content must be stated (e.g. a 75 cl bottle, a 500 g package).
 */
const UNITS_REQUIRING_QUANTITY: readonly ProductUnitValue[] = ["CONDITIONNEMENT", "BOUTEILLE"];

/**
 * Unit in which a product is sold: by weight (KG), by bunch (BOTTE), by piece (PIECE),
 * by package (CONDITIONNEMENT) or by bottle (BOUTEILLE).
 */
export class ProductUnit {
  private constructor(public readonly value: ProductUnitValue) {}

  /**
   * @throws {DomainValidationError} If the value is not a known unit.
   */
  static create(value: string): ProductUnit {
    if (!ProductUnit.isValid(value)) {
      throw new DomainValidationError(
        `L'unité doit être l'une des valeurs suivantes : ${PRODUCT_UNITS.join(", ")}`
      );
    }

    return new ProductUnit(value);
  }

  private static isValid(value: string): value is ProductUnitValue {
    return (PRODUCT_UNITS as readonly string[]).includes(value);
  }

  /**
   * Whether a product sold in this unit must state its quantity and quantity unit.
   */
  requiresQuantity(): boolean {
    return UNITS_REQUIRING_QUANTITY.includes(this.value);
  }

  equals(other: ProductUnit): boolean {
    return this.value === other.value;
  }
}
