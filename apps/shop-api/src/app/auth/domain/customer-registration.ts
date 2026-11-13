import type { PhoneNumber } from '../../shared/domain/value-objects/phone-number.value-object';
import type { PostalCode } from '../../shared/domain/value-objects/postal-code.value-object';
import type { User } from './user.entity';

/** Postal address of a customer. Optional: orders are collected, not delivered. */
export interface CustomerAddress {
    readonly line1: string;
    readonly line2: string;
    readonly postalCode: PostalCode;
    readonly city: string;
}

/** Everything persisted when a customer creates an account. */
export interface CustomerRegistration {
    readonly user: User;
    readonly passwordHash: string;
    readonly phone: PhoneNumber;
    readonly address?: CustomerAddress;
}
