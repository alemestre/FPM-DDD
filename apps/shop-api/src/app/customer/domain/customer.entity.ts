import { DomainValidationError } from "../../shared/domain/errors/domain-validation.error";
import { PhoneNumber } from "../../shared/domain/value-objects/phone-number.value-object";
import type { CustomerAddress } from "./customer-address.value-object";

/**
 * Profile of a customer account: identity, contact details and postal address.
 * The email is read-only here: changing it would require a new verification.
 */
export class Customer {
  private constructor(
    public readonly id: string,
    private readonly _email: string,
    private _firstName: string,
    private _lastName: string,
    private _phone: PhoneNumber,
    private _address: CustomerAddress
  ) {}

  static reconstitute(
    id: string,
    email: string,
    firstName: string,
    lastName: string,
    phone: string,
    address: CustomerAddress
  ): Customer {
    return new Customer(id, email, firstName, lastName, PhoneNumber.create(phone), address);
  }

  private static personName(raw: string, label: string): string {
    const value = raw?.trim() ?? "";
    if (!value) {
      throw new DomainValidationError(`Le ${label} est obligatoire`);
    }
    return value;
  }

  /** Both names are validated before either is changed. */
  rename(firstName: string, lastName: string): void {
    const validFirstName = Customer.personName(firstName, "prénom");
    const validLastName = Customer.personName(lastName, "nom");
    this._firstName = validFirstName;
    this._lastName = validLastName;
  }

  changePhone(phone: string): void {
    this._phone = PhoneNumber.create(phone);
  }

  changeAddress(address: CustomerAddress): void {
    this._address = address;
  }

  get email(): string {
    return this._email;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get phone(): string {
    return this._phone.toString();
  }

  get address(): CustomerAddress {
    return this._address;
  }
}
