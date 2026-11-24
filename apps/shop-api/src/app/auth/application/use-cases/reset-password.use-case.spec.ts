import { InvalidResetPasswordTokenError } from '../../domain/errors/invalid-reset-password-token.error';
import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import type { ForgotPasswordToken } from '../ports/forgot-password-token';
import type { UserCredentials } from '../../domain/user.credentials';
import type { UserRepository } from '../../domain/user.repository';
import type { PasswordHasher } from '../ports/password-hasher';
import { ResetPasswordUseCase } from './reset-password.use-case';
import { User } from '../../domain/user.entity';

const USER_ID = 'b1c2d3e4-5f60-4a7b-8c9d-0e1f2a3b4c5d';
const PASSWORD_HASH = '$argon2id$ancien';
const NEW_PASSWORD = 'Nouveau1!motdepasse';

const credentialsOf = (isActive = true): UserCredentials => ({
  user: User.reconstitute(USER_ID, 'marie.durand@example.fr', 'Marie', 'Durand', 'CUSTOMER', isActive, true),
  passwordHash: PASSWORD_HASH,
});

describe('ResetPasswordUseCase', () => {
  let repository: jest.Mocked<UserRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let resetToken: jest.Mocked<ForgotPasswordToken>;
  let useCase: ResetPasswordUseCase;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findCredentialsByEmail: jest.fn(),
      findCredentialsById: jest.fn().mockResolvedValue(credentialsOf()),
      register: jest.fn(),
      save: jest.fn(),
      savePasswordHash: jest.fn(),
    };
    passwordHasher = { hash: jest.fn().mockResolvedValue('$argon2id$nouveau'), verify: jest.fn().mockResolvedValue(false) };
    resetToken = { issue: jest.fn(), verify: jest.fn().mockResolvedValue(credentialsOf()) };
    useCase = new ResetPasswordUseCase(repository, passwordHasher, resetToken);
  });

  it('enregistre le hash du nouveau mot de passe pour le compte désigné par le lien', async () => {
    await useCase.execute({ token: 'reset.jwt', password: NEW_PASSWORD });

    expect(resetToken.verify).toHaveBeenCalledWith('reset.jwt', expect.any(Function));
    expect(passwordHasher.hash).toHaveBeenCalledWith(NEW_PASSWORD);
    expect(repository.savePasswordHash).toHaveBeenCalledWith(USER_ID, '$argon2id$nouveau');
  });

  it('charge les identifiants du compte depuis le dépôt pour vérifier le lien', async () => {
    await useCase.execute({ token: 'reset.jwt', password: NEW_PASSWORD });

    const findCredentials = resetToken.verify.mock.calls[0][1];
    await findCredentials(USER_ID);
    expect(repository.findCredentialsById).toHaveBeenCalledWith(USER_ID);
  });

  it('refuse un mot de passe qui ne respecte pas les règles, sans vérifier le lien', async () => {
    await expect(useCase.execute({ token: 'reset.jwt', password: 'simple' })).rejects.toBeInstanceOf(
      DomainValidationError,
    );
    expect(resetToken.verify).not.toHaveBeenCalled();
    expect(repository.savePasswordHash).not.toHaveBeenCalled();
  });

  it('refuse un lien invalide, expiré ou déjà utilisé', async () => {
    resetToken.verify.mockRejectedValue(new InvalidResetPasswordTokenError());

    await expect(useCase.execute({ token: 'reset.jwt', password: NEW_PASSWORD })).rejects.toBeInstanceOf(
      InvalidResetPasswordTokenError,
    );
    expect(repository.savePasswordHash).not.toHaveBeenCalled();
  });

  it('refuse le lien d’un compte désactivé depuis l’envoi', async () => {
    resetToken.verify.mockResolvedValue(credentialsOf(false));

    await expect(useCase.execute({ token: 'reset.jwt', password: NEW_PASSWORD })).rejects.toBeInstanceOf(
      InvalidResetPasswordTokenError,
    );
    expect(repository.savePasswordHash).not.toHaveBeenCalled();
  });

  it('refuse de réutiliser le mot de passe actuel', async () => {
    passwordHasher.verify.mockResolvedValue(true);

    await expect(useCase.execute({ token: 'reset.jwt', password: NEW_PASSWORD })).rejects.toThrow(
      "Le nouveau mot de passe doit être différent de l'actuel",
    );
    expect(passwordHasher.verify).toHaveBeenCalledWith(NEW_PASSWORD, PASSWORD_HASH);
    expect(repository.savePasswordHash).not.toHaveBeenCalled();
  });
});
