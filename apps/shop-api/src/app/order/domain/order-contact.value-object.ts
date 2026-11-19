import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';
import { PhoneNumber } from '../../shared/domain/value-objects/phone-number.value-object';
import { Email } from '../../shared/domain/value-objects/email.value-object';

export interface OrderContactProps {
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;
    readonly phone: string;
}

/**
 * Who placed the order and how to reach them (the "order ready" email goes to
 * this address). Copied when ordering, for customers and guests alike.
 */
export class OrderContact {
    private constructor(
        readonly firstName: string,
        readonly lastName: string,
        private readonly _email: Email,
        private readonly _phone: PhoneNumber,
    ) {}

    static create({ firstName, lastName, email, phone }: OrderContactProps): OrderContact {
        return new OrderContact(
            OrderContact.personName(firstName, 'prénom'),
            OrderContact.personName(lastName, 'nom'),
            Email.create(email),
            PhoneNumber.create(phone),
        );
    }

    private static personName(raw: string, label: string): string {
        const value = raw?.trim() ?? '';
        if (!value) {
            throw new DomainValidationError(`Le ${label} est obligatoire`);
        }
        return value;
    }

    get email(): string {
        return this._email.toString();
    }

    get phone(): string {
        return this._phone.toString();
    }

    get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }
}
