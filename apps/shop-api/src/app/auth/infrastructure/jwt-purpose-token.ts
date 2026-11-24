import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

/**
 * Base of the single-purpose JWTs sent by email (email verification, password reset).
 *
 * They are signed with the session secret, so no table is needed. The `purpose`
 * claim keeps one kind of link from being accepted as another, and the session
 * guard rejects any token that has a `purpose`, so a link never opens a session.
 *
 * `@Injectable()` is needed here, not only on the subclasses: Nest reads the
 * constructor parameter types (JwtService) from the class that declares the constructor.
 */
@Injectable()
export abstract class JwtPurposeToken {
  protected abstract readonly purpose: string;
  protected abstract readonly ttlInSeconds: number;
  /** Error class thrown for every refused token of this kind. */
  protected abstract readonly invalidTokenError: new (options?: ErrorOptions) => Error;

  constructor(protected readonly jwtService: JwtService) {}

  /** Signs `sub`, `purpose` and the extra claims, with this token's lifetime. */
  protected sign(userId: string, claims: Record<string, string> = {}): Promise<string> {
    return this.jwtService.signAsync(
      { ...claims, sub: userId, purpose: this.purpose },
      { expiresIn: this.ttlInSeconds }
    );
  }

  /**
   * Checks the signature, the expiry, the `purpose` and the `sub` of the token.
   * Every failure throws `invalidTokenError`, with the JWT error as `cause` when there is one.
   * @returns The user id and every claim, so the subclass can check its own ones.
   */
  protected async decode(token: string): Promise<{ userId: string; claims: Record<string, unknown> }> {
    let claims: Record<string, unknown>;
    try {
      claims = await this.jwtService.verifyAsync<Record<string, unknown>>(token);
    } catch (error) {
      throw new this.invalidTokenError({ cause: error });
    }

    if (claims.purpose !== this.purpose || typeof claims.sub !== "string" || claims.sub === "") {
      throw new this.invalidTokenError();
    }

    return { userId: claims.sub, claims };
  }
}
