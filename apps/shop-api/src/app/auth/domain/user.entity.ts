import { Email } from "../../shared/domain/value-objects/email.value-object";

export type UserRole = "ADMIN" | "CUSTOMER";

/**
 * Account that can sign in to the shop. Only the data needed to identify the
 * authenticated user is loaded here: credentials stay in the persistence layer
 * until login is implemented.
 */
export class User {
  private constructor(
    public readonly id: string,
    private readonly _email: Email,
    private readonly _firstName: string,
    private readonly _lastName: string,
    private readonly _role: UserRole,
    private readonly _isActive: boolean
  ) {}

  static reconstitute(
    id: string,
    email: string,
    firstName: string,
    lastName: string,
    role: UserRole,
    isActive: boolean
  ): User {
    return new User(id, Email.create(email), firstName, lastName, role, isActive);
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
}
