import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import { InvalidResetPasswordTokenError } from '../../domain/errors/invalid-reset-password-token.error';
import { ForgotPasswordToken } from '../ports/forgot-password-token';
import type { ResetPasswordInput } from '../reset-password.input';
import { Password } from '../../domain/password.value-object';
import { UserRepository } from "../../domain/user.repository";
import { PasswordHasher } from '../ports/password-hasher';
import { Inject } from "@nestjs/common";

/**
 * Replaces the password of the account named by a password reset link.
 * Saving the new hash makes the link (and every earlier one) invalid, so a link works only once.
 * Tokens already issued stay valid until they expire (no revocation list yet).
 */
export class ResetPasswordUseCase {
  constructor(
    @Inject(UserRepository) private readonly repository: UserRepository,
    @Inject(PasswordHasher) private readonly passwordHasher: PasswordHasher,
    @Inject(ForgotPasswordToken) private readonly forgotPasswordToken: ForgotPasswordToken
  ) {}

  async execute({ token, password }: ResetPasswordInput): Promise<void> {
    // The cheap rules come first: no token or hashing work for a password that would be refused anyway.
    const newPassword = Password.create(password);

    const { user, passwordHash } = await this.forgotPasswordToken.verify(token, (id: string) =>
      this.repository.findCredentialsById(id)
    );

    // A link sent before the account was deactivated must not bring it back.
    if (!user.isActive) {
      throw new InvalidResetPasswordTokenError();
    }

    // Argon2 salts every hash, so comparing two hashes never matches: verify the password instead.
    if (await this.passwordHasher.verify(newPassword.value, passwordHash)) {
      throw new DomainValidationError("Le nouveau mot de passe doit être différent de l'actuel");
    }

    await this.repository.savePasswordHash(user.id, await this.passwordHasher.hash(newPassword.value));
  }
}
