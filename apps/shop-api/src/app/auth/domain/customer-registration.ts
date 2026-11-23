import type { PhoneNumber } from '../../shared/domain/value-objects/phone-number.value-object';
import type { PostalAddress } from '../../shared/domain/value-objects/postal-address.value-object';
import type { User } from './user.entity';

/** Everything persisted when a customer creates an account. */
export interface CustomerRegistration {
    readonly user: User;
    readonly passwordHash: string;
    readonly phone: PhoneNumber;
    /** Postal address of the customer, required at registration. */
    readonly address: PostalAddress;
}
