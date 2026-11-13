import type { CustomerRegistration } from './customer-registration';
import type { UserCredentials } from './user.credentials';
import type { User } from './user.entity';

/**
 * Persistence port for the User aggregate.
 *
 * It does not extend GenericEntityRepository: creating a user also stores its
 * password hash and its customer profile, which the entity does not hold.
 */
export abstract class UserRepository {
    /**
     * @param id - User identity.
     * @returns The user when it exists, otherwise `null`.
     */
    abstract findById(id: string): Promise<User | null>;

    /**
     * @param email - Normalized user email.
     * @returns The user credential when a user exists, otherwise `null`.
     */
    abstract findCredentialsByEmail(email: string): Promise<UserCredentials | null>;

    /**
     * Creates the user and its customer profile together.
     * @throws EmailAlreadyUsedError when another account has the same email.
     */
    abstract register(registration: CustomerRegistration): Promise<void>;

    /** Persists the state changes of an existing user (email verification). */
    abstract save(user: User): Promise<void>;
}
