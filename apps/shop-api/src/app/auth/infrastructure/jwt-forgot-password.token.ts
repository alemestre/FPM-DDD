import { InvalidResetPasswordTokenError } from "../domain/errors/invalid-reset-password-token.error";
import { ForgotPasswordToken } from "../application/ports/forgot-password-token";
import type { UserCredentials } from "../domain/user.credentials";
import { JwtPurposeToken } from "./jwt-purpose-token";
import { Injectable } from "@nestjs/common";
import { createHash } from "node:crypto";

/** `purpose` claim of password reset tokens. */
export const RESET_PASSWORD_PURPOSE = "reset-password";

/** Lifetime of a password reset link. */
export const RESET_PASSWORD_TTL_SECONDS = 60 * 60;

/**
 * Stateless password reset token.
 *
 * It carries a fingerprint of the current password hash (`pwd` claim): once the
 * password changes (with this link or another way), the fingerprint no longer
 * matches and every link issued before is refused. So a link works only once.
 */
@Injectable()
export class JwtForgotPasswordToken extends JwtPurposeToken implements ForgotPasswordToken {
  protected readonly purpose = RESET_PASSWORD_PURPOSE;
  protected readonly ttlInSeconds = RESET_PASSWORD_TTL_SECONDS;
  protected readonly invalidTokenError = InvalidResetPasswordTokenError;

  issue({ user, passwordHash }: UserCredentials): Promise<string> {
    return this.sign(user.id, { pwd: this.passwordFingerprintOf(passwordHash) });
  }

  async verify(
    token: string,
    findCredentials: (userId: string) => Promise<UserCredentials | null>
  ): Promise<UserCredentials> {
    const { userId, claims } = await this.decode(token);

    if (typeof claims.pwd !== "string") {
      throw new InvalidResetPasswordTokenError();
    }

    const credentials = await findCredentials(userId);

    if (!credentials || this.passwordFingerprintOf(credentials.passwordHash) !== claims.pwd) {
      throw new InvalidResetPasswordTokenError();
    }

    return credentials;
  }

  /**
   * Short digest of the password hash. The JWT payload is readable by anyone, so
   * it carries this digest rather than the hash itself.
   */
  private passwordFingerprintOf(passwordHash: string) {
    return createHash("sha256").update(passwordHash).digest("base64url").slice(0, 22);
  }
}
