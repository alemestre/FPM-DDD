import { PasswordHasher } from "../application/ports/password-hasher";
import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";

@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  /** Hash checked when no account matches; created once, on first use. */
  private dummyHash?: Promise<string>;

  hash(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async verify(password: string, hash: string | null): Promise<boolean> {
    if (hash === null) {
      this.dummyHash ??= argon2.hash("unknown-account-placeholder");
      await argon2.verify(await this.dummyHash, password);
      return false;
    }

    try {
      return await argon2.verify(hash, password);
    } catch {
      // Malformed stored hash: no password can match it.
      return false;
    }
  }
}
