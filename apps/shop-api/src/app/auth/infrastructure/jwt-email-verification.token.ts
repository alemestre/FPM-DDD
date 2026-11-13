import { InvalidVerificationTokenError } from "../domain/errors/invalid-verification-token.error";
import { EmailVerificationToken } from "../application/ports/email-verification-token";
import type { User } from "../domain/user.entity";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

/**
 * `purpose` claim of verification tokens. The session guard rejects any token
 * that has a `purpose`, so a link received by email never opens a session.
 */
export const EMAIL_VERIFICATION_PURPOSE = "email-verification";

/** Lifetime of a verification link. */
export const EMAIL_VERIFICATION_TTL_SECONDS = 24 * 60 * 60;

interface EmailVerificationPayload {
  sub?: string;
  purpose?: typeof EMAIL_VERIFICATION_PURPOSE
}

/**
 * Stateless verification token: a JWT signed with the session secret, so no
 * table is needed. It can be used more than once, which is harmless because
 * verifying an email twice changes nothing.
 */
@Injectable()
export class JwtEmailVerificationToken implements EmailVerificationToken {
  constructor(private readonly jwtService: JwtService) {}

  issue(user: User): Promise<string> {
    return this.jwtService.signAsync(
      { sub: user.id, purpose: EMAIL_VERIFICATION_PURPOSE },
      { expiresIn: EMAIL_VERIFICATION_TTL_SECONDS }
    );
  }

  async verify(token: string): Promise<string> {
    let payload: EmailVerificationPayload;
    try {
      payload = await this.jwtService.verifyAsync<EmailVerificationPayload>(token);
    } catch (error) {
      throw new InvalidVerificationTokenError({ cause: error });
    }

    if (payload.purpose !== EMAIL_VERIFICATION_PURPOSE || typeof payload.sub !== "string" || payload.sub === "") {
      throw new InvalidVerificationTokenError();
    }

    return payload.sub;
  }
}
