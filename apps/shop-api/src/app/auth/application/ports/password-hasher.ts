export abstract class PasswordHasher {
  abstract hash(password: string): Promise<string>;

  /**
   * @param password
   * @param hash - Stored hash, or `null` when no account matches. A `null` hash
   *   still costs one verification, so response times do not reveal which emails exist.
   * @returns `true` only when the password matches the hash.
   */
  abstract verify(password: string, hash: string | null): Promise<boolean>;
}
