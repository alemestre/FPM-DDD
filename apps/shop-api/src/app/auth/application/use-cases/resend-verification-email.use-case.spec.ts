import { ResendVerificationEmailUseCase } from './resend-verification-email.use-case';
import type { VerificationEmailSender } from '../ports/verification-email-sender';
import type { EmailVerificationToken } from '../ports/email-verification-token';
import type { UserRepository } from '../../domain/user.repository';
import { User } from '../../domain/user.entity';

const USER_ID = 'b1c2d3e4-5f60-4a7b-8c9d-0e1f2a3b4c5d';

const credentialsOf = ({ isActive = true, emailVerified = false } = {}) => ({
  user: User.reconstitute(USER_ID, 'marie.durand@example.fr', 'Marie', 'Durand', 'CUSTOMER', isActive, emailVerified),
  passwordHash: '$argon2id$hash',
});

describe('ResendVerificationEmailUseCase', () => {
  let repository: jest.Mocked<UserRepository>;
  let verificationToken: jest.Mocked<EmailVerificationToken>;
  let emailSender: jest.Mocked<VerificationEmailSender>;
  let useCase: ResendVerificationEmailUseCase;

  beforeEach(() => {
    repository = { findById: jest.fn(), findCredentialsByEmail: jest.fn(), register: jest.fn(), save: jest.fn() };
    verificationToken = { issue: jest.fn().mockResolvedValue('verification.jwt'), verify: jest.fn() };
    emailSender = { send: jest.fn() };
    useCase = new ResendVerificationEmailUseCase(repository, verificationToken, emailSender);
  });

  it('renvoie un nouveau lien à un compte actif non vérifié', async () => {
    const credentials = credentialsOf();
    repository.findCredentialsByEmail.mockResolvedValue(credentials);

    await useCase.execute('  Marie.Durand@Example.FR ');

    expect(repository.findCredentialsByEmail).toHaveBeenCalledWith('marie.durand@example.fr');
    expect(verificationToken.issue).toHaveBeenCalledWith(credentials.user);
    expect(emailSender.send).toHaveBeenCalledWith(credentials.user, 'verification.jwt');
  });

  it.each([
    ['un email inconnu', null],
    ['un email déjà vérifié', credentialsOf({ emailVerified: true })],
    ['un compte désactivé', credentialsOf({ isActive: false })],
  ])("n'envoie rien, sans erreur, pour %s", async (_case, credentials) => {
    repository.findCredentialsByEmail.mockResolvedValue(credentials);

    await expect(useCase.execute('marie.durand@example.fr')).resolves.toBeUndefined();
    expect(emailSender.send).not.toHaveBeenCalled();
  });
});
