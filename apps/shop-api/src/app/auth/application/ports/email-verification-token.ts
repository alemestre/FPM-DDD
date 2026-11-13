import type { User } from "../../domain/user.entity";

/** Signed, expiring proof that the bearer received the verification email. */
export abstract class EmailVerificationToken {
  abstract issue(user: User): Promise<string>;

  /**
   * @returns The id of the user the token was issued for.
   * @throws InvalidVerificationTokenError when the token is malformed, forged or expired.
   */
  abstract verify(token: string): Promise<string>;
}
