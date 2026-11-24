import { InvalidResetPasswordTokenError } from '../../domain/errors/invalid-reset-password-token.error';
import { VerifyForgotPasswordTokenUseCase } from './verify-forgot-password-token.use-case';
import type { ForgotPasswordToken } from '../ports/forgot-password-token';
import type { UserCredentials } from '../../domain/user.credentials';
import type { UserRepository } from '../../domain/user.repository';
import { User } from '../../domain/user.entity';

const USER_ID = 'b1c2d3e4-5f60-4a7b-8c9d-0e1f2a3b4c5d';

const credentials: UserCredentials = {
  user: User.reconstitute(USER_ID, 'marie.durand@example.fr', 'Marie', 'Durand', 'CUSTOMER', true, true),
  passwordHash: '$argon2id$hash',
};

describe('VerifyForgotPasswordTokenUseCase', () => {
  let repository: jest.Mocked<UserRepository>;
  let resetToken: jest.Mocked<ForgotPasswordToken>;
  let useCase: VerifyForgotPasswordTokenUseCase;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findCredentialsByEmail: jest.fn(),
      findCredentialsById: jest.fn().mockResolvedValue(credentials),
      register: jest.fn(),
      save: jest.fn(),
      savePasswordHash: jest.fn(),
    };
    resetToken = { issue: jest.fn(), verify: jest.fn().mockResolvedValue(credentials) };
    useCase = new VerifyForgotPasswordTokenUseCase(repository, resetToken);
  });

  it('accepte un lien valide sans rien modifier', async () => {
    await expect(useCase.execute('reset.jwt')).resolves.toBeUndefined();

    expect(resetToken.verify).toHaveBeenCalledWith('reset.jwt', expect.any(Function));
    expect(repository.save).not.toHaveBeenCalled();
    expect(repository.savePasswordHash).not.toHaveBeenCalled();
  });

  it('charge les identifiants du compte depuis le dépôt', async () => {
    await useCase.execute('reset.jwt');

    const findCredentials = resetToken.verify.mock.calls[0][1];
    await expect(findCredentials(USER_ID)).resolves.toBe(credentials);
    expect(repository.findCredentialsById).toHaveBeenCalledWith(USER_ID);
  });

  it('refuse le lien d’un compte désactivé depuis l’envoi', async () => {
    resetToken.verify.mockResolvedValue({
      ...credentials,
      user: User.reconstitute(USER_ID, 'marie.durand@example.fr', 'Marie', 'Durand', 'CUSTOMER', false, true),
    });

    await expect(useCase.execute('reset.jwt')).rejects.toBeInstanceOf(InvalidResetPasswordTokenError);
  });

  it('refuse un lien invalide, expiré ou déjà utilisé', async () => {
    resetToken.verify.mockRejectedValue(new InvalidResetPasswordTokenError());

    await expect(useCase.execute('reset.jwt')).rejects.toBeInstanceOf(InvalidResetPasswordTokenError);
  });
});
