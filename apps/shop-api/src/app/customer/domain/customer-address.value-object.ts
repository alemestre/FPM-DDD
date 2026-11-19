import { DomainValidationError } from "../../shared/domain/errors/domain-validation.error";
import { PostalCode } from "../../shared/domain/value-objects/postal-code.value-object";

export interface CustomerAddressProps {
  readonly line1: string;
  readonly line2?: string;
  readonly postalCode: string;
  readonly city: string;
}

/**
 * Postal address of a customer, always complete: street, postal code and city.
 */
export class CustomerAddress {
  private constructor(
    private readonly _line1: string,
    private readonly _line2: string,
    private readonly _postalCode: PostalCode,
    private readonly _city: string
  ) {}

  static create({ line1, line2, postalCode, city }: CustomerAddressProps): CustomerAddress {
    return new CustomerAddress(
      CustomerAddress.required(line1, "L'adresse"),
      line2?.trim() ?? "",
      PostalCode.create(postalCode),
      CustomerAddress.required(city, "La ville")
    );
  }

  private static required(raw: string, label: string): string {
    const value = raw?.trim() ?? "";
    if (!value) {
      throw new DomainValidationError(`${label} est obligatoire`);
    }
    return value;
  }

  get line1(): string {
    return this._line1;
  }

  get line2(): string {
    return this._line2;
  }

  get postalCode(): string {
    return this._postalCode.toString();
  }

  get city(): string {
    return this._city;
  }

  equals(other: CustomerAddress): boolean {
    return (
      this._line1 === other._line1 &&
      this._line2 === other._line2 &&
      this._postalCode.equals(other._postalCode) &&
      this._city === other._city
    );
  }
}
