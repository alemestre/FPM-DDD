import { InvalidVerificationTokenError } from "../domain/errors/invalid-verification-token.error";
import { ForgotPasswordToken } from "../application/ports/forgot-password-token";
import type { UserCredentials } from "../domain/user.credentials";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createHash } from "node:crypto";

/**
 * `purpose` claim of password reset tokens. The session guard rejects any token
 * that has a `purpose`, so a link received by email never opens a session.
 */
export const RESET_PASSWORD_PURPOSE = "reset-password";

/** Lifetime of a password reset link. */
export const RESET_PASSWORD_TTL_SECONDS = 60 * 60;

interface ResetPasswordPayload {
  sub?: string;
  purpose?: typeof RESET_PASSWORD_PURPOSE;
  /** Fingerprint of the password hash in place when the token was issued. */
  pwd?: string;
}

/**
 * Stateless password reset token: a JWT signed with the session secret, so no
 * table is needed. Its `purpose` keeps it from being accepted as a verification
 * token, and the other way round.
 *
 * It carries a fingerprint of the current password hash: once the password
 * changes (with this link or another way), the fingerprint no longer matches
 * and every link issued before is refused. So a link works only once.
 */
@Injectable()
export class JwtForgotPasswordToken implements ForgotPasswordToken {
  constructor(private readonly jwtService: JwtService) {}

  /**
 * Short digest of the password hash. The JWT payload is readable by anyone, so
 * it carries this digest rather than the hash itself.
 */
  private _passwordFingerprintOf(passwordHash: string) {
    return createHash("sha256").update(passwordHash).digest("base64url").slice(0, 22);
  }


  issue({ user, passwordHash }: UserCredentials): Promise<string> {
    return this.jwtService.signAsync(
      { sub: user.id, purpose: RESET_PASSWORD_PURPOSE, pwd: this._passwordFingerprintOf(passwordHash) },
      { expiresIn: RESET_PASSWORD_TTL_SECONDS },
    );
  }

  async verify(
    token: string,
    findCredentials: (userId: string) => Promise<UserCredentials | null>
  ): Promise<UserCredentials> {
    let payload: ResetPasswordPayload;
    try {
      payload = await this.jwtService.verifyAsync<ResetPasswordPayload>(token);
    } catch (error) {
      throw new InvalidVerificationTokenError({ cause: error });
    }

    if (
      payload.purpose !== RESET_PASSWORD_PURPOSE ||
      typeof payload.sub !== "string" ||
      payload.sub === "" ||
      typeof payload.pwd !== "string"
    ) {
      throw new InvalidVerificationTokenError();
    }

    const credentials = await findCredentials(payload.sub);

    if (!credentials || this._passwordFingerprintOf(credentials.passwordHash) !== payload.pwd) {
      throw new InvalidVerificationTokenError();
    }

    return credentials;
  }
}
