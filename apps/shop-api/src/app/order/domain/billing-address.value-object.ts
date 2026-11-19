import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';
import { PostalCode } from '../../shared/domain/value-objects/postal-code.value-object';

export interface BillingAddressProps {
    readonly line1: string;
    readonly line2?: string;
    readonly postalCode: string;
    readonly city: string;
}

/**
 * Billing address written on an order. It is a copy taken when ordering:
 * changing it never changes the customer's profile, and the reverse.
 */
export class BillingAddress {
    private constructor(
        readonly line1: string,
        readonly line2: string,
        private readonly _postalCode: PostalCode,
        readonly city: string,
    ) {}

    static create({ line1, line2, postalCode, city }: BillingAddressProps): BillingAddress {
        return new BillingAddress(
            BillingAddress.required(line1, "L'adresse de facturation"),
            line2?.trim() ?? '',
            PostalCode.create(postalCode),
            BillingAddress.required(city, 'La ville de facturation'),
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

    equals(other: BillingAddress): boolean {
        return (
            this.line1 === other.line1 &&
            this.line2 === other.line2 &&
            this._postalCode.equals(other._postalCode) &&
            this.city === other.city
        );
    }
}
