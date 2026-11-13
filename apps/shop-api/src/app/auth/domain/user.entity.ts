import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';
import { Email } from '../../shared/domain/value-objects/email.value-object';
import { randomUUID } from 'node:crypto';

export type UserRole = 'ADMIN' | 'CUSTOMER';

export interface UserRegistrationProps {
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
}

/**
 * Account that can sign in to the shop. Only the data needed to identify the
 * authenticated user is loaded here: credentials stay in the persistence layer.
 */
export class User {
    private constructor(
        public readonly id: string,
        private readonly _email: Email,
        private readonly _firstName: string,
        private readonly _lastName: string,
        private readonly _role: UserRole,
        private readonly _isActive: boolean,
        private _emailVerified: boolean,
    ) {}

    /**
     * New customer account, created by self-registration: active, but its email
     * must be verified before it can log in.
     */
    static register({ email, firstName, lastName }: UserRegistrationProps): User {
        return new User(
            randomUUID(),
            Email.create(email),
            User.personName(firstName, 'prénom'),
            User.personName(lastName, 'nom'),
            'CUSTOMER',
            true,
            false,
        );
    }

    static reconstitute(
        id: string,
        email: string,
        firstName: string,
        lastName: string,
        role: UserRole,
        isActive: boolean,
        emailVerified: boolean,
    ): User {
        return new User(
            id,
            Email.create(email),
            firstName,
            lastName,
            role,
            isActive,
            emailVerified,
        );
    }

    private static personName(raw: string, label: string): string {
        const value = raw?.trim() ?? '';
        if (!value) {
            throw new DomainValidationError(`Le ${label} est obligatoire`);
        }
        return value;
    }

    /** The owner proved they read this address. Verifying twice changes nothing. */
    verifyEmail(): void {
        this._emailVerified = true;
    }

    get email(): string {
        return this._email.toString();
    }

    get firstName(): string {
        return this._firstName;
    }

    get lastName(): string {
        return this._lastName;
    }

    get role(): UserRole {
        return this._role;
    }

    /** A deactivated account keeps its data but can no longer use a session. */
    get isActive(): boolean {
        return this._isActive;
    }

    /** Until it is verified, the account cannot log in. */
    get emailVerified(): boolean {
        return this._emailVerified;
    }
}
