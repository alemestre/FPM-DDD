import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import { InvalidCurrentPasswordError } from '../../domain/errors/invalid-current-password.error';
import { AuthenticationError } from '../../domain/errors/authentication.error';
import type { UserRepository } from '../../domain/user.repository';
import type { PasswordHasher } from '../ports/password-hasher';
import { ChangePasswordUseCase } from './change-password.use-case';
import { User } from '../../domain/user.entity';

const USER_ID = 'b1c2d3e4-5f60-4a7b-8c9d-0e1f2a3b4c5d';
const PASSWORD_HASH = '$argon2id$ancien';
const NEW_PASSWORD = 'Nouveau1!motdepasse';

const credentialsOf = (isActive = true) => ({
  user: User.reconstitute(USER_ID, 'marie.durand@example.fr', 'Marie', 'Durand', 'CUSTOMER', isActive, true),
  passwordHash: PASSWORD_HASH,
});

describe('ChangePasswordUseCase', () => {
  let repository: jest.Mocked<UserRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let useCase: ChangePasswordUseCase;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findCredentialsByEmail: jest.fn(),
      findCredentialsById: jest.fn().mockResolvedValue(credentialsOf()),
      register: jest.fn(),
      save: jest.fn(),
      savePasswordHash: jest.fn(),
    };
    passwordHasher = { hash: jest.fn().mockResolvedValue('$argon2id$nouveau'), verify: jest.fn().mockResolvedValue(true) };
    useCase = new ChangePasswordUseCase(repository, passwordHasher);
  });

  it('enregistre le hash du nouveau mot de passe après avoir vérifié l’actuel', async () => {
    await useCase.execute(USER_ID, { currentPassword: 'ancien', newPassword: NEW_PASSWORD });

    expect(repository.findCredentialsById).toHaveBeenCalledWith(USER_ID);
    expect(passwordHasher.verify).toHaveBeenCalledWith('ancien', PASSWORD_HASH);
    expect(passwordHasher.hash).toHaveBeenCalledWith(NEW_PASSWORD);
    expect(repository.savePasswordHash).toHaveBeenCalledWith(USER_ID, '$argon2id$nouveau');
  });

  it('refuse un mot de passe actuel incorrect', async () => {
    passwordHasher.verify.mockResolvedValue(false);

    await expect(
      useCase.execute(USER_ID, { currentPassword: 'mauvais', newPassword: NEW_PASSWORD }),
    ).rejects.toBeInstanceOf(InvalidCurrentPasswordError);
    expect(repository.savePasswordHash).not.toHaveBeenCalled();
  });

  it('refuse un nouveau mot de passe qui ne respecte pas les règles, sans rien vérifier', async () => {
    await expect(
      useCase.execute(USER_ID, { currentPassword: 'ancien', newPassword: 'simple' }),
    ).rejects.toBeInstanceOf(DomainValidationError);
    expect(passwordHasher.verify).not.toHaveBeenCalled();
    expect(repository.savePasswordHash).not.toHaveBeenCalled();
  });

  it('refuse un nouveau mot de passe identique à l’actuel', async () => {
    await expect(
      useCase.execute(USER_ID, { currentPassword: NEW_PASSWORD, newPassword: NEW_PASSWORD }),
    ).rejects.toThrow('doit être différent');
    expect(repository.savePasswordHash).not.toHaveBeenCalled();
  });

  it.each([
    ['le compte n’existe plus', null],
    ['le compte est désactivé', credentialsOf(false)],
  ])('renvoie une erreur d’authentification si %s', async (_case, credentials) => {
    repository.findCredentialsById.mockResolvedValue(credentials);

    await expect(
      useCase.execute(USER_ID, { currentPassword: 'ancien', newPassword: NEW_PASSWORD }),
    ).rejects.toBeInstanceOf(AuthenticationError);
    expect(repository.savePasswordHash).not.toHaveBeenCalled();
  });
});
