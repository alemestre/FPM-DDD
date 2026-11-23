import type { UserCredentials } from "../../domain/user.credentials";

/**
 * Signed, expiring proof that the bearer received the forgotten-password email.
 * It is bound to the password in place when it was issued, so it works only once:
 * after the password changes, the link is refused.
 */
export abstract class ForgotPasswordToken {
  abstract issue(credentials: UserCredentials): Promise<string>;

  /**
   * @param findCredentials Loads the current credentials of the user the token names.
   * @returns The current credentials of the user the token was issued for.
   * @throws InvalidVerificationTokenError when the token is malformed, forged or expired,
   *   when the user no longer exists, or when the password changed since the token was issued.
   */
  abstract verify(
    token: string,
    findCredentials: (userId: string) => Promise<UserCredentials | null>
  ): Promise<UserCredentials>;
}
