import { AuthenticationError } from '../../domain/errors/authentication.error';
import { EmailNotVerifiedError } from '../../domain/errors/email-not-verified.error';
import type { AccessTokenIssuer } from '../ports/access-token-issuer';
import type { UserRepository } from '../../domain/user.repository';
import type { PasswordHasher } from '../ports/password-hasher';
import { LogInUseCase } from './log-in.use-case';
import { User } from '../../domain/user.entity';

const USER_ID = 'b1c2d3e4-5f60-4a7b-8c9d-0e1f2a3b4c5d';
const PASSWORD_HASH = '$argon2id$hash';
const INVALID_CREDENTIALS = 'Email ou mot de passe incorrect';

const credentialsOf = (isActive = true, emailVerified = true) => ({
  user: User.reconstitute(USER_ID, 'marie.durand@example.fr', 'Marie', 'Durand', 'CUSTOMER', isActive, emailVerified),
  passwordHash: PASSWORD_HASH,
});

describe('LogInUseCase', () => {
  let repository: jest.Mocked<UserRepository>;
  let passwordHasher: jest.Mocked<PasswordHasher>;
  let accessTokenIssuer: jest.Mocked<AccessTokenIssuer>;
  let useCase: LogInUseCase;

  beforeEach(() => {
    repository = { findById: jest.fn(), findCredentialsByEmail: jest.fn(), register: jest.fn(), save: jest.fn() };
    passwordHasher = { hash: jest.fn(), verify: jest.fn() };
    accessTokenIssuer = { issue: jest.fn().mockResolvedValue('signed.jwt.token') };
    useCase = new LogInUseCase(repository, accessTokenIssuer, passwordHasher);
  });

  it("émet un jeton d'accès pour un compte actif avec le bon mot de passe", async () => {
    const credentials = credentialsOf();
    repository.findCredentialsByEmail.mockResolvedValue(credentials);
    passwordHasher.verify.mockResolvedValue(true);

    const result = await useCase.execute({ email: 'marie.durand@example.fr', password: 'motdepasse' });

    expect(passwordHasher.verify).toHaveBeenCalledWith('motdepasse', PASSWORD_HASH);
    expect(accessTokenIssuer.issue).toHaveBeenCalledWith(credentials.user);
    expect(result).toEqual({ user: credentials.user, accessToken: 'signed.jwt.token' });
  });

  it("normalise l'email avant de chercher le compte", async () => {
    repository.findCredentialsByEmail.mockResolvedValue(credentialsOf());
    passwordHasher.verify.mockResolvedValue(true);

    await useCase.execute({ email: '  Marie.Durand@Example.FR ', password: 'motdepasse' });

    expect(repository.findCredentialsByEmail).toHaveBeenCalledWith('marie.durand@example.fr');
  });

  it("refuse un email inconnu, après avoir quand même vérifié un mot de passe", async () => {
    repository.findCredentialsByEmail.mockResolvedValue(null);
    passwordHasher.verify.mockResolvedValue(false);

    await expect(useCase.execute({ email: 'inconnu@example.fr', password: 'motdepasse' })).rejects.toThrow(
      new AuthenticationError(INVALID_CREDENTIALS),
    );
    expect(passwordHasher.verify).toHaveBeenCalledWith('motdepasse', null);
    expect(accessTokenIssuer.issue).not.toHaveBeenCalled();
  });

  it('refuse un mauvais mot de passe avec le même message', async () => {
    repository.findCredentialsByEmail.mockResolvedValue(credentialsOf());
    passwordHasher.verify.mockResolvedValue(false);

    await expect(useCase.execute({ email: 'marie.durand@example.fr', password: 'mauvais' })).rejects.toThrow(
      new AuthenticationError(INVALID_CREDENTIALS),
    );
    expect(accessTokenIssuer.issue).not.toHaveBeenCalled();
  });

  it('refuse un compte désactivé avec le même message, après vérification du mot de passe', async () => {
    repository.findCredentialsByEmail.mockResolvedValue(credentialsOf(false));
    passwordHasher.verify.mockResolvedValue(true);

    await expect(useCase.execute({ email: 'marie.durand@example.fr', password: 'motdepasse' })).rejects.toThrow(
      new AuthenticationError(INVALID_CREDENTIALS),
    );
    expect(passwordHasher.verify).toHaveBeenCalledWith('motdepasse', PASSWORD_HASH);
    expect(accessTokenIssuer.issue).not.toHaveBeenCalled();
  });

  it("refuse un compte dont l'email n'est pas vérifié, après vérification du mot de passe", async () => {
    repository.findCredentialsByEmail.mockResolvedValue(credentialsOf(true, false));
    passwordHasher.verify.mockResolvedValue(true);

    await expect(useCase.execute({ email: 'marie.durand@example.fr', password: 'motdepasse' })).rejects.toThrow(
      EmailNotVerifiedError,
    );
    expect(accessTokenIssuer.issue).not.toHaveBeenCalled();
  });

  it("ne révèle pas qu'un email n'est pas vérifié à qui se trompe de mot de passe", async () => {
    repository.findCredentialsByEmail.mockResolvedValue(credentialsOf(true, false));
    passwordHasher.verify.mockResolvedValue(false);

    await expect(useCase.execute({ email: 'marie.durand@example.fr', password: 'mauvais' })).rejects.toThrow(
      new AuthenticationError(INVALID_CREDENTIALS),
    );
  });
});
