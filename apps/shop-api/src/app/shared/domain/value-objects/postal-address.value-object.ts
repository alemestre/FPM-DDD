import { DomainValidationError } from '../errors/domain-validation.error';
import { PostalCode } from './postal-code.value-object';

export interface PostalAddressProps {
  readonly line1: string;
  readonly line2?: string;
  readonly postalCode: string;
  readonly city: string;
}

/**
 * Complete postal address: street, optional complement, postal code and city.
 * Shared by the customer's profile, the registration and the billing address of an order.
 */
export class PostalAddress {
  private constructor(
    readonly line1: string,
    readonly line2: string,
    private readonly _postalCode: PostalCode,
    readonly city: string
  ) {}

  /**
   * Trims every field and defaults the complement to an empty string.
   *
   * @throws {DomainValidationError} If the street or the city is empty, or the postal code is invalid.
   */
  static create({ line1, line2, postalCode, city }: PostalAddressProps): PostalAddress {
    return new PostalAddress(
      PostalAddress.required(line1, "L'adresse"),
      line2?.trim() ?? '',
      PostalCode.create(postalCode),
      PostalAddress.required(city, 'La ville')
    );
  }

  private static required(raw: string, label: string): string {
    const value = raw?.trim() ?? '';
    if (!value) {
      throw new DomainValidationError(`${label} est obligatoire`);
    }
    return value;
  }

  get postalCode(): string {
    return this._postalCode.toString();
  }

  equals(other: PostalAddress): boolean {
    return (
      this.line1 === other.line1 &&
      this.line2 === other.line2 &&
      this._postalCode.equals(other._postalCode) &&
      this.city === other.city
    );
  }
}
