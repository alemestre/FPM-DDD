import { DomainValidationError } from "../../../shared/domain/errors/domain-validation.error";
import { InvalidCurrentPasswordError } from "../../domain/errors/invalid-current-password.error";
import { AuthenticationError } from "../../domain/errors/authentication.error";
import type { ChangePasswordInput } from "../change-password.input";
import { Password } from "../../domain/password.value-object";
import { UserRepository } from "../../domain/user.repository";
import { PasswordHasher } from "../ports/password-hasher";
import { Inject } from "@nestjs/common";

/**
 * Replaces the password of the signed-in user, once the current one is confirmed.
 * Tokens already issued stay valid until they expire (no revocation list yet).
 */
export class ChangePasswordUseCase {
  constructor(
    @Inject(UserRepository) private readonly repository: UserRepository,
    @Inject(PasswordHasher) private readonly passwordHasher: PasswordHasher
  ) {}

  async execute(userId: string, { currentPassword, newPassword }: ChangePasswordInput): Promise<void> {
    // The cheap rules come first: no hashing work for a password that would be refused anyway.
    const password = Password.create(newPassword);
    if (newPassword === currentPassword) {
      throw new DomainValidationError("Le nouveau mot de passe doit être différent de l'actuel");
    }

    const credentials = await this.repository.findCredentialsById(userId);
    if (!credentials || !credentials.user.isActive) {
      throw new AuthenticationError();
    }

    if (!(await this.passwordHasher.verify(currentPassword, credentials.passwordHash))) {
      throw new InvalidCurrentPasswordError();
    }

    await this.repository.savePasswordHash(userId, await this.passwordHasher.hash(password.value));
  }
}
