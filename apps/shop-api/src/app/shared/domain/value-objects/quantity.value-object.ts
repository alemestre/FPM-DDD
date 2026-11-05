import { DomainValidationError } from '../errors/domain-validation.error';

/**
 * A countable, non-negative whole number of units (stock, ordered items, …).
 */
export class Quantity {
  private constructor(public readonly value: number) {}

  static create(value: number): Quantity {
    if (!Number.isInteger(value) || value < 0) {
      throw new DomainValidationError('La quantité doit être un entier positif ou nul');
    }

    return new Quantity(value);
  }

  add(other: Quantity): Quantity {
    return Quantity.create(this.value + other.value);
  }

  /**
   * @throws {DomainValidationError} If the result would be negative.
   */
  subtract(other: Quantity): Quantity {
    if (other.value > this.value) {
      throw new DomainValidationError(
        `Impossible de retirer ${other.value} unité(s) : seulement ${this.value} disponible(s)`,
      );
    }

    return Quantity.create(this.value - other.value);
  }

  isLessThan(other: Quantity): boolean {
    return this.value < other.value;
  }

  equals(other: Quantity): boolean {
    return this.value === other.value;
  }
}
