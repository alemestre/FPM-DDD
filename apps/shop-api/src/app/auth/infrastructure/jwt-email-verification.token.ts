import { InvalidVerificationTokenError } from "../domain/errors/invalid-verification-token.error";
import { EmailVerificationToken } from "../application/ports/email-verification-token";
import { JwtPurposeToken } from "./jwt-purpose-token";
import type { User } from "../domain/user.entity";
import { Injectable } from "@nestjs/common";

/** `purpose` claim of verification tokens. */
export const EMAIL_VERIFICATION_PURPOSE = "email-verification";

/** Lifetime of a verification link. */
export const EMAIL_VERIFICATION_TTL_SECONDS = 24 * 60 * 60;

/**
 * Stateless verification token. It can be used more than once, which is
 * harmless because verifying an email twice changes nothing.
 */
@Injectable()
export class JwtEmailVerificationToken extends JwtPurposeToken implements EmailVerificationToken {
  protected readonly purpose = EMAIL_VERIFICATION_PURPOSE;
  protected readonly ttlInSeconds = EMAIL_VERIFICATION_TTL_SECONDS;
  protected readonly invalidTokenError = InvalidVerificationTokenError;

  issue(user: User): Promise<string> {
    return this.sign(user.id);
  }

  async verify(token: string): Promise<string> {
    const { userId } = await this.decode(token);
    return userId;
  }
}
