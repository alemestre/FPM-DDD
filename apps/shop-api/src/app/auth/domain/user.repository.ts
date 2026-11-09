import type { User } from "./user.entity";
import type { UserCredentials } from './user.credentials';

/**
 * Persistence port for the User aggregate.
 *
 * Unlike the other contexts, it does not extend GenericEntityRepository yet:
 * creating or updating a user needs the password hash and the customer profile,
 * which arrive with login and registration. Only reads are exposed for now.
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
}
