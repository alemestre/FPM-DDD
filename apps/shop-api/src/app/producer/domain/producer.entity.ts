import { PhoneNumber } from "../../shared/domain/value-objects/phone-number.value-object";
import { PostalCode } from "../../shared/domain/value-objects/postal-code.value-object";
import { VatNumber } from "../../shared/domain/value-objects/vat-number.value-object";
import { Email } from "../../shared/domain/value-objects/email.value-object";
import { Name } from "../../shared/domain/value-objects/name.value-object";
import { Uuid } from "../../shared/domain/value-objects/uuid.value-object";

/**
 * Postal address of a producer. Any omitted field is left unchanged.
 */
export interface ProducerAddressChanges {
  readonly addressLine1?: string;
  readonly addressLine2?: string;
  readonly postalCode?: string;
  readonly city?: string;
}

/**
 * A producer groups products under a unique identity and a display name.
 */
export class Producer {
  private constructor(
    public readonly id: string,
    private _name: Name,
    private _contactEmail: Email,
    private _phoneNumber: PhoneNumber,
    private _vatNumber: VatNumber,
    private _addressLine1: string,
    private _postalCode: PostalCode,
    private _city: string,
    private _addressLine2: string,
    private _isActive: boolean
  ) {}

  static create(
    name: string,
    contactEmail: string,
    phoneNumber: string,
    vatNumber: string,
    addressLine1: string,
    postalCode: string,
    city: string,
    addressLine2 = ""
  ): Producer {
    return new Producer(
      new Uuid().getValue(),
      Name.create(name),
      Email.create(contactEmail),
      PhoneNumber.create(phoneNumber),
      VatNumber.create(vatNumber),
      addressLine1,
      PostalCode.create(postalCode),
      city,
      addressLine2,
      true
    );
  }

  static reconstitute(
    id: string,
    name: string,
    contactEmail: string,
    phoneNumber: string,
    vatNumber: string,
    addressLine1: string,
    postalCode: string,
    city: string,
    addressLine2: string,
    isActive: boolean
  ): Producer {
    return new Producer(
      id,
      Name.create(name),
      Email.create(contactEmail),
      PhoneNumber.create(phoneNumber),
      VatNumber.create(vatNumber),
      addressLine1,
      PostalCode.create(postalCode),
      city,
      addressLine2,
      isActive
    );
  }

  get name(): string {
    return this._name.toString();
  }

  get phoneNumber(): string {
    return this._phoneNumber.toString();
  }

  get vatNumber(): string {
    return this._vatNumber.toString();
  }

  get contactEmail(): string {
    return this._contactEmail.toString();
  }

  get postalCode(): string {
    return this._postalCode.toString();
  }

  get addressLine1(): string {
    return this._addressLine1;
  }

  get addressLine2(): string {
    return this._addressLine2;
  }

  get city(): string {
    return this._city;
  }

  /**
   * An inactive producer is kept for its existing products but no longer
   * operates. Producers are deactivated instead of being deleted.
   */
  get isActive(): boolean {
    return this._isActive;
  }

  deactivate(): void {
    this._isActive = false;
  }

  activate(): void {
    this._isActive = true;
  }

  changeName(name: string): void {
    this._name = Name.create(name);
  }

  changeContactEmail(contactEmail: string): void {
    this._contactEmail = Email.create(contactEmail);
  }

  changePhoneNumber(phoneNumber: string): void {
    this._phoneNumber = PhoneNumber.create(phoneNumber);
  }

  changeVatNumber(vatNumber: string): void {
    this._vatNumber = VatNumber.create(vatNumber);
  }

  /**
   * Updates the postal address. Every value is validated before any field
   * is modified, so an invalid change leaves the address untouched.
   */
  changeAddress(changes: ProducerAddressChanges): void {
    this._postalCode = changes.postalCode !== undefined ? PostalCode.create(changes.postalCode) : this._postalCode;
    this._addressLine1 = changes.addressLine1 ?? this._addressLine1;
    this._addressLine2 = changes.addressLine2 ?? this._addressLine2;
    this._city = changes.city ?? this._city;
  }
}
