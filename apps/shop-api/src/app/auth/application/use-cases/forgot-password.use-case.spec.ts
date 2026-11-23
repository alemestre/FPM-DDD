import type { ForgotPasswordEmailSender } from '../ports/forgot-password-email-sender';
import type { ForgotPasswordToken } from '../ports/forgot-password-token';
import { ForgotPasswordUseCase } from './forgot-password.use-case';
import type { UserRepository } from '../../domain/user.repository';
import { User } from '../../domain/user.entity';

const USER_ID = 'b1c2d3e4-5f60-4a7b-8c9d-0e1f2a3b4c5d';

const credentialsOf = ({ isActive = true, emailVerified = true } = {}) => ({
  user: User.reconstitute(USER_ID, 'marie.durand@example.fr', 'Marie', 'Durand', 'CUSTOMER', isActive, emailVerified),
  passwordHash: '$argon2id$hash',
});

describe('ForgotPasswordUseCase', () => {
  let repository: jest.Mocked<UserRepository>;
  let forgotPasswordToken: jest.Mocked<ForgotPasswordToken>;
  let emailSender: jest.Mocked<ForgotPasswordEmailSender>;
  let useCase: ForgotPasswordUseCase;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findCredentialsByEmail: jest.fn(),
      findCredentialsById: jest.fn(),
      register: jest.fn(),
      save: jest.fn(),
      savePasswordHash: jest.fn(),
    };
    forgotPasswordToken = { issue: jest.fn().mockResolvedValue('reset.jwt'), verify: jest.fn() };
    emailSender = { send: jest.fn() };
    useCase = new ForgotPasswordUseCase(repository, forgotPasswordToken, emailSender);
  });

  it('envoie un lien de réinitialisation à un compte actif, quelle que soit la casse de l\'email', async () => {
    const credentials = credentialsOf();
    repository.findCredentialsByEmail.mockResolvedValue(credentials);

    await useCase.execute('  Marie.Durand@Example.FR ');

    expect(repository.findCredentialsByEmail).toHaveBeenCalledWith('marie.durand@example.fr');
    expect(forgotPasswordToken.issue).toHaveBeenCalledWith(credentials);
    expect(emailSender.send).toHaveBeenCalledWith(credentials.user, 'reset.jwt');
  });

  it("envoie aussi le lien à un compte dont l'email n'est pas encore vérifié", async () => {
    repository.findCredentialsByEmail.mockResolvedValue(credentialsOf({ emailVerified: false }));

    await useCase.execute('marie.durand@example.fr');

    expect(emailSender.send).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['un email inconnu', null],
    ['un compte désactivé', credentialsOf({ isActive: false })],
  ])("n'envoie rien, sans erreur, pour %s", async (_case, credentials) => {
    repository.findCredentialsByEmail.mockResolvedValue(credentials);

    await expect(useCase.execute('marie.durand@example.fr')).resolves.toBeUndefined();
    expect(forgotPasswordToken.issue).not.toHaveBeenCalled();
    expect(emailSender.send).not.toHaveBeenCalled();
  });
});
